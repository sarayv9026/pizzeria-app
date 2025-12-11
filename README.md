# Food Platform (prototipo académico)

Aplicación full-stack (backend Node/Express + frontend React/Vite) que modela los módulos de Órdenes, Cocina y Bodega para una pizzería. Uso académico; prohibida su comercialización. Derechos reservados.

Autor: 
- [Carlos Castellanos](https://github.com/castell482)


## Requisitos
- Node.js 18+ (ideal 20+)
- MongoDB Atlas (URI propia)
- Docker opcional para despliegue
- Jest (para ejecutar la suite de pruebas)

## Backend (Node/Express)
```bash
cd backend
npm install
cp .env.example .env   # MONGODB_URI, PORT=3000, HOST=0.0.0.0
npm run dev            # desarrollo con nodemon
# ó
npm start              # producción/local sin watch
```
Sirve en `http://HOST:PORT` (por defecto `http://127.0.0.1:3000`) con prefijo `/v1`.

### Variables de entorno (`backend/.env`)
```
PORT=3000
HOST=0.0.0.0
MONGODB_URI=mongodb+srv://user:pwd@cluster/...
```

### Scripts útiles
- `npm run seed:products`  → carga catálogo (pizzas y bebidas) en `ordersDB.productos`.
- `npm run reset:orders`   → borra `ordersDB.orders`, `ordersDB.clientes`, `ordersDB.counters` y reinicia el consecutivo de clientes en 0 (requiere `MONGODB_URI` en `.env`).
- `npm test`               → ejecuta pruebas (unitarias, integración y caja blanca básica) con Jest y Mongo en memoria.

## Frontend (React/Vite)
```bash
cd frontend
npm install
VITE_API_URL="http://127.0.0.1:3000" npm run dev   # ajusta al host/puerto del backend
```
Servidor Vite en `http://localhost:5173`. El frontend consume el backend vía `/v1` usando `VITE_API_URL` como proxy.

## Docker / Compose
Backend y frontend contenedorizados, Mongo sigue en Atlas:
```bash
docker compose build \
  --build-arg VITE_API_URL=http://localhost:3000
docker compose up
```
- Backend: expone `3000` (configurable en `backend/.env`).
- Frontend: expone `5173`.
- `MONGODB_URI` debe apuntar a tu cluster Atlas.

## Flujo de despliegue (local)
1. Configura `backend/.env` con `MONGODB_URI`.
2. `npm install` en backend y frontend.
3. (Opcional) `npm run seed:products` en backend para cargar catálogo.
4. Ejecuta backend (`npm run dev` o `npm start`) y frontend (`npm run dev` con `VITE_API_URL` apuntando al backend).

## Endpoints principales
- POST `/v1/orders`          → crear pedido.
- GET `/v1/orders`           → listar pedidos (query `status` opcional).
- GET `/v1/orders/:orderId`  → consultar pedido.
- PATCH `/v1/orders/:orderId/status` → actualizar estado (`CREADO`, `EN_PREPARACION`, `LISTO`, `ENTREGADO`, `CANCELADO`).
- POST `/v1/orders/:orderId/cancel` → cancelar si está `CREADO`.
- GET `/v1/orders/products`  → catálogo.
- POST `/v1/auth/login`      → login de colaboradores (documento + password).

## Notas de uso
- El consecutivo de clientes se gestiona en `ordersDB.counters`; usa `npm run reset:orders` si queda corrupto.
- Cocina y bodega usan `kitchenDB.kitchen_orders`, `warehouseDB.ingredients`, `warehouseDB.stock_movements`.
- Integraciones Kafka y lógica avanzada están marcadas como TODO para futuras iteraciones.

## Pruebas automatizadas
- **Unitarias / caja blanca**: verifican flujo de login y creación de clientes/órdenes sin duplicar `clienteId`.
- **Integración**: usan `supertest` sobre `app` + `mongodb-memory-server` para simular la API completa con Mongo en memoria (no requiere Atlas). En entornos con restricciones de puertos, las pruebas de integración se omiten automáticamente.
- Backend: `cd backend && npm test` (Jest con Mongo en memoria; si el entorno bloquea puertos, las integraciones se omiten).
- Frontend: `cd frontend && npm test` (Vitest + Testing Library en jsdom).
- Observación: si necesitas ejecutar integraciones reales, apunta `MONGODB_URI` a una base de pruebas en Atlas y ajusta los tests según tu entorno.

## Licencia / Alcance
Software académico (proyecto universitario). Todos los derechos reservados © castell482. Este código y sus artefactos (backend, frontend, scripts y documentación) se entregan únicamente para fines educativos. Queda prohibida su venta, sublicenciamiento, distribución comercial o uso en producción sin autorización expresa y por escrito del autor. No se otorgan garantías de ningún tipo (implícitas o explícitas); el uso es bajo responsabilidad del usuario.
