#!/usr/bin/env node
import { Command } from 'commander';
import { scan, scanCustomRange, checkPort, findNextFree, scanDatabases, } from './scanner.js';
import { printHeader, printBusySection, printFreeSection, printHelp, printCheckResult, printNextResult, printKillSuccess, printKillError, printDbResult, } from './display.js';
import { createInterface } from 'readline';
import chalk from 'chalk';
async function confirm(prompt) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
    });
}
const program = new Command();
program
    .name('pd')
    .description('Port Dispatcher — overview and dispatch ports for local development')
    .version('1.0.0')
    .action(() => {
    const result = scan();
    printHeader(result.scanMs, result.ranges.length);
    printBusySection(result);
    printFreeSection(result);
    printHelp();
});
program
    .command('scan [range]')
    .description('Scan a port range, e.g. 3000-9000. No arg = default ranges.')
    .action((range) => {
    if (!range) {
        const result = scan();
        printHeader(result.scanMs, result.ranges.length);
        printBusySection(result);
        printFreeSection(result);
        printHelp();
        return;
    }
    const match = range.match(/^(\d+)[-–](\d+)$/);
    if (!match) {
        console.error('Invalid range. Use e.g. 3000-9000');
        process.exit(1);
    }
    const start = parseInt(match[1], 10);
    const end = parseInt(match[2], 10);
    if (start >= end || end > 65535) {
        console.error('Invalid range: start must be < end and ≤ 65535');
        process.exit(1);
    }
    const result = scanCustomRange(start, end);
    printHeader(result.scanMs, result.ranges.length);
    printBusySection(result);
    printFreeSection(result);
});
program
    .command('check <port>')
    .description('Check if a specific port is free or busy')
    .action((portStr) => {
    const port = parseInt(portStr, 10);
    if (isNaN(port) || port < 0 || port > 65535) {
        console.error('Invalid port number (0–65535)');
        process.exit(1);
    }
    const entry = checkPort(port);
    printCheckResult(port, entry);
});
program
    .command('next <port>')
    .description('Find next free ports starting from a given port')
    .option('-c, --count <n>', 'how many free ports to return', '5')
    .action((portStr, opts) => {
    const port = parseInt(portStr, 10);
    const count = Math.max(1, parseInt(opts.count, 10) || 5);
    if (isNaN(port) || port < 0 || port > 65535) {
        console.error('Invalid port number (0–65535)');
        process.exit(1);
    }
    const ports = findNextFree(port, count);
    printNextResult(port, ports);
});
program
    .command('kill <port>')
    .description('Kill the process listening on a port')
    .option('-f, --force', 'use SIGKILL instead of SIGTERM')
    .option('-y, --yes', 'skip confirmation prompt')
    .action(async (portStr, opts) => {
    const port = parseInt(portStr, 10);
    if (isNaN(port) || port < 0 || port > 65535) {
        console.error('Invalid port number (0–65535)');
        process.exit(1);
    }
    const entry = checkPort(port);
    if (!entry) {
        printCheckResult(port, null);
        return;
    }
    printCheckResult(port, entry);
    if (!opts.yes) {
        const sig = opts.force ? 'SIGKILL' : 'SIGTERM';
        const ok = await confirm(`  Kill ${chalk.yellow(entry.process)} (pid ${entry.pid}) with ${chalk.yellow(sig)}? ${chalk.dim('[y/N]')} `);
        if (!ok) {
            console.log('  ' + chalk.dim('Aborted.'));
            console.log();
            return;
        }
    }
    try {
        process.kill(entry.pid, opts.force ? 'SIGKILL' : 'SIGTERM');
        printKillSuccess(entry, opts.force ?? false);
    }
    catch (err) {
        printKillError(entry, err);
    }
});
program
    .command('db')
    .description('Show status of known database ports (PostgreSQL, MySQL, Redis, MongoDB, …)')
    .action(() => {
    const result = scanDatabases();
    printDbResult(result);
});
program.parse();
