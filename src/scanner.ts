import { execSync } from 'child_process';
import type { PortEntry, PortRange, RangeSummary, ScanResult } from './types.js';

export const DEFAULT_RANGES: PortRange[] = [
  { name: '3000–3999', start: 3000, end: 3999, description: 'React / Next.js' },
  { name: '4000–4999', start: 4000, end: 4999, description: 'General dev' },
  { name: '8000–8999', start: 8000, end: 8999, description: 'HTTP alt / LLMs' },
  { name: '11000–11999', start: 11000, end: 11999, description: 'Ollama range' },
];

export const KNOWN_PORTS: Record<number, string> = {
  3000: 'Node/React',
  3001: 'React',
  3306: 'MySQL',
  4200: 'Angular',
  5173: 'Vite',
  5432: 'PostgreSQL',
  5433: 'PostgreSQL',
  5601: 'Kibana',
  5984: 'CouchDB',
  6379: 'Redis',
  6380: 'Redis',
  7474: 'Neo4j HTTP',
  7687: 'Neo4j Bolt',
  8000: 'Django',
  8080: 'HTTP alt',
  8443: 'HTTPS alt',
  8888: 'Jupyter',
  9000: 'SonarQube',
  9200: 'Elasticsearch',
  9300: 'Elasticsearch',
  11434: 'Ollama',
  27017: 'MongoDB',
  27018: 'MongoDB',
};

function getAllListeningPorts(): Map<number, PortEntry> {
  const ports = new Map<number, PortEntry>();

  try {
    const output = execSync('lsof -i -P -n', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });

    for (const line of output.split('\n')) {
      if (!line.includes('LISTEN')) continue;

      const parts = line.trim().split(/\s+/);
      if (parts.length < 9) continue;

      const command = parts[0];
      const pid = parseInt(parts[1], 10);
      const addressPart = parts[8];

      const portMatch = addressPart.match(/:(\d+)$/);
      if (!portMatch) continue;

      const port = parseInt(portMatch[1], 10);
      if (!ports.has(port)) {
        ports.set(port, { port, process: command, pid, address: addressPart });
      }
    }
  } catch {
    // lsof unavailable or returned no output
  }

  return ports;
}

export function scan(ranges: PortRange[] = DEFAULT_RANGES, freeCount = 5): ScanResult {
  const t0 = Date.now();
  const allBusy = getAllListeningPorts();

  const rangeResults: RangeSummary[] = ranges.map((range) => {
    const busyPorts: PortEntry[] = [];
    const nextFreePorts: number[] = [];

    for (let p = range.start; p <= range.end; p++) {
      if (allBusy.has(p)) {
        busyPorts.push(allBusy.get(p)!);
      } else if (nextFreePorts.length < freeCount) {
        nextFreePorts.push(p);
      }
    }

    return {
      range,
      busyPorts,
      nextFreePorts,
      totalPorts: range.end - range.start + 1,
    };
  });

  return { allBusy, ranges: rangeResults, scanMs: Date.now() - t0 };
}

export function scanCustomRange(start: number, end: number): ScanResult {
  return scan([{ name: `${start}–${end}`, start, end, description: 'Custom range' }]);
}

export function checkPort(port: number): PortEntry | null {
  return getAllListeningPorts().get(port) ?? null;
}

export function findNextFree(fromPort: number, count = 5): number[] {
  const allBusy = getAllListeningPorts();
  const free: number[] = [];
  for (let p = fromPort; p < 65536 && free.length < count; p++) {
    if (!allBusy.has(p)) free.push(p);
  }
  return free;
}
