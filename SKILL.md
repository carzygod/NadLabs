---
name: NadLabs
version: 1.0.0
description: Content-to-token workflow for the Monad ecosystem with Nad.fun launch handoff.
homepage: https://nad.fun
---

# NadLabs Skill

This skill turns a vague prompt into Monad-native AI+ creative content, a build blueprint, and a Nad.fun launch handoff payload.

## Goals
- Generate content that fits the Monad ecosystem and can become a token narrative.
- Deliver a practical build plan (contract + frontend prompt).
- Collect token launch fields, allow edits, and produce a launch handoff payload for Nad.fun.

## Workflow (Agent Steps)
1. **Forge (Creation)**
   - Produce 1 concept: title, tagline, description, ecosystem, sector, degenScore, and 5-8 features.
   - Ensure the concept is launchable: clear meme/lore, distribution hook, and community loop.

2. **Oracle (Signal)**
   - Check uniqueness against obvious competitors.
   - If collisions exist: propose a pivot that keeps the best parts.

3. **Architect (Blueprint)**
   - Contract: generate a Solidity skeleton aligned with the concept (minimal, secure defaults).
   - Frontend: generate a complete vibe-coding prompt (pages, wallet connect, read/write flows, errors).

4. **Launch Intake (Nad.fun)**
   - Collect and normalize:
     - `name` (1-20 chars recommended)
     - `symbol` (1-10 chars, uppercase recommended)
     - `totalSupply`
     - `description`
     - `image` (URL or base64 data URL)
     - `website`, `twitter`, `telegram`
     - Optional: `tax` config if Nad.fun supports it
   - Output a single JSON object as the **Nad.fun launch handoff payload** and ask the user to confirm.

5. **Handoff**
   - On confirmation: provide the final payload and the Nad.fun URL to complete the launch.

