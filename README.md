# port-dispatcher

A fast macOS CLI tool to overview and manage ports during local development. See what's running, find free ports, and kill processes — all from a single `pd` command.

```
  ┌────────────────────────────────────────────────────────┐
  │ PORT DISPATCHER                                        │
  │ macOS  •  Jun 7, 2026                                  │
  └────────────────────────────────────────────────────────┘
    Scanned 4 ranges in 12ms

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ● BUSY PORTS  3 in use

  PORT     PROCESS            ADDRESS                  LABEL
  ──────────────────────────────────────────────────────────
  3000     node               127.0.0.1:3000           Node/React
  8080     python3            *:8080                   HTTP alt
  11434    ollama             127.0.0.1:11434          Ollama

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ○ FREE RANGES

  RANGE          BUSY    NEXT AVAILABLE
  ──────────────────────────────────────
  3000–3999      1       3001  3002  3003  3004  3005
  4000–4999      0       4000  4001  4002  4003  4004
  8000–8999      1       8000  8001  8002  8003  8004
  11000–11999    1       11000 11001 11002 11003 11004
```

## Requirements

- macOS (uses `lsof` under the hood)
- Node.js 18+

## Installation

### From source

```bash
git clone https://github.com/devkosh/port-dispatcher.git
cd port-dispatcher
npm install
npm run build
npm link
```

After `npm link`, the `pd` command is available globally.

### Verify

```bash
pd --version
```

## Usage

```bash
# Overview of all default port ranges
pd

# Scan a specific range
pd scan 5000-6000

# Check if a port is free
pd check 8080

# Find next N free ports from a starting port
pd next 3000
pd next 3000 --count 10

# Kill the process on a port (prompts for confirmation)
pd kill 8080

# Kill without prompt
pd kill 8080 --yes

# Kill with SIGKILL instead of SIGTERM
pd kill 8080 --force
```

## Default scanned ranges

| Range | Description |
|-------|-------------|
| 3000–3999 | React / Next.js |
| 4000–4999 | General dev |
| 8000–8999 | HTTP alt / LLMs |
| 11000–11999 | Ollama range |

## Development

```bash
npm run dev          # run without building (uses tsx)
npm run build        # compile to dist/
```
