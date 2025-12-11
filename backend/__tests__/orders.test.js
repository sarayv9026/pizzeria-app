import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import request from 'supertest';
import app from '../src/setup-app.js';
import { closeClient } from '../src/config/db.js';

let mongod;
let uri;
let memoryAvailable = true;

async function seedProducts(db) {
  await db.collection('productos').insertMany([
    { productoId: 'P001', nombre: 'Margherita', precio: 22000, descripcion: 'tomate', tipo: 'pizza' },
    { productoId: 'B001', nombre: 'Gaseosa', precio: 4500, descripcion: 'cola', tipo: 'bebida' }
  ]);
}

describe('Orders API (integración con Mongo en memoria)', () => {
  beforeAll(async () => {
    try {
      mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      process.env.MONGODB_URI = uri;
    } catch (err) {
      memoryAvailable = false;
      console.warn('MongoMemoryServer no disponible, se omiten pruebas de integración:', err.message);
    }
  });

  afterAll(async () => {
    await closeClient();
    if (mongod) await mongod.stop();
  });

  beforeEach(async () => {
    if (!memoryAvailable) return;
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('ordersDB');
    await db.dropDatabase();
    await seedProducts(db);
    await client.close();
  });

  test('GET /v1/orders/products devuelve catálogo con tipos', async () => {
    if (!memoryAvailable) return;
    const res = await request(app).get('/v1/orders/products');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    const pizza = res.body.items.find((p) => p.productoId === 'P001' || p.id === 'P001');
    const bebida = res.body.items.find((p) => p.productoId === 'B001' || p.id === 'B001');
    expect(pizza?.tipo).toBe('pizza');
    expect(bebida?.tipo).toBe('bebida');
  });

  test('POST /v1/orders crea pedido y evita clienteId duplicado en sucesivas órdenes', async () => {
    if (!memoryAvailable) return;
    const payload = {
      items: [
        { productoId: 'P001', nombre: 'Margherita', cantidad: 1, precioUnit: 22000, subtotal: 22000 }
      ],
      clienteNombre: 'Tester',
      clienteEmail: 'tester@demo.local'
    };

    const first = await request(app).post('/v1/orders').send(payload);
    expect(first.statusCode).toBe(200);
    expect(first.body.orderId).toMatch(/^ORD_/);
    expect(first.body.clienteId).toMatch(/^CL\d{4}$/);

    const second = await request(app).post('/v1/orders').send(payload);
    expect(second.statusCode).toBe(200);
    expect(second.body.clienteId).not.toBe(first.body.clienteId);
  });
});
