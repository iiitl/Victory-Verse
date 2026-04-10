import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import Navbar from "../components/Navbar";
import EventManagerABI from "../contracts/EventManagerABI.json";
import { fetchImageFromMetadata } from "../utils/ipfsHelpers";

const contractAddress = "0xfCE92d5Ae12694Bf335f85f415093fC8efEEF135";


const NFTAndTokens = () => {
  const [events, setEvents] = useState([]);
  const [buyAmounts, setBuyAmounts] = useState({});
  const [sortOrder, setSortOrder] = useState("default");
  const [loading, setLoading] = useState(true);
  const [navbarHeight, setNavbarHeight] = useState(0);

  useEffect(() => {
    const navbar = document.querySelector("nav");
    if (navbar) setNavbarHeight(navbar.offsetHeight);
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    if (!window.ethereum) return;
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, EventManagerABI.abi, signer);

      const count = await contract.eventCount();
      const all = [];

      for (let i = 1; i <= count; i++) {
        const eventData = await contract.events(i);
        if (eventData.winner === "0x0000000000000000000000000000000000000000") continue;

        const imageUrl = await fetchImageFromMetadata(eventData.meta_uri, { convertImage: true });
        all.push({
          id: i,
          name: eventData.eventName,
          winner: eventData.winner,
          img: imageUrl,
          tokenPrice: ethers.formatEther(eventData.fanTokenPrice),
          tokenAddress: eventData.fanTokenAddress,
        });
      }

      setEvents(all);
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  };

  const getSortedEvents = () => {
    switch (sortOrder) {
      case "highToLow":
        return [...events].sort((a, b) => parseFloat(b.tokenPrice) - parseFloat(a.tokenPrice));
      case "lowToHigh":
        return [...events].sort((a, b) => parseFloat(a.tokenPrice) - parseFloat(b.tokenPrice));
      default:
        return events;
    }
  };

  const handleBuyTokens = async (eventId, priceInETH) => {
    if (!window.ethereum) return;
    const amount = buyAmounts[eventId] || 0;
    if (amount <= 0) return alert("Enter a valid amount");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, EventManagerABI.abi, signer);

      const totalCost = ethers.parseEther((amount * parseFloat(priceInETH)).toString());
      const tx = await contract.purchaseFanTokens(eventId, amount, { value: totalCost });
      await tx.wait();

      alert(`Successfully bought ${amount} tokens for event #${eventId}`);
      fetchEvents(); // Refresh event data after purchase
    } catch (error) {
      console.error("Token purchase failed:", error);
      alert("Failed to purchase tokens.");
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="px-6 py-10" style={{ paddingTop: `calc(${navbarHeight}px + 2rem)` }}>
        <section className="mb-16">
        <div className="relative mb-8">
          <h2 className="text-5xl font-bold text-center font-circular-web">🎫 Fan Tokens</h2>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <label htmlFor="sort" className="text-gray-300 font-circular-web">Sort by price:</label>
            <select
              id="sort"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded-md px-3 py-1 text-white"
              disabled={loading}
            >
              <option value="default">Default</option>
              <option value="lowToHigh">Low to High</option>
              <option value="highToLow">High to Low</option>
            </select>
          </div>
        </div>



          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {loading ? (
              Array(4).fill(0).map((_, index) => (
                <div key={index} className="bg-gray-800 p-5 rounded-xl animate-pulse h-80" />
              ))
            ) : (
              getSortedEvents().map((event) => (
                <div key={event.id} className="bg-gray-900 rounded-xl p-5 shadow-lg hover:shadow-2xl transition">
                  <img
                    src={event.img}
                    alt={event.name}
                    className="w-full h-48 object-cover rounded-md mb-4"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/300x200?text=Image+Not+Available";
                    }}
                  />
                  <h3 className="text-lg font-semibold">{event.name}</h3>
                  <p className="text-xs text-gray-400 mt-1">Token Address:</p>
                  <p className="text-xs break-words text-gray-500">{event.tokenAddress}</p>
                  <p className="mt-2 text-sm text-gray-300">Price: {event.tokenPrice} ETH / token</p>
                  <div className="mt-4 flex flex-col gap-2">
                    <input
                      type="number"
                      placeholder="Enter number of tokens"
                      value={buyAmounts[event.id] || ""}
                      onChange={(e) => setBuyAmounts({ ...buyAmounts, [event.id]: e.target.value })}
                      className="bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white placeholder-gray-400"
                    />
                    <button
                      onClick={() => handleBuyTokens(event.id, event.tokenPrice)}
                      className="bg-blue-600 hover:bg-blue-500 text-white rounded-md py-2 font-medium font-circular-web"
                    >
                      Buy Tokens
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* NFT WINNERS SECTION */}
        <section>
          <h2 className="text-5xl font-bold mb-8 text-center font-robert-medium">🏆 NFTs Minted to Winners</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {loading ? (
              Array(4).fill(0).map((_, index) => (
                <div key={index} className="bg-gray-800 h-72 rounded-xl animate-pulse" />
              ))
            ) : (
              events.map((event) => (
                <div key={event.id} className="bg-gray-900 rounded-xl shadow-lg hover:shadow-2xl overflow-hidden">
                  <img
                    src={event.img}
                    alt={event.name}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/300x200?text=Image+Not+Available";
                    }}
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-semibold">{event.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">Winner: {event.winner.slice(0, 6)}...{event.winner.slice(-4)}</p>
                    <p className="text-xs text-gray-500 mt-1">NFT ID: #{event.id}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default NFTAndTokens;
