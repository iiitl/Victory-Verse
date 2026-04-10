require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
const contractAddress = process.env.NEXT_PUBLIC_DEPLOYED_ADDRESS;
const apiURL = process.env.NEXT_PUBLIC_API_URL
const {PRIVATE_KEY} = process.env


module.exports = {
  solidity:{
  version: "0.8.28",
  settings: {
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 200, 
      },
    },
  },

  paths: {
  sources: "./src/contracts",
  },
    
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/TIQo3Gz2f1382f0_Q3vPUgpkUQ0-8KD1",
      accounts: [PRIVATE_KEY]
    }
  }
};