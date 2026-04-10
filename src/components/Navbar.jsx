import './Navbar.css';
import logo1 from '../assets/logo1.png';
import React, { useState, useEffect, useContext } from 'react';
import { WalletContext } from '../context/WalletContext';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const { walletAddress, setWalletAddress } = useContext(WalletContext);

  // Check if MetaMask is already connected
  useEffect(() => {
    if (!window.ethereum) return;

    const checkConnectedWallet = async () => {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts'
        });

        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          setWalletAddress('');
        }
      } catch (error) {
        console.error('Failed to fetch accounts:', error);
      }
    };

    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
      } else {
        setWalletAddress('');
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    checkConnectedWallet();

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener(
        'accountsChanged',
        handleAccountsChanged
      );
      window.ethereum.removeListener(
        'chainChanged',
        handleChainChanged
      );
    };
  }, [setWalletAddress]);
  
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        setWalletAddress(accounts[0]);
      } catch (err) {
        console.error('User rejected the request');
      }
    } else {
      alert('MetaMask not found. Please install it!');
    }
  };

  return (
    <nav className="fixed w-full top-0 left-0 z-50 bg-black/80  border-b border-gray-800/50 shadow-lg">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <img src={logo1} alt="" className="logo h-10" />
        </div>
        
        <ul className="flex items-center space-x-4">
          <li>
            <Link to='/'>
              <button className="relative inline-block px-4 py-2 font-medium rounded-lg group transition-all duration-300 hover:bg-indigo-900/30">
                <span className="relative z-10 text-white/90 hover:text-white">Home</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-400 transition-all duration-300 group-hover:w-full"></span>
              </button>
            </Link>
          </li>

          <li>
            <Link to='/myevents'>
              <button className="relative inline-block px-4 py-2 font-medium rounded-lg group transition-all duration-300 hover:bg-purple-900/30">
                <span className="relative z-10 text-white/90 hover:text-white">My Events</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-400 transition-all duration-300 group-hover:w-full"></span>
              </button>
            </Link>
          </li>

          <li>
            <Link to='/nftandtokens'>
              <button className="relative inline-block px-4 py-2 font-medium rounded-lg group transition-all duration-300 hover:bg-pink-900/30">
                <span className="relative z-10 text-white/90 hover:text-white">NFTs & Tokens</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-pink-400 transition-all duration-300 group-hover:w-full"></span>
              </button>
            </Link>
          </li>

          <li>
            <button
              onClick={connectWallet}
              className="px-4 py-2 font-medium rounded-lg bg-gradient-to-r from-indigo-600/80 to-purple-600/80 text-white hover:from-indigo-500/80 hover:to-purple-500/80 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/20 border border-indigo-500/30 relative overflow-hidden group"
            >
              <span className="relative z-10">
                {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connect Wallet'}
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-500/40 to-purple-500/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;