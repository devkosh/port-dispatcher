import type { PortEntry, ScanResult } from './types.js';
export declare function printHeader(scanMs: number, rangeCount: number): void;
export declare function printBusySection(result: ScanResult): void;
export declare function printFreeSection(result: ScanResult): void;
export declare function printHelp(): void;
export declare function printCheckResult(port: number, entry: PortEntry | null): void;
export declare function printKillSuccess(entry: PortEntry, force: boolean): void;
export declare function printKillError(entry: PortEntry, err: unknown): void;
export declare function printNextResult(from: number, ports: number[]): void;
