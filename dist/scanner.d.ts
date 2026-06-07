import type { PortEntry, PortRange, ScanResult } from './types.js';
export declare const DEFAULT_RANGES: PortRange[];
export declare const KNOWN_PORTS: Record<number, string>;
export declare function scan(ranges?: PortRange[], freeCount?: number): ScanResult;
export declare function scanCustomRange(start: number, end: number): ScanResult;
export declare function checkPort(port: number): PortEntry | null;
export declare function findNextFree(fromPort: number, count?: number): number[];
