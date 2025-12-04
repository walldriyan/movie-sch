/**
 * Production-safe logging utility
 * Only logs in development environment to prevent console pollution in production
 */

const isDevelopment = process.env.NODE_ENV === 'development';

type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

interface LoggerOptions {
    prefix?: string;
    forceLog?: boolean; // Force logging even in production (for critical errors)
}

class Logger {
    private prefix: string;
    private forceLog: boolean;

    constructor(options: LoggerOptions = {}) {
        this.prefix = options.prefix || '';
        this.forceLog = options.forceLog || false;
    }

    private shouldLog(): boolean {
        return isDevelopment || this.forceLog;
    }

    private formatMessage(message: string): string {
        return this.prefix ? `[${this.prefix}] ${message}` : message;
    }

    log(message: string, ...args: unknown[]): void {
        if (this.shouldLog()) {
            console.log(this.formatMessage(message), ...args);
        }
    }

    info(message: string, ...args: unknown[]): void {
        if (this.shouldLog()) {
            console.info(this.formatMessage(message), ...args);
        }
    }

    warn(message: string, ...args: unknown[]): void {
        if (this.shouldLog()) {
            console.warn(this.formatMessage(message), ...args);
        }
    }

    error(message: string, ...args: unknown[]): void {
        // Always log errors
        console.error(this.formatMessage(message), ...args);
    }

    debug(message: string, ...args: unknown[]): void {
        if (this.shouldLog()) {
            console.debug(this.formatMessage(message), ...args);
        }
    }

    // Create a child logger with a different prefix
    child(prefix: string): Logger {
        const currentPrefix = this.prefix ? `${this.prefix}:${prefix}` : prefix;
        return new Logger({ prefix: currentPrefix, forceLog: this.forceLog });
    }
}

// Pre-configured loggers for different parts of the application
export const logger = new Logger();
export const authLogger = new Logger({ prefix: 'Auth' });
export const cacheLogger = new Logger({ prefix: 'Cache' });
export const dbLogger = new Logger({ prefix: 'DB' });
export const actionLogger = new Logger({ prefix: 'Action' });

export default Logger;
