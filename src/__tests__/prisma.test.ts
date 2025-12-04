import { serializePrismaObject } from '../lib/prisma';

describe('Prisma Utilities', () => {
    describe('serializePrismaObject', () => {
        it('should handle null values', () => {
            expect(serializePrismaObject(null)).toBe(null);
        });

        it('should handle undefined values', () => {
            expect(serializePrismaObject(undefined)).toBe(undefined);
        });

        it('should convert Date to ISO string', () => {
            const date = new Date('2024-01-01T00:00:00.000Z');
            expect(serializePrismaObject(date)).toBe('2024-01-01T00:00:00.000Z');
        });

        it('should handle primitive values', () => {
            expect(serializePrismaObject('string')).toBe('string');
            expect(serializePrismaObject(123)).toBe(123);
            expect(serializePrismaObject(true)).toBe(true);
        });

        it('should handle arrays', () => {
            const input = [1, 2, 3];
            const result = serializePrismaObject(input);
            expect(result).toEqual([1, 2, 3]);
        });

        it('should handle arrays with dates', () => {
            const date = new Date('2024-01-01T00:00:00.000Z');
            const input = [date, date];
            const result = serializePrismaObject(input);
            expect(result).toEqual(['2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z']);
        });

        it('should handle objects with dates', () => {
            const date = new Date('2024-01-01T00:00:00.000Z');
            const input = { createdAt: date, name: 'test' };
            const result = serializePrismaObject(input);
            expect(result).toEqual({ createdAt: '2024-01-01T00:00:00.000Z', name: 'test' });
        });

        it('should handle nested objects', () => {
            const date = new Date('2024-01-01T00:00:00.000Z');
            const input = {
                user: {
                    name: 'test',
                    createdAt: date,
                },
                posts: [{ title: 'post1', createdAt: date }],
            };
            const result = serializePrismaObject(input);
            expect(result).toEqual({
                user: {
                    name: 'test',
                    createdAt: '2024-01-01T00:00:00.000Z',
                },
                posts: [{ title: 'post1', createdAt: '2024-01-01T00:00:00.000Z' }],
            });
        });

        it('should handle Decimal-like objects with toNumber', () => {
            const decimalLike = {
                toNumber: () => 9.5,
            };
            expect(serializePrismaObject(decimalLike)).toBe(9.5);
        });
    });
});
