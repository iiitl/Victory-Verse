require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
// const contractAddress = process.env.NEXT_PUBLIC_DEPLOYED_ADDRESS;
// const apiURL = process.env.NEXT_PUBLIC_API_URL
const {PRIVATE_KEY} = process.env.PRIVATE_KEY
const ALCHEMY_SEPOLIA_RPC_URL = process.env.ALCHEMY_SEPOLIA_RPC_URL

module.exports = {
  solidity: "0.8.20",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    sepolia: {
      url: ALCHEMY_SEPOLIA_RPC_URL,
      accounts: [`0x${PRIVATE_KEY}`]
    }
  }
};