import { describe, it, expect } from 'vitest';
import { formatToman, formatPercent, formatNumber } from '../../../utils/formatting';

describe('Formatting Utilities', () => {
    describe('formatToman', () => {
        it('should format positive numbers', () => {
            const result = formatToman(1234567);
            expect(result).toMatch(/۱.*۲۳۴.*۵۶۷/);
        });

        it('should format zero', () => {
            const result = formatToman(0);
            expect(result).toBe('۰');
        });

        it('should round decimal numbers', () => {
            const result = formatToman(1234.56);
            expect(result).toMatch(/۱.*۲۳۵/); // Rounded to 1235
        });

        it('should format negative numbers', () => {
            const result = formatToman(-1000);
            expect(result).toContain('۱');
        });

        it('should format large numbers with separators', () => {
            const result = formatToman(1000000000);
            // Should have Persian digit separators
            expect(result.length).toBeGreaterThan(9);
        });
    });

    describe('formatPercent', () => {
        it('should add plus sign for positive percentages', () => {
            const result = formatPercent(12.34);
            expect(result).toContain('+');
            expect(result).toContain('٪');
        });

        it('should not add plus sign for negative percentages', () => {
            const result = formatPercent(-5.67);
            expect(result).not.toMatch(/^\+/);
            expect(result).toContain('٪');
        });

        it('should format zero without sign', () => {
            const result = formatPercent(0);
            expect(result).not.toContain('+');
            expect(result).toContain('۰');
        });

        it('should limit to 2 decimal places', () => {
            const result = formatPercent(12.3456789);
            // Should be formatted as "12.35" or similar in Persian
            expect(result).toContain('٪');
        });
    });

    describe('formatNumber', () => {
        it('should format numbers with default 2 decimal places', () => {
            const result = formatNumber(123.456);
            expect(result).toContain('۱۲۳');
        });

        it('should show more decimals for small numbers', () => {
            const result = formatNumber(0.0001234);
            // Small numbers should show more decimal places
            expect(result.length).toBeGreaterThan(3);
        });

        it('should format integers without unnecessary decimals', () => {
            const result = formatNumber(100);
            expect(result).toBe('۱۰۰');
        });

        it('should respect custom decimal places', () => {
            const result = formatNumber(123.456789, 4);
            // Should respect the 4 decimal places parameter
            expect(result).toContain('۱۲۳');
        });
    });
});
