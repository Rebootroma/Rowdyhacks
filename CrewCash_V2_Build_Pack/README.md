# CrewCash V2 Build Pack

CrewCash V2 is a student financial-intelligence and shared-governance hackathon project.

## Start here

Read in this order:

1. `CREWCASH_V2_MASTER_TECHNICAL_SPEC.md`
2. `CREWCASH_V2_HACKATHON_BUILD_PLAN.md`
3. `CREWCASH_V2_AI_AGENT_INSTRUCTIONS.md`
4. `CREWCASH_V2_API_CONTRACTS.md`
5. `CREWCASH_V2_GEMINI_PROMPTS.md`
6. `CREWCASH_V2_TIGERDATA_SCHEMA.sql`

## Core sponsor integrations

### Tiger Data
Used as the main relational + time-series database for:
- financial events
- spending analytics
- rolling trends
- forecast inputs
- market history
- continuous aggregates

### Gemini API
Used for:
- multimodal receipt extraction
- structured outputs
- financial explanations
- tool-calling over deterministic CrewCash functions

### Optional Solana
Used only for tamper-evident hashes of finalized high-value approvals.

## Product safety / credibility

CrewCash is an educational hackathon prototype.

It:
- does not move money
- does not execute securities trades
- does not calculate official credit bureau scores
- does not guarantee investment returns
- does not label transactions as fraud

## Best first build

Complete this chain before anything else:

```text
Crew budget
→ expense
→ policy
→ Tiger Data event
→ forecast
→ Gemini explanation
→ approval
→ dashboard update
```
