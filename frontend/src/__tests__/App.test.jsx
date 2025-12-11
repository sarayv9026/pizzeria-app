import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App.jsx';

describe('App UI', () => {
  beforeEach(() => {
    // mock fetch por cada prueba
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

  it('muestra el home con título y botones principales', () => {
    render(<App />);
    expect(screen.getAllByText(/Pizza Panucci/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /Pedidos/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Acceso Colaboradores/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ir al catálogo/i })).toBeInTheDocument();
  });

  it('cambia a vista de pedidos y muestra encabezado del módulo', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Pedidos/i }));
    const headers = await screen.findAllByText(/Mis pedidos/i);
    expect(headers.length).toBeGreaterThanOrEqual(1);
  });
});
