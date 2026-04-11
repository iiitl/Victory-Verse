

import React, { useState, useContext } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import bgImage from "../assets/event-bg.jpg";
import { WalletContext } from "../context/WalletContext";
import { ethers } from "ethers";
import EventManagerABI from "../contracts/EventManagerABI.json";
import { uploadToPinata } from "../utils/UploadToPinata";
import { createAndUploadMetadata } from "../utils/UploadMetadataToPinata";

const CreateEvent = () => {
    const { walletAddress } = useContext(WalletContext);
    const [bannerFile, setBannerFile] = useState(null);
    const contractAddress = "0xfCE92d5Ae12694Bf335f85f415093fC8efEEF135";
    const [metadataCID, setMetadataCID] = useState("");
    const [image, setImage] = useState("");

    const [event, setEvent] = useState({
        name: '',
        logo: '',
        WinnerTokenAmount: '',
        FanTokenAmount: '',
        FanTokenPrice: '',
        description: '',
    });

    const handleChange = (e) => {
        setEvent({ ...event, [e.target.name]: e.target.value });
    };

    // Handle file input change
    const handleFileChange = (e) => {
        setBannerFile(e.target.files[0]);
    };

    // Converts ipfs:// CID to a gateway URL 
    const convertToGatewayUrl = (ipfsUri) => {
        return ipfsUri.replace("ipfs://", "https://ipfs.io/ipfs/");
    };
    const [errors, setErrors] = useState({});
    const validateForm = () => {
        const newErrors = {};

        if (!bannerFile) {
            newErrors.banner = "Please upload a banner image.";
        }

        const winnerTokens = parseFloat(event.WinnerTokenAmount);
        const fanTokens = parseFloat(event.FanTokenAmount);
        const fanPrice = parseFloat(event.FanTokenPrice);

        if (!winnerTokens || winnerTokens <= 0) {
            newErrors.winnerTokens = "Winner token amount must be greater than 0.";
        } else if (!Number.isInteger(winnerTokens)) {
            newErrors.winnerTokens = "Winner token amount must be a whole number.";
        }

        if (!fanTokens || fanTokens <= 0) {
            newErrors.fanTokens = "Fan token amount must be greater than 0.";
        } else if (!Number.isInteger(fanTokens)) {
            newErrors.fanTokens = "Fan token amount must be a whole number.";
        }

        if (!fanPrice || fanPrice <= 0) {
            newErrors.fanPrice = "Fan token price must be greater than 0.";
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
        };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!walletAddress) {
            alert("Please connect your wallet first!");
            return;
        }
        if (!validateForm()) return; 

        try {
            // Upload the banner file and retrieve its URL
            const fileUrl = await uploadToPinata(bannerFile);
            console.log("File URL:", fileUrl);

            // Create metadata JSON with event name, description, and file URL
            const cid = await createAndUploadMetadata(event.name, event.description, fileUrl);
            setMetadataCID(cid);
            console.log("Metadata CID:", cid);

            // Use the metadata URI (you can form it as ipfs://CID or use a gateway URL)
            const metadataURI = `ipfs://${cid}`;

            const _provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await _provider.getSigner();
            const contract = new ethers.Contract(contractAddress, EventManagerABI.abi, signer);

            const tx = await contract.createEvent(
                event.name,
                ethers.parseEther(event.WinnerTokenAmount),
                ethers.parseEther(event.FanTokenAmount),
                ethers.parseEther(event.FanTokenPrice.toString()),
                metadataURI,
                event.description
            );

            await tx.wait();
            alert("Event created successfully!");
        } catch (error) {
            console.error("Error creating event:", error);
            alert("Transaction failed. See console.");
        }
    };

    return (
        <>
            <Navbar />
            <br />

            <div
                className="relative min-h-screen bg-cover bg-center bg-no-repeat text-white flex items-center justify-end"
                style={{ backgroundImage: `url(${bgImage})` }}
            >
                <div className="absolute left-12 max-w-xl text-left space-y-6">
                    <motion.h1
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-5xl font-bold text-cyan-400 leading-tight drop-shadow-lg"
                    >
                        Welcome to VictoryVerse
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="text-lg text-gray-300 max-w-md backdrop-blur-sm bg-black bg-opacity-30 p-4 rounded-lg border border-cyan-800 shadow-md"
                    >
                        A decentralized platform where events meet innovation. Create, mint, and showcase your event NFTs in the metaverse. Own your moment. Shape your legacy.
                    </motion.p>
                </div>

                <motion.form
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="backdrop-blur-lg bg-gradient-to-br from-gray-900/70 to-blue-900/50 rounded-3xl shadow-2xl px-10 py-12 w-full max-w-xl space-y-8 mr-12 mt-20 border border-indigo-500/30"
                >
                    <div className="text-center space-y-2">
                        <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                            Create New Event
                        </h2>
                        <p className="text-sm text-gray-400">Shape your event in the metaverse</p>
                    </div>

                    <div className="space-y-6">
                        {/* Event Name */}
                        <div className="space-y-1">
                            <label className="text-sm text-cyan-300">Event Name</label>
                            <input
                                type="text"
                                name="name"
                                value={event.name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-black/30 text-white rounded-xl border border-gray-700 focus:border-cyan-400 focus:ring-0 transition-all duration-300"
                                required
                            />
                        </div>

                        {/* Token Amount Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm text-cyan-300">Winner Token Amount</label>
                                <input
                                    type="number"
                                    name="WinnerTokenAmount"
                                    value={event.WinnerTokenAmount}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-black/30 text-white rounded-xl border border-gray-700 focus:border-cyan-400 focus:ring-0"
                                    required
                                />
                                {errors.winnerTokens && (
                                    <p className="text-red-500 text-sm mt-1">{errors.winnerTokens}</p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm text-cyan-300">Fan Token Amount</label>
                                <input
                                    type="number"
                                    name="FanTokenAmount"
                                    value={event.FanTokenAmount}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-black/30 text-white rounded-xl border border-gray-700 focus:border-cyan-400 focus:ring-0"
                                    required
                                />
                                {errors.fanTokens && (
                                    <p className="text-red-500 text-sm mt-1">{errors.fanTokens}</p>
                                )}
                            </div>
                        </div>

                        {/* Fan Token Price */}
                        <div className="space-y-1">
                            <label className="text-sm text-cyan-300">Fan Token Price </label>
                            <input
                                type="number"
                                name="FanTokenPrice"
                                value={event.FanTokenPrice}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-black/30 text-white rounded-xl border border-gray-700 focus:border-cyan-400 focus:ring-0"
                                required
                            />
                            {errors.fanPrice && (
                                <p className="text-red-500 text-sm mt-1">{errors.fanPrice}</p>
                            )}
                        </div>

                        {/* Description */}
                        <div className="space-y-1">
                            <label className="text-sm text-cyan-300">Event Description</label>
                            <textarea
                                name="description"
                                value={event.description}
                                onChange={handleChange}
                                rows="4"
                                className="w-full px-4 py-3 bg-black/30 text-white rounded-xl border border-gray-700 focus:border-cyan-400 focus:ring-0 resize-none"
                                required
                            />
                        </div>

                        {/* File Upload (unchanged) */}
                        <div className="space-y-2">
                            <label className="block text-sm text-cyan-300">Event Banner</label>
                            <div className="flex items-center justify-center w-full">
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer bg-black/20 hover:border-cyan-400 transition">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        {bannerFile ? (
                                            <p className="text-sm text-gray-400">{bannerFile.name}</p>
                                        ) : (
                                            <>
                                                <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                                                </svg>
                                                <p className="text-sm text-gray-400">Click to upload</p>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    {errors.banner && (
                                        <p className="text-red-500 text-sm mt-1">{errors.banner}</p>
                                    )}
                                </label>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium rounded-xl shadow-lg transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-cyan-300/50"
                    >
                        Create Event
                    </button>
                </motion.form>
            </div>
        </>
    );
};

export default CreateEvent;
