import chalk from 'chalk';
import type { PortEntry, ScanResult } from './types.js';
import { KNOWN_PORTS } from './scanner.js';

const W = () => Math.min(process.stdout.columns || 80, 90);

const cell = (text: string, width: number, fn: (s: string) => string = (s) => s): string =>
  fn(text.padEnd(width));

function divider(): void {
  console.log('\n  ' + chalk.dim('━'.repeat(W() - 4)));
}

export function printHeader(scanMs: number, rangeCount: number): void {
  const BOX = 56;
  const date = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const line1 = ` PORT DISPATCHER`;
  const line2 = ` macOS  •  ${date}`;

  console.log();
  console.log('  ' + chalk.cyan('┌' + '─'.repeat(BOX) + '┐'));
  console.log('  ' + chalk.cyan('│') + chalk.bold.white(line1.padEnd(BOX)) + chalk.cyan('│'));
  console.log('  ' + chalk.cyan('│') + chalk.dim(line2.padEnd(BOX)) + chalk.cyan('│'));
  console.log('  ' + chalk.cyan('└' + '─'.repeat(BOX) + '┘'));
  console.log('  ' + chalk.dim(`  Scanned ${rangeCount} ranges in ${scanMs}ms`));
}

export function printBusySection(result: ScanResult): void {
  const entries: PortEntry[] = [];
  for (const rs of result.ranges) entries.push(...rs.busyPorts);
  entries.sort((a, b) => a.port - b.port);

  const count = entries.length;

  divider();
  console.log();
  console.log(
    `  ${chalk.red('●')} ${chalk.bold('BUSY PORTS')}  ` +
      (count === 0
        ? chalk.green('none — all ranges clear')
        : chalk.dim(`${count} in use`)),
  );

  if (count === 0) return;

  console.log();
  console.log(
    '  ' +
      cell('PORT', 8, chalk.dim) +
      cell('PROCESS', 18, chalk.dim) +
      cell('ADDRESS', 24, chalk.dim) +
      chalk.dim('LABEL'),
  );
  console.log('  ' + chalk.dim('─'.repeat(W() - 6)));

  for (const e of entries) {
    const label = KNOWN_PORTS[e.port];
    console.log(
      '  ' +
        cell(String(e.port), 8, chalk.red.bold) +
        cell(e.process, 18, chalk.yellow) +
        cell(e.address, 24, chalk.dim) +
        (label ? chalk.magenta(label) : chalk.dim('—')),
    );
  }
}

export function printFreeSection(result: ScanResult): void {
  divider();
  console.log();
  console.log(`  ${chalk.green('○')} ${chalk.bold('FREE RANGES')}`);
  console.log();
  console.log(
    '  ' +
      cell('RANGE', 14, chalk.dim) +
      cell('BUSY', 8, chalk.dim) +
      chalk.dim('NEXT AVAILABLE'),
  );
  console.log('  ' + chalk.dim('─'.repeat(W() - 6)));

  for (const rs of result.ranges) {
    const busy = rs.busyPorts.length;
    const busyFn = busy === 0 ? chalk.green : busy < 5 ? chalk.yellow : chalk.red;
    const nextStr = rs.nextFreePorts.map((p) => chalk.green.bold(String(p))).join('  ');

    console.log(
      '  ' +
        cell(rs.range.name, 14) +
        cell(String(busy), 8, busyFn) +
        nextStr,
    );
  }
}

export function printHelp(): void {
  divider();
  console.log();
  console.log('  ' + chalk.dim('Commands'));
  console.log();
  console.log(
    `  ${chalk.cyan('pd')} ${chalk.white('check')} ${chalk.yellow('8080')}         ` +
      chalk.dim('→ check if port 8080 is available'),
  );
  console.log(
    `  ${chalk.cyan('pd')} ${chalk.white('next')} ${chalk.yellow('3000')}          ` +
      chalk.dim('→ find next free ports from 3000'),
  );
  console.log(
    `  ${chalk.cyan('pd')} ${chalk.white('scan')} ${chalk.yellow('5000-6000')}     ` +
      chalk.dim('→ scan a custom port range'),
  );
  console.log(
    `  ${chalk.cyan('pd')} ${chalk.white('kill')} ${chalk.yellow('8080')}          ` +
      chalk.dim('→ kill the process on port 8080'),
  );
  console.log();
}

export function printCheckResult(port: number, entry: PortEntry | null): void {
  console.log();
  if (entry) {
    const label = KNOWN_PORTS[port];
    console.log(`  ${chalk.red('●')} Port ${chalk.red.bold(String(port))} is ${chalk.red.bold('BUSY')}`);
    console.log(`    Process : ${chalk.yellow(entry.process)}  ${chalk.dim(`pid ${entry.pid}`)}`);
    console.log(`    Address : ${chalk.dim(entry.address)}`);
    if (label) console.log(`    Service : ${chalk.magenta(label)}`);
  } else {
    console.log(`  ${chalk.green('○')} Port ${chalk.green.bold(String(port))} is ${chalk.green.bold('FREE')}`);
  }
  console.log();
}

export function printKillSuccess(entry: PortEntry, force: boolean): void {
  const sig = force ? 'SIGKILL' : 'SIGTERM';
  console.log(
    `  ${chalk.green('✓')} Sent ${chalk.yellow(sig)} to ${chalk.yellow(entry.process)} ` +
      chalk.dim(`(pid ${entry.pid})`),
  );
  console.log();
}

export function printKillError(entry: PortEntry, err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);
  console.log(
    `  ${chalk.red('✗')} Could not kill ${chalk.yellow(entry.process)} ` +
      chalk.dim(`(pid ${entry.pid})`) +
      `: ${chalk.red(msg)}`,
  );
  console.log();
}

export function printNextResult(from: number, ports: number[]): void {
  console.log();
  if (ports.length === 0) {
    console.log(`  ${chalk.red('✗')} No free ports found from ${chalk.bold(String(from))}`);
  } else {
    console.log(
      `  ${chalk.green('○')} Next free from ${chalk.bold(String(from))}:  ` +
        ports.map((p) => chalk.green.bold(String(p))).join('  '),
    );
  }
  console.log();
}
