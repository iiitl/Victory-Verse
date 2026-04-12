// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {VRFConsumerBaseV2Plus} from "@chainlink/contracts@1.3.0/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts@1.3.0/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract EventManager is ERC721URIStorage, VRFConsumerBaseV2Plus {
    uint256 public eventCount;
    uint256 public tokenIdCounter;

    mapping(uint256 => mapping(address => bool)) public isRegistered;
    mapping(address => mapping(uint256 => uint256)) public userNFTs;
    mapping(address => mapping(uint256 => uint256)) public userFanTokenBalance;

    event EventCreated(uint256 indexed eventId, address indexed creator, string eventName);
    event ParticipantRegistered(uint256 indexed eventId, address indexed participant);
    event WinnerDeclared(uint256 indexed eventId, address indexed winner, uint256 tokenId);
    event FanTokensPurchased(uint256 indexed eventId, address indexed buyer, uint256 amount, uint256 cost);
    event RandomWordRequested(uint256 indexed requestId, uint256 indexed eventId);
    event RandomWordFulfilled(uint256 indexed requestId, uint256 indexed winnerIndex);
    event VRFResultCancelled(uint256 indexed requestId, uint256 indexed eventId);

    struct EventInfo {
        uint256 id;
        address creator;
        string eventName;
        string meta_uri;
        bool winnerDeclared;
        address winner;
        uint256 winnerTokenAmount;
        uint256 fanTokenAmount;
        uint256 fanTokenPrice; // in wei
        address fanTokenAddress;
        string description;
        bool useVRF;
    }

    uint256 public s_subscriptionId;
    address public vrfCoordinator;
    bytes32 public keyHash;
    uint32 public callbackGasLimit = 40000;
    uint16 public requestConfirmations = 3;
    uint32 public numWords = 1;

    mapping(uint256 => EventInfo) public events;
    mapping(uint256 => address[]) public eventParticipants;
    mapping(uint256 => uint256) public Requestors;
    mapping(uint256 => uint256) public Results;
    mapping(uint256 => uint256) public requestIdToBlockNumber;

    constructor(address _vrfCoordinator, uint256 subscriptionId, bytes32 _keyHash) ERC721("EventNFT", "EVNT")
    VRFConsumerBaseV2Plus(_vrfCoordinator){
        s_subscriptionId = subscriptionId;
        keyHash = _keyHash;
        vrfCoordinator = _vrfCoordinator;
    }

    function createEvent(
        string memory _name,
        uint256 _winnerTokenAmount,
        uint256 _fanTokenAmount,
        uint256 _fanTokenPrice,
        string memory _meta_uri,
        string memory _description
    ) public returns (uint256) {
        eventCount++;

        EventToken token = new EventToken(_name, "EVT", address(this));

        EventInfo storage e = events[eventCount];
        e.id = eventCount;
        e.creator = msg.sender;
        e.eventName = _name;
        e.winnerDeclared = false;
        e.winner = address(0);
        e.winnerTokenAmount = _winnerTokenAmount;
        e.fanTokenAmount = _fanTokenAmount;
        e.fanTokenPrice = _fanTokenPrice;
        e.fanTokenAddress = address(token);
        e.meta_uri = _meta_uri;
        e.description = _description;
        e.useVRF = false;

        emit EventCreated(eventCount, msg.sender, _name);
        return eventCount;
    }

    function registerForEvent(uint256 _eventId) public {
        EventInfo storage e = events[_eventId];
        require(!e.winnerDeclared, "Event concluded");
        require(!isRegistered[_eventId][msg.sender], "Already registered");

        isRegistered[_eventId][msg.sender] = true;
        eventParticipants[_eventId].push(msg.sender);
        emit ParticipantRegistered(_eventId, msg.sender);
    }

    bool TLE;

    function requestRandomWinner(uint256 _eventId) public returns (uint256 requestId) {
        EventInfo storage e = events[_eventId];
        require(msg.sender == e.creator, "Only event host can request winner");
        require(!e.winnerDeclared, "Winner already declared");
        require(eventParticipants[_eventId].length > 0, "No participants registered");

        requestId = s_vrfCoordinator.requestRandomWords(
        VRFV2PlusClient.RandomWordsRequest({
            keyHash: keyHash,
            subId: s_subscriptionId,
            requestConfirmations: requestConfirmations,
            callbackGasLimit: callbackGasLimit,
            numWords: numWords,
            extraArgs: VRFV2PlusClient._argsToBytes(
                VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
            )
        })
     );

       Requestors[requestId] = _eventId;
       Results[requestId] = eventParticipants[_eventId].length;
       requestIdToBlockNumber[requestId] = block.number;

       emit RandomWordRequested(requestId, _eventId);

    }

    function fulfillRandomWords( uint256 requestId, uint256[] calldata randomWords) internal override {

      uint256 _eventId = Requestors[requestId];
      EventInfo storage e = events[_eventId];

    if(eventParticipants[_eventId].length == 0) {

        emit VRFResultCancelled(requestId, _eventId);
        return;
     }

    if(block.number > requestIdToBlockNumber[requestId] + 256){
        TLE = true;
        return;
     }

     uint256 winnerIndex = randomWords[0] % Results[requestId];
     Results[requestId] = winnerIndex;

     e.winner = eventParticipants[_eventId][winnerIndex];
     e.useVRF = true;

     emit RandomWordFulfilled(requestId, winnerIndex);
     
    }

    function cancelVRFRequest(uint256 requestId) internal{

        require(TLE == true, "waiting for VRF request");
        uint256 _eventId = Requestors[requestId];
        EventInfo storage e = events[eventCount];
        TLE = false;

        require(msg.sender == e.creator, "Only creator can cancel");
        require(e.useVRF == true, "VRF not used");
        require(block.number > requestIdToBlockNumber[requestId] + 256,"VRF request still pending");

        delete Requestors[requestId];
        delete Results[requestId];
        delete requestIdToBlockNumber[requestId];

        emit VRFResultCancelled(requestId, _eventId);

        requestRandomWinner(_eventId);

    }


    function _declareWinner(uint256 _eventId) public {
        EventInfo storage e = events[_eventId];
        require(e.useVRF==true, "VRF not used");
        require(msg.sender == e.creator, "Not creator");
        require(!e.winnerDeclared, "Already declared");
        require(isRegistered[_eventId][e.winner], "Winner not registered");
        
        e.winnerDeclared = true;
        tokenIdCounter++;
        _mint(e.winner, tokenIdCounter);
        _setTokenURI(tokenIdCounter, e.meta_uri);
        userNFTs[e.winner][_eventId] = tokenIdCounter;

        EventToken token = EventToken(e.fanTokenAddress);
        token.mint(e.winner, e.winnerTokenAmount);
        token.mint(address(this), e.fanTokenAmount);
        userFanTokenBalance[e.winner][_eventId] += e.winnerTokenAmount;

        emit WinnerDeclared(_eventId, e.winner, tokenIdCounter);
    }

    function declareWinner(uint256 _eventId, address _winner) public {
        EventInfo storage e = events[_eventId];
        require(e.useVRF==false, "VRF is used");
        require(msg.sender == e.creator, "Not creator");
        require(!e.winnerDeclared, "Already declared");
        require(isRegistered[_eventId][_winner], "Winner not registered");
        
        e.winner = _winner;
        e.winnerDeclared = true;

        tokenIdCounter++;
        _mint(_winner, tokenIdCounter);
        _setTokenURI(tokenIdCounter, e.meta_uri);
        userNFTs[_winner][_eventId] = tokenIdCounter;

        EventToken token = EventToken(e.fanTokenAddress);
        token.mint(_winner, e.winnerTokenAmount);
        token.mint(address(this), e.fanTokenAmount);
        userFanTokenBalance[_winner][_eventId] += e.winnerTokenAmount;

        emit WinnerDeclared(_eventId, _winner, tokenIdCounter);
    }

    function purchaseFanTokens(uint256 _eventId, uint256 _amount) public payable {
        EventInfo storage e = events[_eventId];
        require(e.winnerDeclared, "Event not concluded");

        uint256 cost = e.fanTokenPrice * _amount;
        require(msg.value >= cost, "Insufficient payment");

        EventToken token = EventToken(e.fanTokenAddress);
        require(token.balanceOf(address(this)) >= _amount, "Not enough tokens");

        token.transfer(msg.sender, cost);
        userFanTokenBalance[msg.sender][_eventId] += _amount;

        if (msg.value > cost) {
            payable(msg.sender).transfer(msg.value - cost);
        }

        // Increase price by 1%
        e.fanTokenPrice = (e.fanTokenPrice * (100 + _amount)) / 100;

        emit FanTokensPurchased(_eventId, msg.sender, _amount, cost);
    }

    function getAllEvents() public view returns (EventInfo[] memory) {
        EventInfo[] memory allEvents = new EventInfo[](eventCount);
        for (uint256 i = 1; i <= eventCount; i++) {
            allEvents[i - 1] = events[i];
        }
        return allEvents;
    }

    function getParticipants(uint256 _eventId) public view returns (address[] memory) {
        return eventParticipants[_eventId];
    }
}

contract EventToken is ERC20, Ownable {
    constructor(
        string memory name,
        string memory symbol,
        address ownerAddress
    ) ERC20(name, symbol) Ownable(ownerAddress) {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function decimals() public view virtual override returns (uint8) {
        return 18;
    }
}