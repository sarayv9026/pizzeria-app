import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../config/db.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { documento, password } = req.body || {};
  if (!documento || !password) return res.status(400).json({ error: 'faltan_datos' });
  try {
    const db = await getDb('ordersDB');
    const user = await db.collection('clientes').findOne({ documento });
    if (!user || !user.password) {
      return res.status(401).json({ error: 'usuario o contraseña incorrecta' });
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'usuario o contraseña incorrecta' });
    return res.json({ ok: true, email: user.email, nombre: user.nombre, documento: user.documento });
  } catch (err) {
    console.error('Error en login:', err);
    return res.status(500).json({ error: 'error_bd', message: err.message });
  }
});

export default router;
