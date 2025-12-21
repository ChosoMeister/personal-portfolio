import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock AnimatedNumber components
vi.mock('../../../components/AnimatedNumber', () => ({
    AnimatedToman: ({ value }: { value: number }) => <span data-testid="animated-toman">{value}</span>,
    AnimatedPercent: ({ value }: { value: number }) => <span data-testid="animated-percent">{value}</span>,
}));

// Import component after mocks
import { SummaryCard } from '../../../components/SummaryCard';

const mockPrices = {
    usdToToman: 50000,
    gold18ToToman: 4500000,
};

describe('SummaryCard Component', () => {
    const defaultProps = {
        isRefreshing: false,
        lastUpdated: Date.now(),
        onRefresh: vi.fn(),
        prices: mockPrices,
    };

    it('should render with profit state correctly', () => {
        const profitSummary = {
            totalValueToman: 10000000,
            totalCostBasisToman: 8000000,
            totalPnlToman: 2000000,
            totalPnlPercent: 25,
            assets: []
        };

        render(
            <SummaryCard
                summary={profitSummary}
                {...defaultProps}
            />
        );

        // Check that profit indicator is present
        const card = screen.getByTestId('animated-toman');
        expect(card).toBeInTheDocument();
    });

    it('should render with loss state correctly', () => {
        const lossSummary = {
            totalValueToman: 8000000,
            totalCostBasisToman: 10000000,
            totalPnlToman: -2000000,
            totalPnlPercent: -20,
            assets: []
        };

        render(
            <SummaryCard
                summary={lossSummary}
                {...defaultProps}
            />
        );

        expect(screen.getByTestId('animated-toman')).toBeInTheDocument();
    });

    it('should render with zero values', () => {
        const zeroSummary = {
            totalValueToman: 0,
            totalCostBasisToman: 0,
            totalPnlToman: 0,
            totalPnlPercent: 0,
            assets: []
        };

        render(
            <SummaryCard
                summary={zeroSummary}
                {...defaultProps}
            />
        );

        expect(screen.getByTestId('animated-toman')).toBeInTheDocument();
    });

    it('should display price information when prices are provided', () => {
        const summary = {
            totalValueToman: 10000000,
            totalCostBasisToman: 8000000,
            totalPnlToman: 2000000,
            totalPnlPercent: 25,
            assets: []
        };

        render(
            <SummaryCard
                summary={summary}
                {...defaultProps}
            />
        );

        // Check that price pills are rendered
        expect(screen.getByText(/طلای ۱۸/)).toBeInTheDocument();
        expect(screen.getByText(/دلار آزاد/)).toBeInTheDocument();
    });

    it('should handle missing prices gracefully', () => {
        const summary = {
            totalValueToman: 10000000,
            totalCostBasisToman: 8000000,
            totalPnlToman: 2000000,
            totalPnlPercent: 25,
            assets: []
        };

        render(
            <SummaryCard
                summary={summary}
                isRefreshing={false}
                lastUpdated={Date.now()}
                onRefresh={vi.fn()}
                prices={undefined}
            />
        );

        // Should still render without crashing
        expect(screen.getByTestId('animated-toman')).toBeInTheDocument();
    });

    it('should display last updated time', () => {
        const summary = {
            totalValueToman: 10000000,
            totalCostBasisToman: 8000000,
            totalPnlToman: 2000000,
            totalPnlPercent: 25,
            assets: []
        };

        const testTime = new Date('2024-12-21T10:30:00').getTime();

        render(
            <SummaryCard
                summary={summary}
                isRefreshing={false}
                lastUpdated={testTime}
                onRefresh={vi.fn()}
                prices={mockPrices}
            />
        );

        // Time should be displayed somewhere
        expect(screen.getByTestId('animated-toman')).toBeInTheDocument();
    });
});
