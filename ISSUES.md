# VictoryVerse — FOSS Weekend Hackathon Issues

Welcome to the VictoryVerse hackathon! Below is the curated list of issues for you to tackle. These issues are anchored in the actual codebase—no made-up scenarios.

---

## Issue Summary Table

| # | Title | Difficulty | Category |
|---|-------|-----------|----------|
| [1](#issue-1) | Extract duplicate IPFS utility into shared module | Easy | Optimization |
| [2](#issue-2) | Handle wallet account/chain change events | Easy | Bug |
| [3](#issue-3) | Form validation + `parseEther` misuse fix | Easy | Bug |
| [4](#issue-4) | Paginated event fetching in contract + frontend | Medium | Optimization |
| [5](#issue-5) | ETH revenue withdrawal mechanism missing | Medium | Bug/Security |
| [6](#issue-6) | Token transfer amount bug + broken bonding curve | Medium | Bug/Security |
| [7](#issue-7) | Hardcoded Pinata JWT and Alchemy API keys | Medium | Security |
| [8](#issue-8) | Creator self-dealing vulnerability | Medium | Security |
| [9](#issue-9) | Full Hardhat test suite for EventManager.sol | Hard | Testing |
| [10](#issue-10) | Parallel batch fetching + IPFS retry logic | Hard | Optimization |
| [11](#issue-11) | Upgrade WalletContext to full Web3 context | Hard | Feature |
| [12](#issue-12) | Bonding curve truncation + overflow protection | Hard | Bug/Security |
| [13](#issue-13) | Chainlink VRF v2.5 random winner selection | Expert | Feature/Security |
| [14](#issue-14) | Chainlink Automation for stale event cleanup | Expert | Feature |
| [HC1](#hidden-challenge-1) | Hidden: Register page filtering logic | Expert | Bug |
| [HC2](#hidden-challenge-2) | Hidden: "You Won!" badge comparison bug | Expert | Bug |

---

## Easy Issues (Good First Issues)

### Issue #1
**Title:** `convertToGatewayUrl` is duplicated across 4 files — extract into a shared utility  
**Difficulty:** Easy | **Category:** Optimization

**Description:**  
The helper function `convertToGatewayUrl` is copy-pasted identically in `DeclareWinner.jsx`, `MyEvents.jsx`, `NFTAndTokens.jsx`, and `Register.jsx`. This violates the DRY principle and makes gateway changes error-prone.

**Task:**  
1. Create `src/utils/ipfsHelpers.js`.
2. Move `convertToGatewayUrl` and `fetchImageFromMetadata` into it as named exports.
3. Replace all duplicate definitions with imports.
4. Make the gateway URL configurable via `VITE_IPFS_GATEWAY` in `.env`.

---

### Issue #2
**Title:** Wallet disconnect is not handled — switching accounts in MetaMask breaks the UI  
**Difficulty:** Easy | **Category:** Bug

**Description:**  
The app never listens for `accountsChanged` or `chainChanged` events. Switching accounts or networks in MetaMask leads to a stale UI.

**Task:**  
1. In `WalletContext.jsx` or `Navbar.jsx`, add listeners for `accountsChanged` and `chainChanged`.
2. Update `walletAddress` on account change; reload the page on chain change.
3. Clean up listeners on unmount.

---

### Issue #3
**Title:** `CreateEvent` form submits with no validation — zero-value fields crash silently  
**Difficulty:** Easy | **Category:** Bug

**Description:**  
`CreateEvent.jsx` does not validate inputs before calling Pinata or the contract, leading to corrupted metadata or contract reverts.

**Task:**  
1. Add `validateForm()` to `handleSubmit`.
2. Ensure `bannerFile` is present and numeric fields are positive integers.
3. Fix `ethers.parseEther` API usage (remove second "wei" argument).

---

## Medium Issues

### Issue #4
**Title:** `getAllEvents()` will hit the block gas limit — implement pagination  
**Difficulty:** Medium | **Category:** Optimization

**Description:**  
`EventManager.sol` uses an unbounded memory array in `getAllEvents()`, which will fail as the event count grows.

**Task:**  
1. Add `getEventsPaginated(uint256 offset, uint256 limit)` to the contract.
2. Update `MyEvents.jsx` to fetch data in parallel using `Promise.all()`.

---

### Issue #5
**Title:** ETH revenue from `purchaseFanTokens` is locked in the contract  
**Difficulty:** Medium | **Category:** Bug / Security

**Description:**  
The contract collects ETH but has no withdrawal mechanism. Funds are lost forever.

**Task:**  
1. Add revenue tracking per event.
2. Implement `withdrawRevenue(uint256 _eventId)` for creators with CEI pattern.
3. Add `withdrawContractBalance()` for the owner.

---

### Issue #6
**Title:** Critical arithmetic bug in `purchaseFanTokens` — transfers wrong token amount  
**Difficulty:** Medium | **Category:** Bug / Security

**Description:**  
The contract transfers `cost` (price * amount) tokens instead of `_amount` tokens. Also, the price branding curve increases by `amount%` instead of 1%.

**Task:**  
1. Fix token transfer logic.
2. Redesign bonding curve to increase by exactly 1% per transaction.
3. Add anti-whale guards (max 1000 tokens).

---

### Issue #7
**Title:** Private API keys are hardcoded and will be exposed  
**Difficulty:** Medium | **Category:** Security

**Description:**  
Pinata JWT and Alchemy RPC keys are hardcoded in `UploadToPinata.jsx`, `UploadMetadataToPinata.jsx`, and `hardhat.config.cjs`.

**Task:**  
1. Move secrets to `.env`.
2. Update code to use `import.meta.env` (Vite) and `process.env` (Hardhat).
3. Add a startup check/warning if keys are missing.

---

### Issue #8
**Title:** Event creator can register and declare themselves winner — no self-dealing guard  
**Difficulty:** Medium | **Category:** Security

**Description:**  
Creators can win their own events, potentially stealing the rewards.

**Task:**  
1. Prevent creators from registering for their own events.
2. Ensure a minimum of 2 participants before declaring a winner.
3. Update frontend to reflect these rules.

---

## Hard Issues

### Issue #9
**Title:** No test coverage for `EventManager.sol` — write Hardhat test suite  
**Difficulty:** Hard | **Category:** Testing

**Task:**  
Create `test/EventManager.js` covering event creation, registration, winner declaration, and token purchases (including reverts). Aim for >85% coverage.

---

### Issue #10
**Title:** `MyEvents.jsx` makes N+N sequential blockchain calls — implement batch fetching  
**Difficulty:** Hard | **Category:** Optimization

**Task:**  
Refactor `MyEvents.jsx` to use `Promise.all` with chunking (groups of 10) and implement exponential backoff for IPFS fetches.

---

### Issue #11
**Title:** Upgrade `WalletContext` to full Web3 context  
**Difficulty:** Hard | **Category:** Feature

**Task:**  
Expose `provider`, `signer`, `chainId`, `isConnecting`, and a memoized `getContract()` helper from `WalletContext.jsx`. Refactor at least 3 pages to use it.

---

### Issue #12
**Title:** The `purchaseFanTokens` price bonding curve can be broken by integer truncation  
**Difficulty:** Hard | **Category:** Bug / Security

**Task:**  
Implement fixed-point arithmetic for price updates and enforce a minimum price of 1 Gwei to avoid precision loss.

---

## Expert Issues

### Issue #13
**Title:** Implement Chainlink VRF v2.5 for provably fair winner selection  
**Difficulty:** Expert | **Category:** Feature / Security

**Task:**  
Integrate Chainlink VRF v2.5 to select winners randomly. Preserve manual selection as an opt-out.

---

### Issue #14
**Title:** Implement Chainlink Automation to auto-close stale events  
**Difficulty:** Expert | **Category:** Feature

**Task:**  
Use Chainlink Automation to automatically cancel events that have passed their deadline without a winner.

---

## Hidden Challenges

### Hidden Challenge #1
**Title:** Identify and fix logical problems in `Register.jsx` event filtering.  
**Hint:** Check `winnerDeclared` state and current user registration status.

### Hidden Challenge #2
**Title:** Fix the "You Won!" badge logic in `MyEvents.jsx`.  
**Hint:** The current comparison logic uses the wrong addresses.
