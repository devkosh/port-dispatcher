# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build        # compile TypeScript → dist/
npm run dev          # run directly via tsx (no build needed)
node dist/index.js   # run compiled output
```

After building, link globally:
```bash
npm link             # makes `pd` available system-wide
```

There are no tests or linter configured.

## Architecture

`pd` is a macOS CLI tool. All port detection is done synchronously via a single `lsof -i -P -n` call in `scanner.ts:getAllListeningPorts()`, which returns a `Map<port, PortEntry>`. Everything else — range filtering, free-port finding, `check`, `next`, `kill` — queries that map rather than shelling out again.

`dist/` is intentionally committed to the repo so users can install globally without running a build step.

Data flows in one direction: `scanner.ts` produces data, `display.ts` renders it. `index.ts` wires CLI commands (via `commander`) to scanner functions and display functions. `types.ts` has the shared interfaces.

**Key constraint:** `lsof` is macOS-only. The tool does not work on Linux or Windows.

**`DEFAULT_RANGES`** in `scanner.ts` defines which port bands the default `pd` / `pd scan` commands cover (3000–3999, 4000–4999, 8000–8999, 11000–11999). Changing ranges means editing that array.

**`KNOWN_PORTS`** in `scanner.ts` is the label map used in display — adding a service label means adding an entry there.

**`KNOWN_DATABASES`** in `scanner.ts` is the list of database services checked by `pd db`. Each entry has a `name` and a `ports` array (e.g. PostgreSQL → [5432, 5433]). `scanDatabases()` walks every port in this list against the `lsof` snapshot and returns a `DbScanResult` with running/stopped status for each port.

The project uses `"module": "node16"` in tsconfig, so all local imports must use `.js` extensions (even for `.ts` source files).
