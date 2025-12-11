import { Router } from 'express';
import { getDb } from '../config/db.js';

const router = Router();

router.get('/orders/:orderRef', async (req, res) => {
  try {
    const db = await getDb('kitchenDB');
    const ko = await db.collection('kitchen_orders').findOne({ orderRef: req.params.orderRef });
    if (!ko) return res.status(404).json({ error: 'no_encontrado' });
    return res.json(ko);
  } catch (err) {
    console.error('Error consultando kitchen_order:', err);
    return res.status(500).json({ error: 'error_bd', message: err.message });
  }
});

router.get('/orders', async (_req, res) => {
  try {
    const db = await getDb('kitchenDB');
    const list = await db.collection('kitchen_orders').find({}).toArray();
    return res.json({ items: list });
  } catch (err) {
    console.error('Error listando kitchen_orders:', err);
    return res.status(500).json({ error: 'error_bd', message: err.message });
  }
});

router.post('/orders/:orderRef/status', async (req, res) => {
  const { estado } = req.body || {};
  if (!['PENDIENTE', 'EN_PREPARACION', 'LISTO'].includes(estado)) {
    return res.status(400).json({ error: 'estado_invalido' });
  }
  try {
    const db = await getDb('kitchenDB');
    const existing = await db.collection('kitchen_orders').findOne({ orderRef: req.params.orderRef });
    const base = existing || { orderRef: req.params.orderRef, productos: [], horaAsignacion: new Date() };
    const next = { ...base, estado };
    await db.collection('kitchen_orders').updateOne(
      { orderRef: req.params.orderRef },
      { $set: next },
      { upsert: true }
    );
    const updated = await db.collection('kitchen_orders').findOne({ orderRef: req.params.orderRef });
    // TODO: publicar evento KITCHEN_* a Kafka
    await db.collection('kitchen_logs').insertOne({
      orderRef: req.params.orderRef,
      estado,
      at: new Date()
    });
    return res.json(updated);
  } catch (err) {
    console.error('Error actualizando estado de cocina:', err);
    return res.status(500).json({ error: 'error_bd', message: err.message });
  }
});

export default router;
