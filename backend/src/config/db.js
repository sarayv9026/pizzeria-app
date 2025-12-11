import 'dotenv/config';
import { MongoClient } from 'mongodb';

let client;

function getUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('MONGODB_URI no está definido. Las rutas fallarán al consultar MongoDB.');
  }
  return uri;
}

export async function getClient() {
  if (client) return client;
  const uri = getUri();
  if (!uri) throw new Error('MONGODB_URI requerido para conectar a MongoDB');
  client = new MongoClient(uri, { retryWrites: true, w: 'majority' });
  await client.connect();
  return client;
}

export async function getDb(dbName) {
  const cli = await getClient();
  return cli.db(dbName);
}

export async function closeClient() {
  if (client) {
    await client.close();
    client = null;
  }
}
