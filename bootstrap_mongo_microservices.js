/**
 * Bootstrap de bases ordersDB, kitchenDB y warehouseDB en MongoDB Atlas.
 * Ejecutar con:
 *   MONGODB_URI="mongodb+srv://user:pwd@cluster.mongodb.net" node bootstrap_mongo_microservices.js
 *
 * No elimina datos existentes; aplica validadores e índices si faltan.
 */

const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('Falta MONGODB_URI en variables de entorno');
  process.exit(1);
}

const validators = {
  orders: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['orderId', 'cliente', 'items', 'total', 'estado', 'fechaCreacion'],
      properties: {
        orderId: { bsonType: 'string' },
        cliente: {
          bsonType: 'object',
          required: ['clienteId', 'nombre'],
          properties: {
            clienteId: { bsonType: 'string' },
            nombre: { bsonType: 'string' },
            email: { bsonType: ['string', 'null'] }
          }
        },
        items: {
          bsonType: 'array',
          minItems: 1,
          items: {
            bsonType: 'object',
            required: ['productoId', 'nombre', 'cantidad', 'precioUnit', 'subtotal'],
            properties: {
              productoId: { bsonType: 'string' },
              nombre: { bsonType: 'string' },
              cantidad: { bsonType: 'int', minimum: 1 },
              precioUnit: { bsonType: 'int', minimum: 0 },
              subtotal: { bsonType: 'int', minimum: 0 }
            }
          }
        },
        total: { bsonType: 'int', minimum: 0 },
        estado: {
          enum: ['CREADO', 'EN_PREPARACION', 'LISTO', 'EN_ENTREGA', 'ENTREGADO', 'CANCELADO']
        },
        fechaCreacion: { bsonType: 'date' }
      }
    }
  },
  clientes: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['clienteId', 'nombre', 'email', 'fechaRegistro', 'activo'],
      properties: {
        clienteId: { bsonType: 'string' },
        nombre: { bsonType: 'string' },
        email: { bsonType: 'string' },
        telefono: { bsonType: 'string' },
        direccion: {
          bsonType: 'object',
          properties: {
            calle: { bsonType: 'string' },
            ciudad: { bsonType: 'string' },
            barrio: { bsonType: 'string' }
          }
        },
        fechaRegistro: { bsonType: 'date' },
        activo: { bsonType: 'bool' }
      }
    }
  },
  productos: {
    // No detallado en el PDF; esquema mínimo.
    $jsonSchema: {
      bsonType: 'object',
      required: ['productoId', 'nombre'],
      properties: {
        productoId: { bsonType: 'string' },
        nombre: { bsonType: 'string' },
        precio: { bsonType: 'int' }
      }
    }
  },
  recipes: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['recetaId', 'productoId', 'nombreProducto', 'ingredientes', 'tiempoPreparacionMin'],
      properties: {
        recetaId: { bsonType: 'string' },
        productoId: { bsonType: 'string' },
        nombreProducto: { bsonType: 'string' },
        porciones: { bsonType: 'int' },
        ingredientes: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            required: ['ingredienteId', 'nombre', 'cantidad'],
            properties: {
              ingredienteId: { bsonType: 'string' },
              nombre: { bsonType: 'string' },
              cantidad: { bsonType: 'int' },
              unidad: { bsonType: 'string' }
            }
          }
        },
        tiempoPreparacionMin: { bsonType: 'int' }
      }
    }
  },
  kitchenOrders: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['kitchenOrderId', 'orderRef', 'estado', 'productos'],
      properties: {
        kitchenOrderId: { bsonType: 'string' },
        orderRef: { bsonType: 'string' },
        estado: { enum: ['PENDIENTE', 'EN_PREPARACION', 'LISTO'] },
        productos: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            required: ['productoId', 'cantidad'],
            properties: {
              productoId: { bsonType: 'string' },
              nombre: { bsonType: 'string' },
              cantidad: { bsonType: 'int' },
              ingredientes: { bsonType: 'array' }
            }
          }
        },
        horaAsignacion: { bsonType: 'date' }
      }
    }
  },
  ingredients: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['ingredienteId', 'nombre', 'stock', 'minimo', 'unidad'],
      properties: {
        ingredienteId: { bsonType: 'string' },
        nombre: { bsonType: 'string' },
        stock: { bsonType: 'int' },
        minimo: { bsonType: 'int' },
        unidad: { bsonType: 'string' },
        ultimaReposicion: { bsonType: 'date' },
        proveedorId: { bsonType: 'string' }
      }
    }
  },
  stockMovements: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['movementId', 'ingredienteId', 'tipo', 'cantidad', 'fecha'],
      properties: {
        movementId: { bsonType: 'string' },
        ingredienteId: { bsonType: 'string' },
        tipo: { enum: ['ENTRADA', 'SALIDA', 'AJUSTE'] },
        cantidad: { bsonType: 'int' },
        fecha: { bsonType: 'date' },
        referencia: { bsonType: 'string' }
      }
    }
  },
  suppliers: {
    // No detallado; esquema mínimo.
    $jsonSchema: {
      bsonType: 'object',
      properties: {
        proveedorId: { bsonType: 'string' },
        nombre: { bsonType: 'string' }
      }
    }
  }
};

