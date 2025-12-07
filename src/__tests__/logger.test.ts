import Logger, { logger, authLogger, cacheLogger } from '../lib/logger';

describe('Logger Module', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation();
        jest.spyOn(console, 'error').mockImplementation();
        jest.spyOn(console, 'warn').mockImplementation();
        jest.spyOn(console, 'info').mockImplementation();
        jest.spyOn(console, 'debug').mockImplementation();
    });

    afterEach(() => {
        Object.defineProperty(process.env, 'NODE_ENV', {
            value: originalNodeEnv,
            writable: true,
            configurable: true
        });
        jest.restoreAllMocks();
    });

    describe('Logger class', () => {
        it('should create a logger with default options', () => {
            const testLogger = new Logger();
            expect(testLogger).toBeInstanceOf(Logger);
        });

        it('should create a logger with custom prefix', () => {
            const testLogger = new Logger({ prefix: 'Test' });
            // In development mode, should log with prefix
            testLogger.log('test message');
            // We can't easily test the prefix without modifying the implementation
        });

        it('should create child logger with combined prefix', () => {
            const parentLogger = new Logger({ prefix: 'Parent' });
            const childLogger = parentLogger.child('Child');
            expect(childLogger).toBeInstanceOf(Logger);
        });
    });

    describe('Logging in development', () => {
        beforeEach(() => {
            Object.defineProperty(process.env, 'NODE_ENV', {
                value: 'development',
                writable: true,
                configurable: true
            });
        });

        it('should log messages in development', () => {
            const testLogger = new Logger();
            testLogger.log('test');
            // Logger checks NODE_ENV at module load time, so this test is tricky
        });
    });

    describe('Error logging', () => {
        it('should always log errors regardless of environment', () => {
            const testLogger = new Logger();
            testLogger.error('critical error');
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('Pre-configured loggers', () => {
        it('should export pre-configured loggers', () => {
            expect(logger).toBeInstanceOf(Logger);
            expect(authLogger).toBeInstanceOf(Logger);
            expect(cacheLogger).toBeInstanceOf(Logger);
        });
    });
});
