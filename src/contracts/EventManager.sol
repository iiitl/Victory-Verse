// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EventManager is ERC721URIStorage, Ownable {
    uint256 public eventCount;
    uint256 public tokenIdCounter;

    mapping(uint256 => mapping(address => bool)) public isRegistered;
    mapping(address => mapping(uint256 => uint256)) public userNFTs;
    mapping(address => mapping(uint256 => uint256)) public userFanTokenBalance;

    event EventCreated(uint256 indexed eventId, address indexed creator, string eventName);
    event ParticipantRegistered(uint256 indexed eventId, address indexed participant);
    event WinnerDeclared(uint256 indexed eventId, address indexed winner, uint256 tokenId);
    event FanTokensPurchased(uint256 indexed eventId, address indexed buyer, uint256 amount, uint256 cost);

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
    }

    mapping(uint256 => EventInfo) public events;
    mapping(uint256 => address[]) public eventParticipants;

    constructor() ERC721("EventNFT", "EVNT") Ownable(msg.sender) {}

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

        emit EventCreated(eventCount, msg.sender, _name);
        return eventCount;
    }

    function registerForEvent(uint256 _eventId) public {
        EventInfo storage e = events[_eventId];
        require(msg.sender!=e.creator,"Creator cannot register as participant");
        require(!e.winnerDeclared, "Event concluded");
        require(!isRegistered[_eventId][msg.sender], "Already registered");

        isRegistered[_eventId][msg.sender] = true;
        eventParticipants[_eventId].push(msg.sender);
        emit ParticipantRegistered(_eventId, msg.sender);
    }

    function declareWinner(uint256 _eventId, address _winner) public {
        EventInfo storage e = events[_eventId];
        require(_winner!=e.creator,"Creator cannot be declared winner");
        require(eventParticipants[_eventId].length>=2,"Need at least 2");
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