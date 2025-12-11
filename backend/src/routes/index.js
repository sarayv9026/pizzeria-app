import { Router } from 'express';
import ordersRouter from './orders.js';
import kitchenRouter from './kitchen.js';
import warehouseRouter from './warehouse.js';
import authRouter from './auth.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok', service: 'api-gateway' }));
router.use('/orders', ordersRouter);
router.use('/kitchen', kitchenRouter);
router.use('/warehouse', warehouseRouter);
router.use('/auth', authRouter);

export default router;
