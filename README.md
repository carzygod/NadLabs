# NadLabs

AI+ creative studio for the Monad ecosystem: generate launchable content fast, then hand it off to Nad.fun for one-click token creation.

![Banner](./public/nadlabs-banner.svg)

**Summary**
NadLabs streamlines the full flow: generate Monad-native creative concepts (agents, memes, lore, mini-products), verify differentiation, produce a build blueprint, and prep a Nad.fun token launch payload.

## Core Flow
The application operates on a three-stage pipeline: **Forge (Creation)** -> **Oracle (Signal)** -> **Architect (Build + Launch)**.

### 1. Forge: Creation
Configure the Forge to generate content that fits Monad:
- **Modes**:
  - **Targeted**: precise control over ecosystems and sectors.
  - **Chaos**: randomized, high-variance ideas.
- **Parameters**:
  - **Ecosystem**: Monad (testnet supported in-app).
  - **Sectors**: Nad.fun, AI Agents, Memes, DeFi, Social, GameFi, Infra, NFTs.
  - **Degen Level (0-100)**: tunes risk/innovation.
  - **AI Model**: ChatGPT-compatible model with structured JSON outputs.

### 2. Oracle: Signal
Verify uniqueness and improve differentiation:
- **Collision Detection**: checks for similar protocols.
- **Pivot Suggestions**: proposes alternatives if collisions are found.

### 3. Architect: Build + Launch
Blueprinting includes a guided builder:
- **Contract Stage**: generates a full Solidity contract and provides a **Contract Deploy** action.
- **Frontend Stage**: generates a full Dapp build prompt for vibe coding IDEs (Claude Code, Codex, Antigravity, v0.app).
- **Launch Stage**: auto-generates logo options and prepares a Nad.fun launch payload (editable by users).

## Tech Stack
- **Frontend**: React 19 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS + custom cyber styles
- **AI Integration**: OpenAI-compatible Chat Completions
- **Wallet**: RainbowKit + wagmi (Monad testnet)
- **Icons**: Lucide React

## Getting Started
### Prerequisites
- Node.js (v18 or higher)
- An OpenAI-compatible API key

### Installation
1. Install deps
```bash
npm install
```

2. Configure environment
```env
OPENAI_BASE_URL=https://api.openai.com/v1/
OPENAI_MODEL=gpt-5.2-ca
OPENAI_API_KEY=sk-xxxx
VITE_NAD_FUN_RELAY=http://localhost:8788/relay
```

3. Run locally
```bash
npm run dev
```

## Project Structure
- `App.tsx`: Main application controller
- `services/ai.ts`: AI prompt orchestration
- `types.ts`: TypeScript definitions
- `locales.ts`: Translation strings
- `components/`: UI components
- `index.html`: Global cyber styles
