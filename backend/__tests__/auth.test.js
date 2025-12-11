import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import app from '../src/setup-app.js';
import { closeClient } from '../src/config/db.js';

let mongod;
let uri;
let memoryAvailable = true;

describe('Auth API (login colaboradores)', () => {
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
    const hash = await bcrypt.hash('999999999', 10);
    await db.collection('clientes').insertOne({
      clienteId: 'ADMIN',
      nombre: 'administrador',
      documento: '999999999',
      email: 'admin@admin.com',
      password: hash,
      fechaRegistro: new Date(),
      activo: true
    });
    await client.close();
  });

  test('login válido devuelve ok y datos de usuario', async () => {
    if (!memoryAvailable) return;
    const res = await request(app)
      .post('/v1/auth/login')
      .send({ documento: '999999999', password: '999999999' });
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.documento).toBe('999999999');
    expect(res.body.nombre).toBe('administrador');
  });

  test('login inválido devuelve 401 con mensaje claro', async () => {
    if (!memoryAvailable) return;
    const res = await request(app)
      .post('/v1/auth/login')
      .send({ documento: '999999999', password: 'mala' });
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/usuario o contraseña incorrecta/i);
  });
});
