import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import Navbar from "../components/Navbar";
import EventManagerABI from "../contracts/EventManagerABI.json";
import { convertToGatewayUrl } from "../utils/ipfsHelpers";
import { fetchImageFromMetadata } from "../utils/ipfsHelpers";

const contractAddress = "0xfCE92d5Ae12694Bf335f85f415093fC8efEEF135";





// Skeleton Loading Components
const EventCardSkeleton = () => (
  <div className="group bg-black/30 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50 shadow-xl shadow-gray-900/20 animate-pulse">
    <div className="relative h-48 w-full bg-gray-700/50"></div>
    <div className="p-5">
      <div className="h-6 w-3/4 bg-gray-600/50 rounded mb-4"></div>
      <div className="h-10 w-full bg-gray-600/50 rounded-lg"></div>
    </div>
  </div>
);

const SectionHeaderSkeleton = () => (
  <div className="backdrop-blur-md rounded-xl px-4 py-4 mb-10 bg-gradient-to-r from-gray-900/30 via-gray-800/30 to-gray-700/30 border border-gray-700/30 animate-pulse">
    <div className="h-10 w-1/3 mx-auto bg-gray-600/50 rounded"></div>
  </div>
);

const MyEvents = () => {
  const [createdEvents, setCreatedEvents] = useState([]);
  const [participatedEvents, setParticipatedEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [navbarHeight, setNavbarHeight] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const navbar = document.querySelector("nav");
    if (navbar) {
      setNavbarHeight(navbar.offsetHeight);
    }
    
    const fetchEvents = async () => {
      if (!window.ethereum) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        const contract = new ethers.Contract(contractAddress, EventManagerABI.abi, signer);

        const count = await contract.eventCount();
        const myCreated = [];
        const myParticipated = [];

        for (let i = 1; i <= count; i++) {
          const event = await contract.events(i);

          const image = await fetchImageFromMetadata(event.meta_uri);
          const eventData = {
            id: i,
            name: event.eventName,
            creator: event.creator,
            winner: event.winner,
            winnerDeclared: event.winnerDeclared,
            meta_uri: event.meta_uri,
            img: image, 
          };

          if (event.creator.toLowerCase() === userAddress.toLowerCase()) {
            myCreated.push(eventData);
          }
          const registered = await contract.isRegistered(i, userAddress);
          if (registered) {
            myParticipated.push(eventData);
          }
        }

        setCreatedEvents(myCreated);
        setParticipatedEvents(myParticipated);
      } catch (err) {
        console.error("Error fetching events:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const openDeclareWinner = async (eventId) => {
    setSelectedEventId(eventId);
    setLoadingParticipants(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, EventManagerABI.abi, signer);
      const addresses = await contract.getParticipants(eventId);
      setParticipants(addresses);
    } catch (err) {
      console.error("Error fetching participants:", err);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const declareWinner = async (participantAddress) => {
    if (!window.ethereum || !selectedEventId) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, EventManagerABI.abi, signer);
      const tx = await contract.declareWinner(selectedEventId, participantAddress);
      await tx.wait();

      alert("Winner declared successfully!");
      setSelectedEventId(null);
      window.location.reload();
    } catch (err) {
      console.error("Declare winner error:", err);
      alert("Failed to declare winner");
    }
  };

  return (
    <div className="relative min-h-screen">
      <Navbar />

      <div
        className="relative z-0 min-h-screen text-white px-6 py-10"
        style={{
          backgroundSize: 'cover',
          backgroundAttachment: 'fixed', 
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          paddingTop: `calc(${navbarHeight}px + 2rem)`,
        }}
      >
        {/* Page title */}
        <div className="mb-16">
          <h1 className="text-6xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
            My Events
          </h1>
          <div className="w-32 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full mx-auto mt-4"></div>
        </div>

        {/* Created Events Section */}
        <section className="mb-20">
          {isLoading ? (
            <SectionHeaderSkeleton />
          ) : (
            <div className="backdrop-blur-md rounded-xl px-4 py-4 mb-10 bg-gradient-to-r from-indigo-900/30 via-purple-900/30 to-pink-900/30 border border-indigo-800/30">
              <h2 className="text-4xl font-bold text-center">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300">
                  Created Events
                </span>
              </h2>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {isLoading ? (
              Array(4).fill(0).map((_, idx) => <EventCardSkeleton key={`created-skeleton-${idx}`} />)
            ) : createdEvents.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-black/20 backdrop-blur-sm rounded-xl">
                <p className="text-gray-400">You haven't created any events yet</p>
              </div>
            ) : (
              createdEvents.map((event) => (
                <div
                  key={event.id}
                  className="group bg-black/30 backdrop-blur-sm rounded-xl overflow-hidden border border-indigo-800/50 shadow-xl shadow-purple-900/20 transition duration-300 hover:shadow-purple-700/30 hover:border-purple-600/70 hover:scale-102"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={event.img}
                      alt={event.name}
                      className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/400x200?text=Image+Not+Available";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <div className="absolute bottom-3 left-4">
                      <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs px-2 py-1 rounded-md">
                        Event #{event.id}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-white mb-2 tracking-wide">{event.name}</h3>
                    
                    {event.winnerDeclared ? (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div>
                          <p className="text-green-400 font-medium">Winner Declared</p>
                        </div>
                        <p className="text-sm text-gray-300">
                          <span className="text-xs text-gray-400">Winner Address:</span><br />
                          <span className="text-white/80 font-mono">
                            {event.winner.slice(0, 6)}...{event.winner.slice(-4)}
                          </span>
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={() => openDeclareWinner(event.id)}
                        className="mt-4 w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-medium transition-colors duration-300 shadow-md shadow-indigo-900/30"
                      >
                        Declare Winner
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Participated Events Section */}
        <section className="mb-16">
          {isLoading ? (
            <SectionHeaderSkeleton />
          ) : (
            <div className="backdrop-blur-md rounded-xl px-4 py-4 mb-10 bg-gradient-to-r from-purple-900/30 via-pink-900/30 to-fuchsia-900/30 border border-pink-800/30">
              <h2 className="text-4xl font-bold text-center">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-pink-300">
                  Participated Events
                </span>
              </h2>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {isLoading ? (
              Array(4).fill(0).map((_, idx) => <EventCardSkeleton key={`participated-skeleton-${idx}`} />)
            ) : participatedEvents.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-black/20 backdrop-blur-sm rounded-xl">
                <p className="text-gray-400">You haven't participated in any events yet</p>
              </div>
            ) : (
              participatedEvents.map((event) => (
                <div
                  key={event.id}
                  className="group bg-black/30 backdrop-blur-sm rounded-xl overflow-hidden border border-pink-800/30 shadow-xl shadow-pink-900/20 transition duration-300 hover:shadow-pink-700/30 hover:border-pink-600/50"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={event.img}
                      alt={event.name}
                      className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/400x200?text=Image+Not+Available";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <div className="absolute bottom-3 left-4">
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs px-2 py-1 rounded-md">
                        Event #{event.id}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-xl font-bold text-white mb-1">{event.name}</h3>
                    {event.winnerDeclared && event.winner.toLowerCase() === event.creator.toLowerCase() && (
                      <div className="mt-2 flex items-center">
                        <span className="text-xs bg-pink-500/20 border border-pink-500/50 text-pink-300 px-2 py-0.5 rounded-full">
                          🏆 You Won!
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Winner Selection Modal */}
        {selectedEventId && (
          <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-gray-900 to-indigo-900/80 p-6 rounded-2xl w-96 border border-indigo-600/50 shadow-2xl shadow-indigo-600/30">
              <h3 className="text-2xl font-bold text-white mb-6">Select Winner</h3>
              
              {loadingParticipants ? (
                <div className="py-10 flex flex-col items-center">
                  <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-indigo-300">Loading participants...</p>
                </div>
              ) : participants.length > 0 ? (
                <ul className="space-y-3 max-h-80 overflow-y-auto pb-2">
                  {participants.map((addr, idx) => (
                    <li 
                      key={idx} 
                      className="flex justify-between items-center bg-black/50 hover:bg-indigo-900/30 px-4 py-3 rounded-lg border border-indigo-800/50 transition duration-200"
                    >
                      <span className="text-sm font-mono text-indigo-200">{addr.slice(0, 6)}...{addr.slice(-4)}</span>
                      <button
                        onClick={() => declareWinner(addr)}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-4 py-1.5 rounded-lg text-sm transition-colors duration-300"
                      >
                        Choose Winner
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-10 text-center">
                  <p className="text-gray-300">No participants registered for this event</p>
                </div>
              )}
              
              <div className="mt-6 flex justify-end">
                <button
                  className="px-4 py-2 text-indigo-300 hover:text-white transition-colors duration-200"
                  onClick={() => setSelectedEventId(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyEvents;