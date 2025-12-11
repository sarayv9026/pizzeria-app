import { Router } from 'express';
import { Int32 } from 'mongodb';
import { getDb, getClient } from '../config/db.js';

const router = Router();

const fallbackCatalog = [
  { id: 'P001', nombre: 'Margherita', precio: 22000, descripcion: 'Base de tomate y mozzarella fresca.', ingredientes: ['salsa de tomate', 'mozzarella', 'albahaca', 'aceite de oliva'], tipo: 'pizza' },
  { id: 'P002', nombre: 'Pepperoni', precio: 25000, descripcion: 'Clásica con doble pepperoni.', ingredientes: ['pepperoni', 'mozzarella', 'orégano'], tipo: 'pizza' },
  { id: 'P003', nombre: 'Hawaiana', precio: 24000, descripcion: 'Dulce y salada.', ingredientes: ['jamón', 'piña', 'queso', 'salsa de tomate'], tipo: 'pizza' },
  { id: 'P004', nombre: 'Cuatro Quesos', precio: 26000, descripcion: 'Mezcla cremosa de quesos.', ingredientes: ['mozzarella', 'gorgonzola', 'parmesano', 'provolone'], tipo: 'pizza' },
  { id: 'P005', nombre: 'Vegetariana', precio: 23000, descripcion: 'Cargada de vegetales frescos.', ingredientes: ['pimentón', 'champiñón', 'aceitunas', 'cebolla morada'], tipo: 'pizza' },
  { id: 'P006', nombre: 'BBQ Pollo', precio: 27000, descripcion: 'Salsa BBQ ahumada.', ingredientes: ['pollo', 'salsa BBQ', 'queso', 'maíz tierno'], tipo: 'pizza' },
  { id: 'P007', nombre: 'Mexicana', precio: 26000, descripcion: 'Un toque picante.', ingredientes: ['carne molida', 'jalapeños', 'queso', 'frijol'], tipo: 'pizza' },
  { id: 'P008', nombre: 'Carbonara', precio: 28000, descripcion: 'Inspirada en la pasta clásica.', ingredientes: ['tocineta', 'huevo', 'queso pecorino', 'pimienta negra'], tipo: 'pizza' },
  { id: 'B001', nombre: 'Gaseosa Cola 350ml', precio: 4500, descripcion: 'Bebida gaseosa sabor cola 350ml', ingredientes: [], tipo: 'bebida' },
  { id: 'B002', nombre: 'Gaseosa Naranja 350ml', precio: 4500, descripcion: 'Bebida gaseosa sabor naranja 350ml', ingredientes: [], tipo: 'bebida' },
  { id: 'B003', nombre: 'Agua con gas 500ml', precio: 4000, descripcion: 'Agua mineral con gas 500ml', ingredientes: [], tipo: 'bebida' },
  { id: 'B004', nombre: 'Agua sin gas 500ml', precio: 3500, descripcion: 'Agua mineral sin gas 500ml', ingredientes: [], tipo: 'bebida' },
  { id: 'B005', nombre: 'Té frío limón 400ml', precio: 5000, descripcion: 'Té frío sabor limón 400ml', ingredientes: [], tipo: 'bebida' }
];

