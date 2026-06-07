export interface PortEntry {
    port: number;
    process: string;
    pid: number;
    address: string;
}
export interface PortRange {
    name: string;
    start: number;
    end: number;
    description: string;
}
export interface RangeSummary {
    range: PortRange;
    busyPorts: PortEntry[];
    nextFreePorts: number[];
    totalPorts: number;
}
export interface ScanResult {
    allBusy: Map<number, PortEntry>;
    ranges: RangeSummary[];
    scanMs: number;
}
export interface DbEntry {
    name: string;
    port: number;
    running: boolean;
    process?: string;
    pid?: number;
}
export interface DbScanResult {
    entries: DbEntry[];
    scanMs: number;
}
