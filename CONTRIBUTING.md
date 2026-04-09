# Contributing to Victory-Verse

Thank you for your interest in contributing to Victory-Verse! This project is participating in the FOSS Weekend hackathon. Whether you're a seasoned developer or just starting with Web3, there's something for you.

## Getting Started

### 1. Prerequisites
- **Node.js**: v18 or higher
- **MetaMask**: Browser extension for interacting with the dApp
- **Foundry/Hardhat**: Basic familiarity with Ethereum development tools

### 2. Local Setup

1. **Fork and Clone the repo:**
   ```bash
   git clone https://github.com/mrunalichiban111/Victory-Verse.git
   cd Victory-Verse
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup Environment Variables:**
   Copy the example file and fill in your keys:
   ```bash
   cp .env.example .env
   ```
   > [!IMPORTANT]
   > You will need a Pinata JWT and an Alchemy API key for the Sepolia testnet to use all features.

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```

### 3. Smart Contract Development
If you're working on the Solidity contracts:
```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Run a local node
npx hardhat node
```

## Contribution Workflow

1. **Pick an Issue**: Head over to issues and find a task that catches your eye.
2. **Branching**: Create a new branch for your work:
   ```bash
   git checkout -b feature/issue-number-short-description
   ```
3. **Commit**: Keep your commits descriptive and focused on one task at a time.
4. **Push & Pull Request**: Push your branch to your fork and open a Pull Request against the `main` branch.

## Code Standards

- **React**: Use functional components and hooks. Follow the naming conventions in `src/`.
- **Solidity**: Follow the [Solidity Style Guide](https://docs.soliditylang.org/en/v0.8.20/style-guide.html). Ensure you use the Checks-Effects-Interactions pattern for state changes.
- **CSS**: The project uses Tailwind CSS. Avoid writing custom CSS unless absolutely necessary.

## Communication

Join our Discord channel (link in README) or open a discussion if you have questions about specific implementation details!

Happy Hacking!
