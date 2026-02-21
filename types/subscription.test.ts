import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PLANS, PlanType, formatCurrency, formatDate } from './subscription';

describe('Subscription Types & Utils', () => {
  describe('PLANS', () => {
    it('should have free plan with correct structure', () => {
      expect(PLANS.free).toBeDefined();
      expect(PLANS.free.id).toBe('free');
      expect(PLANS.free.name).toBe('Free');
      expect(PLANS.free.price).toBe(0);
      expect(PLANS.free.interval).toBe('month');
      expect(PLANS.free.stripePriceId).toBeNull();
    });

    it('should have pro plan with correct structure', () => {
      expect(PLANS.pro).toBeDefined();
      expect(PLANS.pro.id).toBe('pro');
      expect(PLANS.pro.name).toBe('Pro');
      expect(PLANS.pro.price).toBe(29);
      expect(PLANS.pro.interval).toBe('month');
    });

    it('should have enterprise plan with correct structure', () => {
      expect(PLANS.enterprise).toBeDefined();
      expect(PLANS.enterprise.id).toBe('enterprise');
      expect(PLANS.enterprise.name).toBe('Enterprise');
      expect(PLANS.enterprise.price).toBe(99);
    });

    it('should have features array for each plan', () => {
      Object.values(PLANS).forEach(plan => {
        expect(Array.isArray(plan.features)).toBe(true);
        expect(plan.features.length).toBeGreaterThan(0);
      });
    });
  });

  describe('formatCurrency', () => {
    it('should format BRL correctly', () => {
      const result = formatCurrency(2900, 'brl');
      expect(result).toContain('R$');
      expect(result).toContain('29');
      expect(result).toContain('00');
    });

    it('should format USD correctly', () => {
      const result = formatCurrency(2900, 'usd');
      expect(result).toContain('$');
      expect(result).toContain('29');
    });
  });

  describe('formatDate', () => {
    it('should format date to Brazilian Portuguese format', () => {
      const date = new Date('2025-03-15');
      const formatted = formatDate(date.toISOString());
      expect(formatted).toContain('15');
      expect(formatted).toContain('março');
      expect(formatted).toContain('2025');
    });
  });
});

// Helper functions for the UI
export function formatCurrency(amount: number, currency: string): string {
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  });
  return formatter.format(amount / 100);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}