async function createClienteWithRetry(db, baseCliente, maxAttempts = 10) {
  // En caso de drift, sincroniza el contador con el mayor clienteId existente
  async function syncCounter(session) {
    const agg = await db.collection('clientes').aggregate(
      [
        { $match: { clienteId: { $regex: '^CL\\d+$' } } },
        {
          $addFields: {
            numId: {
              $toInt: {
                $substr: ['$clienteId', 2, 12] // toma dígitos después de CL
              }
            }
          }
        },
        { $sort: { numId: -1 } },
        { $limit: 1 }
      ],
      { session }
    ).toArray();
    const maxSeq = agg.length ? agg[0].numId || 0 : 0;
    await db.collection('counters').updateOne(
      { _id: 'clienteId' },
      { $set: { seq: maxSeq } },
      { upsert: true, session }
    );
    return maxSeq;
  }

  function nextSeqFromValue(value, fallback) {
    if (value && typeof value.seq === 'number' && Number.isFinite(value.seq)) {
      return value.seq;
    }
    return fallback;
  }

  let attempts = 0;
  let lastError;
  while (attempts < maxAttempts) {
    const client = await getClient();
    const session = client.startSession();
    let clienteDoc;
    try {
      const runInsert = async (opts = {}) => {
        const maxSeq = await syncCounter(opts.session);
        const { value } = await db.collection('counters').findOneAndUpdate(
          { _id: 'clienteId' },
          { $inc: { seq: 1 } },
          { upsert: true, returnDocument: 'after', ...opts }
        );
        const seq = nextSeqFromValue(value, maxSeq + 1);
        const clienteId = `CL${String(seq).padStart(4, '0')}`;
        const emailSafe = baseCliente.email || `cliente${String(seq).padStart(3, '0')}@panucci.local`;
        clienteDoc = { ...baseCliente, clienteId, email: emailSafe, fechaRegistro: new Date(), activo: true };
        await db.collection('clientes').insertOne(clienteDoc, opts);
      };

      // intenta con transacción; si no es compatible (p.ej., single server), cae al modo sin sesión
      try {
        await session.withTransaction(async () => runInsert({ session }));
      } catch (txErr) {
        if (txErr?.codeName === 'IllegalOperation' || txErr?.code === 20) {
          // sin soporte de transacciones (memoria/standalone): inserta sin sesión
          await runInsert({});
        } else {
          throw txErr;
        }
      }
      await session.endSession();
      return clienteDoc;
    } catch (err) {
      lastError = err;
      await session.endSession();
      if (err?.code === 11000) {
        // Re-sincroniza contador y reintenta si hubo choque de clave
        await syncCounter();
        attempts += 1;
        continue;
      }
      throw err;
    }
  }
  throw lastError || new Error('No se pudo crear cliente');
}

router.get('/products', async (_req, res) => {
  try {
    const db = await getDb('ordersDB');
    const docs = await db.collection('productos').find({}).toArray();
    const mapped = docs.map((p) => ({
      id: p.productoId || p.id || p._id?.toString(),
      nombre: p.nombre,
      precio: p.precio || 0,
      descripcion: p.descripcion || '',
      ingredientes: p.ingredientes || [],
      tipo: p.tipo || 'pizza'
    }));
    return res.json({ items: mapped.length ? mapped : fallbackCatalog });
  } catch (err) {
    console.error(err);
    return res.json({ items: fallbackCatalog });
  }
});

router.post('/', async (req, res) => {
  const { items, clienteNombre, clienteEmail } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'pedido_invalido' });
  }
  try {
    const ordersDb = await getDb('ordersDB');
    const kitchenDb = await getDb('kitchenDB');

    const baseCliente = {
      nombre: clienteNombre || 'Cliente',
      email: clienteEmail || null
    };
    const cliente = await createClienteWithRetry(ordersDb, baseCliente);
    const clienteId = cliente.clienteId;

    const normalizedItems = items.map((it) => {
      const cantidadNum = parseInt(it.cantidad, 10) || 0;
      const precioUnitNum = parseInt(it.precioUnit, 10) || 0;
      const cantidad = new Int32(cantidadNum);
      const precioUnit = new Int32(precioUnitNum);
      const subtotal = new Int32(cantidadNum * precioUnitNum);
      return {
        productoId: it.productoId,
        nombre: it.nombre,
        cantidad,
        precioUnit,
        subtotal
      };
    });

    const orderId = `ORD_${Date.now()}`;
    const total = new Int32(
      normalizedItems.reduce((acc, it) => acc + (it.subtotal?.valueOf() ?? 0), 0)
    );
    const now = new Date();
    const payload = { orderId, clienteId, cliente, items: normalizedItems, estado: 'CREADO', total, fechaCreacion: now };
    await ordersDb.collection('orders').insertOne(payload);
    // crear orden en cocina
    const kitchenOrder = {
      kitchenOrderId: `KCH_${orderId}`,
      orderRef: orderId,
      estado: 'PENDIENTE',
      productos: normalizedItems.map((it) => ({
        productoId: it.productoId,
        nombre: it.nombre,
        cantidad: it.cantidad,
        ingredientes: []
      })),
      horaAsignacion: now
    };
    await kitchenDb.collection('kitchen_orders').updateOne(
      { orderRef: orderId },
      { $set: kitchenOrder },
      { upsert: true }
    );
    // TODO: publicar ORDER_CREATED en Kafka
    return res.json(payload);
  } catch (err) {
    console.error('Error creando pedido:', err);
    if (err?.writeErrors) console.error(JSON.stringify(err.writeErrors, null, 2));
    return res.status(500).json({ error: 'error_bd', message: err.message });
  }
});

