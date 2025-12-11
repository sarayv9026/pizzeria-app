import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock de fetch global para evitar llamadas reales durante pruebas
beforeAll(() => {
  global.fetch = vi.fn(async (url) => {
    if (String(url).includes('/v1/orders/products')) {
      return {
        ok: true,
        json: async () => ({ items: [] })
      };
    }
    if (String(url).includes('/v1/orders')) {
      return {
        ok: true,
        json: async () => ({ items: [] })
      };
    }
    return { ok: true, json: async () => ({}) };
  });
});

afterEach(() => {
  vi.clearAllMocks();
});
