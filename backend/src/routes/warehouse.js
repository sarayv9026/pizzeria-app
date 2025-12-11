import { Router } from 'express';
import { getDb } from '../config/db.js';

const router = Router();

router.get('/ingredients/:ingredienteId', async (req, res) => {
  try {
    const db = await getDb('warehouseDB');
    const ing = await db.collection('ingredients').findOne({ ingredienteId: req.params.ingredienteId });
    if (!ing) return res.status(404).json({ error: 'no_encontrado' });
    return res.json(ing);
  } catch (err) {
    console.error('Error consultando ingrediente:', err);
    return res.status(500).json({ error: 'error_bd', message: err.message });
  }
});

router.post('/ingredients/:ingredienteId/movements', async (req, res) => {
  const { tipo, cantidad, referencia } = req.body || {};
  if (!['ENTRADA', 'SALIDA', 'AJUSTE'].includes(tipo) || !cantidad) {
    return res.status(400).json({ error: 'datos_invalidos' });
  }
  try {
    const db = await getDb('warehouseDB');
    const delta = tipo === 'SALIDA' ? -Math.abs(Number(cantidad)) : Math.abs(Number(cantidad));
    const result = await db.collection('ingredients').findOneAndUpdate(
      { ingredienteId: req.params.ingredienteId, stock: { $gte: tipo === 'SALIDA' ? Math.abs(Number(cantidad)) : 0 } },
      { $inc: { stock: delta } },
      { returnDocument: 'after', upsert: tipo !== 'SALIDA' } // permitimos upsert en entrada/ajuste
    );
    if (!result.value) return res.status(409).json({ error: 'stock_insuficiente' });
    await db.collection('stock_movements').insertOne({
      movementId: `MV_${Date.now()}`,
      ingredienteId: req.params.ingredienteId,
      tipo,
      cantidad: Math.abs(Number(cantidad)),
      fecha: new Date(),
      referencia
    });
    // TODO: publicar STOCK_UPDATED en Kafka
    return res.json(result.value);
  } catch (err) {
    console.error('Error registrando movimiento:', err);
    return res.status(500).json({ error: 'error_bd', message: err.message });
  }
});

export default router;
