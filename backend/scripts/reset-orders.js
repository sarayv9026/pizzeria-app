import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('Falta MONGODB_URI');
  process.exit(1);
}

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('ordersDB');
  const collections = await db.listCollections().toArray();
  const names = collections.map((c) => c.name);

  for (const name of ['clientes', 'counters', 'orders']) {
    if (names.includes(name)) {
      await db.collection(name).drop();
      console.log(`Eliminada colección ${name}`);
    }
  }

  await db.collection('counters').insertOne({ _id: 'clienteId', seq: 0 });
  console.log('Contador clienteId reiniciado en 0');
  await client.close();
  console.log('Reset completado');
}

main().catch((err) => {
  console.error('Error en reset:', err);
  process.exit(1);
});