async function ensureCollection(db, name, validator) {
  const exists = await db.listCollections({ name }).hasNext();
  if (!exists) {
    await db.createCollection(name, validator ? { validator } : undefined);
    return;
  }
  if (validator) {
    try {
      await db.command({ collMod: name, validator });
    } catch (err) {
      console.warn(`No se pudo aplicar validator en ${db.databaseName}.${name}: ${err.message}`);
    }
  }
}

async function ensureIndexes(collection, indexes) {
  for (const idx of indexes) {
    await collection.createIndex(idx.keys, idx.options || {});
  }
}

async function bootstrapOrders(client) {
  const db = client.db('ordersDB');
  await ensureCollection(db, 'clientes', validators.clientes);
  await ensureCollection(db, 'productos', validators.productos);
  await ensureCollection(db, 'orders', validators.orders);

  await ensureIndexes(db.collection('clientes'), [
    { keys: { clienteId: 1 }, options: { unique: true } },
    { keys: { email: 1 }, options: { unique: true } }
  ]);

  await ensureIndexes(db.collection('orders'), [
    { keys: { orderId: 1 }, options: { unique: true } },
    { keys: { 'cliente.clienteId': 1 } },
    { keys: { estado: 1, fechaCreacion: -1 } },
    { keys: { fechaCreacion: -1 } }
  ]);
}

async function bootstrapKitchen(client) {
  const db = client.db('kitchenDB');
  await ensureCollection(db, 'recipes', validators.recipes);
  await ensureCollection(db, 'kitchen_orders', validators.kitchenOrders);
  await ensureCollection(db, 'kitchen_logs'); // sin esquema detallado

  await ensureIndexes(db.collection('recipes'), [
    { keys: { productoId: 1 }, options: { unique: true } }
  ]);
  await ensureIndexes(db.collection('kitchen_orders'), [
    { keys: { orderRef: 1 }, options: { unique: true } },
    { keys: { estado: 1 } }
  ]);
}

async function bootstrapWarehouse(client) {
  const db = client.db('warehouseDB');
  await ensureCollection(db, 'ingredients', validators.ingredients);
  await ensureCollection(db, 'stock_movements', validators.stockMovements);
  await ensureCollection(db, 'suppliers', validators.suppliers);

  await ensureIndexes(db.collection('ingredients'), [
    { keys: { ingredienteId: 1 }, options: { unique: true } },
    { keys: { stock: 1 } }
  ]);
  await ensureIndexes(db.collection('stock_movements'), [
    { keys: { ingredienteId: 1, fecha: -1 } }
  ]);
}

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    await bootstrapOrders(client);
    await bootstrapKitchen(client);
    await bootstrapWarehouse(client);
    console.log('Bootstrap completado: ordersDB, kitchenDB, warehouseDB listos con validadores e índices.');
  } catch (err) {
    console.error('Error en bootstrap:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
