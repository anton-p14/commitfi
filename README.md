# CommitFi

CommitFi is a fully decentralized commitment-based savings and auction platform inspired by traditional chit funds (ROSCA).  
It allows users to form groups, contribute a fixed amount periodically, and receive payouts either through a **standard rotation** or an **auction-based mechanism**, all enforced by smart contracts.

The project is built as a Web3 dApp with wallet-based participation and on-chain enforcement.

---

## 🌍 What Problem CommitFi Solves

Traditional chit funds rely heavily on trust and manual enforcement.  
CommitFi removes intermediaries by using smart contracts to:

- Enforce contributions
- Lock group rules immutably
- Automate payouts
- Run transparent auctions for payout priority

---

## ✨ Key Features

- **Standard Rotation Groups**
  - Fixed payout order
  - Each member receives the pooled amount once

- **Auction-Based Groups**
  - Members bid to receive the payout earlier
  - Lowest bid wins the cycle
  - Discount is redistributed among remaining members

- **USDC-Based Contributions**
  - Stable value
  - Used both for contributions and gas on Arc Testnet

- **On-Chain Enforcement**
  - No admin control after deployment
  - Rules cannot be changed once the group is locked

- **Wallet-Based Participation**
  - MetaMask / WalletConnect support
  - Multiple accounts supported

---

## 🧠 Core Concepts (Simple Explanation)

### Standard Rotation
- Group has `N` members
- Each cycle, everyone contributes the same amount
- One member receives the full pool
- Continues until all members receive once

### Auction-Based Rotation
- Before each cycle payout:
  - Members who haven’t received yet can bid
  - Lowest bid wins (they accept less than full pool)
- The remaining amount is redistributed across future cycles
- Auction only starts **after the group is full**

---

## 🧱 Tech Stack

### Frontend
- React
- Vite
- TypeScript
- Tailwind CSS

### Web3
- Wagmi
- RainbowKit
- Viem
- MetaMask / WalletConnect

### Smart Contracts
- Solidity
- Hardhat
- Factory pattern for group creation

### Network
- **Arc Testnet**
- Gas paid in **USDC**

### Deployment
- Vercel

---

## 🛠️ How to Run Locally

### Prerequisites
Make sure you have:
- **Node.js** (v18 or later)
- **npm**
- **MetaMask** browser extension
- Arc Testnet added to MetaMask
- Test USDC from Circle Faucet

---

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/anton-p14/commitfi.git
cd commitfi

