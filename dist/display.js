import chalk from 'chalk';
import { KNOWN_PORTS } from './scanner.js';
const W = () => Math.min(process.stdout.columns || 80, 90);
const cell = (text, width, fn = (s) => s) => fn(text.padEnd(width));
function divider() {
    console.log('\n  ' + chalk.dim('━'.repeat(W() - 4)));
}
export function printHeader(scanMs, rangeCount) {
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
export function printBusySection(result) {
    const entries = Array.from(result.allBusy.values()).sort((a, b) => a.port - b.port);
    const count = entries.length;
    divider();
    console.log();
    console.log(`  ${chalk.red('●')} ${chalk.bold('BUSY PORTS')}  ` +
        (count === 0
            ? chalk.green('none — all ranges clear')
            : chalk.dim(`${count} in use`)));
    if (count === 0)
        return;
    console.log();
    console.log('  ' +
        cell('PORT', 8, chalk.dim) +
        cell('PROCESS', 18, chalk.dim) +
        cell('ADDRESS', 24, chalk.dim) +
        chalk.dim('LABEL'));
    console.log('  ' + chalk.dim('─'.repeat(W() - 6)));
    for (const e of entries) {
        const label = KNOWN_PORTS[e.port];
        console.log('  ' +
            cell(String(e.port), 8, chalk.red.bold) +
            cell(e.process, 18, chalk.yellow) +
            cell(e.address, 24, chalk.dim) +
            (label ? chalk.magenta(label) : chalk.dim('—')));
    }
}
export function printFreeSection(result) {
    divider();
    console.log();
    console.log(`  ${chalk.green('○')} ${chalk.bold('FREE RANGES')}`);
    console.log();
    console.log('  ' +
        cell('RANGE', 14, chalk.dim) +
        cell('BUSY', 8, chalk.dim) +
        chalk.dim('NEXT AVAILABLE'));
    console.log('  ' + chalk.dim('─'.repeat(W() - 6)));
    for (const rs of result.ranges) {
        const busy = rs.busyPorts.length;
        const busyFn = busy === 0 ? chalk.green : busy < 5 ? chalk.yellow : chalk.red;
        const nextStr = rs.nextFreePorts.map((p) => chalk.green.bold(String(p))).join('  ');
        console.log('  ' +
            cell(rs.range.name, 14) +
            cell(String(busy), 8, busyFn) +
            nextStr);
    }
}
export function printHelp() {
    divider();
    console.log();
    console.log('  ' + chalk.dim('Commands'));
    console.log();
    console.log(`  ${chalk.cyan('pd')} ${chalk.white('check')} ${chalk.yellow('8080')}         ` +
        chalk.dim('→ check if port 8080 is available'));
    console.log(`  ${chalk.cyan('pd')} ${chalk.white('next')} ${chalk.yellow('3000')}          ` +
        chalk.dim('→ find next free ports from 3000'));
    console.log(`  ${chalk.cyan('pd')} ${chalk.white('scan')} ${chalk.yellow('5000-6000')}     ` +
        chalk.dim('→ scan a custom port range'));
    console.log(`  ${chalk.cyan('pd')} ${chalk.white('kill')} ${chalk.yellow('8080')}          ` +
        chalk.dim('→ kill the process on port 8080'));
    console.log(`  ${chalk.cyan('pd')} ${chalk.white('db')}                   ` +
        chalk.dim('→ show status of all known database ports'));
    console.log();
}
export function printCheckResult(port, entry) {
    console.log();
    if (entry) {
        const label = KNOWN_PORTS[port];
        console.log(`  ${chalk.red('●')} Port ${chalk.red.bold(String(port))} is ${chalk.red.bold('BUSY')}`);
        console.log(`    Process : ${chalk.yellow(entry.process)}  ${chalk.dim(`pid ${entry.pid}`)}`);
        console.log(`    Address : ${chalk.dim(entry.address)}`);
        if (label)
            console.log(`    Service : ${chalk.magenta(label)}`);
    }
    else {
        console.log(`  ${chalk.green('○')} Port ${chalk.green.bold(String(port))} is ${chalk.green.bold('FREE')}`);
    }
    console.log();
}
export function printKillSuccess(entry, force) {
    const sig = force ? 'SIGKILL' : 'SIGTERM';
    console.log(`  ${chalk.green('✓')} Sent ${chalk.yellow(sig)} to ${chalk.yellow(entry.process)} ` +
        chalk.dim(`(pid ${entry.pid})`));
    console.log();
}
export function printKillError(entry, err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  ${chalk.red('✗')} Could not kill ${chalk.yellow(entry.process)} ` +
        chalk.dim(`(pid ${entry.pid})`) +
        `: ${chalk.red(msg)}`);
    console.log();
}
export function printDbResult(result) {
    const running = result.entries.filter((e) => e.running).length;
    divider();
    console.log();
    console.log(`  ${chalk.cyan('◆')} ${chalk.bold('DATABASES')}  ` +
        (running === 0
            ? chalk.dim('none running')
            : chalk.dim(`${running} of ${result.entries.length} ports active`)));
    console.log();
    console.log('  ' +
        cell('SERVICE', 18, chalk.dim) +
        cell('PORT', 8, chalk.dim) +
        cell('STATUS', 14, chalk.dim) +
        chalk.dim('PROCESS'));
    console.log('  ' + chalk.dim('─'.repeat(W() - 6)));
    for (const e of result.entries) {
        const status = e.running
            ? chalk.green('● running')
            : chalk.dim('○ stopped');
        const proc = e.running
            ? chalk.yellow(e.process ?? '—') + chalk.dim(` pid ${e.pid}`)
            : chalk.dim('—');
        console.log('  ' +
            cell(e.name, 18) +
            cell(String(e.port), 8, chalk.bold) +
            cell(status, 23) +
            proc);
    }
    console.log();
    console.log('  ' + chalk.dim(`Scanned in ${result.scanMs}ms`));
    console.log();
}
export function printNextResult(from, ports) {
    console.log();
    if (ports.length === 0) {
        console.log(`  ${chalk.red('✗')} No free ports found from ${chalk.bold(String(from))}`);
    }
    else {
        console.log(`  ${chalk.green('○')} Next free from ${chalk.bold(String(from))}:  ` +
            ports.map((p) => chalk.green.bold(String(p))).join('  '));
    }
    console.log();
}
