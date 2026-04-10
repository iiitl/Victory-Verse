

import React, { useEffect, useState, useContext } from "react";
import { ethers } from "ethers";
import Navbar from "../components/Navbar";
import { WalletContext } from "../context/WalletContext";
import EventManagerABI from "../contracts/EventManagerABI.json";
import { convertToGatewayUrl, fetchImageFromMetadata } from "../utils/ipfsHelpers";

const contractAddress = "0xfCE92d5Ae12694Bf335f85f415093fC8efEEF135";

// Convert an IPFS URI (ipfs://CID) to a gateway URL (using ipfs.io)


const DeclareWinnerPage = () => {
  const { walletAddress } = useContext(WalletContext);
  const [myEvents, setMyEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [selectedWinner, setSelectedWinner] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMyEvents = async () => {
      if (!window.ethereum || !walletAddress) return;
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        const contract = new ethers.Contract(contractAddress, EventManagerABI.abi, signer);

        const eventCount = await contract.eventCount();
        let events = [];
        for (let i = 1; i <= eventCount; i++) {
          const eventData = await contract.events(i);

          if (
            eventData.creator.toLowerCase() === userAddress.toLowerCase() &&
            !eventData.winnerDeclared
          ) {

            const imageUrl = await fetchImageFromMetadata(eventData.meta_uri);
            events.push({
              id: eventData.id.toString(),
              eventName: eventData.eventName,
              img: imageUrl, 
              meta_uri: eventData.meta_uri,
            });
          }
        }
        setMyEvents(events);
      } catch (error) {
        console.error("Error fetching my events:", error);
      }
    };

    fetchMyEvents();
  }, [walletAddress]);

  const handleDeclareClick = async (eventId) => {
    if (!window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, EventManagerABI.abi, signer);
      const parts = await contract.getParticipants(eventId);
      setParticipants(parts);
      setSelectedEventId(eventId);
      setSelectedWinner(""); // reset selection
    } catch (error) {
      console.error("Error fetching participants:", error);
    }
  };

  const handleWinnerSelection = (winnerAddress) => {
    setSelectedWinner(winnerAddress);
  };

  const handleConfirmWinner = async () => {
    if (!selectedEventId || !selectedWinner) {
      alert("Please select an event and a winner.");
      return;
    }
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, EventManagerABI.abi, signer);

      const tx = await contract.declareWinner(selectedEventId, selectedWinner);
      await tx.wait();
      alert("Winner declared successfully!");

      setMyEvents(myEvents.filter((event) => event.id !== selectedEventId.toString()));
      setSelectedEventId(null);
      setParticipants([]);
      setSelectedWinner("");
    } catch (error) {
      console.error("Error declaring winner:", error);
      alert("Error declaring winner. See console for details.");
    }
    setLoading(false);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen p-6 text-white">
        <h1 className="text-4xl font-bold mb-6">My Events (Declare Winner)</h1>
        {myEvents.length === 0 ? (
          <p>No active events found for winner declaration.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {myEvents.map((event) => (
              <div key={event.id} className="bg-gray-900 rounded-xl p-4 shadow-lg">
                <img
                  src={event.img}
                  alt={event.eventName}
                  className="w-full h-40 object-cover rounded"
                />
                <h3 className="text-2xl mt-3">{event.eventName}</h3>
                <p>Event ID: {event.id}</p>
                <button
                  onClick={() => handleDeclareClick(event.id)}
                  className="mt-4 py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded"
                >
                  Declare Winner
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedEventId && (
          <div className="mt-10 bg-gray-800 p-6 rounded shadow-lg">
            <h2 className="text-3xl font-bold mb-4">
              Select Winner for Event ID {selectedEventId}
            </h2>
            {participants.length === 0 ? (
              <p>No participants registered for this event.</p>
            ) : (
              <ul className="space-y-3">
                {participants.map((addr, idx) => (
                  <li
                    key={idx}
                    onClick={() => handleWinnerSelection(addr)}
                    className={`p-3 border rounded cursor-pointer ${
                      selectedWinner === addr ? "bg-green-600" : "bg-gray-700"
                    }`}
                  >
                    {addr.slice(0, 6)}...{addr.slice(-4)}
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={handleConfirmWinner}
              disabled={loading || !selectedWinner}
              className="mt-6 py-2 px-6 bg-purple-600 hover:bg-purple-700 rounded"
            >
              {loading ? "Processing..." : "Confirm Winner"}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default DeclareWinnerPage;