// Crear/actualizar producto (uso admin/testing)
router.post('/products', async (req, res) => {
  const { productoId, nombre, precio, descripcion = '', ingredientes = [] } = req.body || {};
  if (!productoId || !nombre) return res.status(400).json({ error: 'datos_invalidos' });
  try {
    const db = await getDb('ordersDB');
    const doc = { productoId, nombre, precio: Number(precio) || 0, descripcion, ingredientes };
    await db.collection('productos').updateOne(
      { productoId },
      { $set: doc },
      { upsert: true }
    );
    const saved = await db.collection('productos').findOne({ productoId });
    return res.json(saved);
  } catch (err) {
    console.error('Error guardando producto:', err);
    return res.status(500).json({ error: 'error_bd', message: err.message });
  }
});

router.get('/:orderId', async (req, res) => {
  try {
    const db = await getDb('ordersDB');
    const order = await db.collection('orders').findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ error: 'no_encontrado' });
    return res.json(order);
  } catch (err) {
    console.error('Error consultando pedido:', err);
    return res.status(500).json({ error: 'error_bd', message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const db = await getDb('ordersDB');
    const query = {};
    if (req.query.status) query.estado = req.query.status;
    const list = await db.collection('orders').find(query).sort({ fechaCreacion: -1 }).toArray();
    return res.json({ items: list });
  } catch (err) {
    console.error('Error listando pedidos:', err);
    return res.status(500).json({ error: 'error_bd', message: err.message });
  }
});

router.post('/:orderId/cancel', async (req, res) => {
  try {
    const db = await getDb('ordersDB');
    const order = await db.collection('orders').findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ error: 'no_encontrado' });
    if (order.estado !== 'CREADO') return res.status(409).json({ error: 'no_cancelable' });
    await db.collection('orders').updateOne({ orderId: req.params.orderId }, { $set: { estado: 'CANCELADO' } });
    const updated = await db.collection('orders').findOne({ orderId: req.params.orderId });
    return res.json(updated);
  } catch (err) {
    console.error('Error cancelando pedido:', err);
    return res.status(500).json({ error: 'error_bd', message: err.message });
  }
});

router.patch('/:orderId/status', async (req, res) => {
  const { estado } = req.body || {};
  const allowed = ['CREADO', 'EN_PREPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO'];
  if (!allowed.includes(estado)) return res.status(400).json({ error: 'estado_invalido' });
  try {
    const db = await getDb('ordersDB');
    const order = await db.collection('orders').findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ error: 'no_encontrado' });
    await db.collection('orders').updateOne({ orderId: req.params.orderId }, { $set: { estado } });
    const updated = await db.collection('orders').findOne({ orderId: req.params.orderId });
    // TODO: emitir evento de estado actualizado
    return res.json(updated);
  } catch (err) {
    console.error('Error actualizando estado pedido:', err);
    return res.status(500).json({ error: 'error_bd', message: err.message });
  }
});

export default router;
