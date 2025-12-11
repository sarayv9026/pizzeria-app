import bcrypt from 'bcryptjs';
import app from './setup-app.js';
import { getDb } from './config/db.js';
import env from './config/env.js';

async function start() {
  try {
    // Probar conexión a MongoDB antes de levantar el servidor
    const db = await getDb('ordersDB');
    console.log('Conexión a MongoDB OK');
    // Sincronizar contador clienteId con el máximo existente (prefijo CL)
    const agg = await db.collection('clientes').aggregate([
      { $match: { clienteId: { $regex: '^CL\\d+$' } } },
      {
        $addFields: {
          numId: {
            $toInt: { $substr: ['$clienteId', 2, 12] }
          }
        }
      },
      { $sort: { numId: -1 } },
      { $limit: 1 }
    ]).toArray();
    const maxSeq = agg.length ? agg[0].numId || 0 : 0;
    await db.collection('counters').updateOne(
      { _id: 'clienteId' },
      { $set: { seq: maxSeq } },
      { upsert: true }
    );

    // Crear admin por defecto si no existe (documento como login)
    const adminDoc = '999999999';
    const adminEmail = 'admin@admin.com';
    const adminPassword = '999999999';
    const existing = await db.collection('clientes').findOne({ documento: adminDoc });
    if (!existing) {
      const hash = await bcrypt.hash(adminPassword, 10);
      await db.collection('clientes').insertOne({
        clienteId: 'ADMIN',
        nombre: 'administrador',
        documento: adminDoc,
        email: adminEmail,
        password: hash,
        fechaRegistro: new Date(),
        activo: true
      });
    } else if (existing && existing.password && existing.password.length < 20) {
      // si estaba en texto plano, re-hash
      const hash = await bcrypt.hash(existing.password, 10);
      await db.collection('clientes').updateOne({ documento: adminDoc }, { $set: { password: hash } });
    }
  } catch (err) {
    console.error('No se pudo conectar a MongoDB:', err.message);
    process.exit(1);
  }

  app.listen(env.port, env.host, () => {
    console.log(`API gateway escuchando en http://${env.host}:${env.port}`);
  });
}

start();
