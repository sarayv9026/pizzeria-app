/**
 * Seed de productos para ordersDB.productos
 * Usa MONGODB_URI del entorno.
 */
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('Falta MONGODB_URI');
  process.exit(1);
}

const basePizzas = [
  { productoId: 'P001', nombre: 'Margherita', precio: 22000, descripcion: 'Base de tomate y mozzarella fresca.', ingredientes: ['salsa de tomate', 'mozzarella', 'albahaca', 'aceite de oliva'], tipo: 'pizza' },
  { productoId: 'P002', nombre: 'Pepperoni', precio: 25000, descripcion: 'Clásica con doble pepperoni.', ingredientes: ['pepperoni', 'mozzarella', 'orégano'], tipo: 'pizza' },
  { productoId: 'P003', nombre: 'Hawaiana', precio: 24000, descripcion: 'Dulce y salada.', ingredientes: ['jamón', 'piña', 'queso', 'salsa de tomate'], tipo: 'pizza' },
  { productoId: 'P004', nombre: 'Cuatro Quesos', precio: 26000, descripcion: 'Mezcla cremosa de quesos.', ingredientes: ['mozzarella', 'gorgonzola', 'parmesano', 'provolone'], tipo: 'pizza' },
  { productoId: 'P005', nombre: 'Vegetariana', precio: 23000, descripcion: 'Cargada de vegetales frescos.', ingredientes: ['pimentón', 'champiñón', 'aceitunas', 'cebolla morada'], tipo: 'pizza' },
  { productoId: 'P006', nombre: 'BBQ Pollo', precio: 27000, descripcion: 'Salsa BBQ ahumada.', ingredientes: ['pollo', 'salsa BBQ', 'queso', 'maíz tierno'], tipo: 'pizza' },
  { productoId: 'P007', nombre: 'Mexicana', precio: 26000, descripcion: 'Un toque picante.', ingredientes: ['carne molida', 'jalapeños', 'queso', 'frijol'], tipo: 'pizza' },
  { productoId: 'P008', nombre: 'Carbonara', precio: 28000, descripcion: 'Inspirada en la pasta clásica.', ingredientes: ['tocineta', 'huevo', 'queso pecorino', 'pimienta negra'], tipo: 'pizza' }
];

const bebidas = [
  { productoId: 'B001', nombre: 'Gaseosa Cola 350ml', precio: 4500, descripcion: 'Bebida gaseosa sabor cola 350ml', ingredientes: [], tipo: 'bebida' },
  { productoId: 'B002', nombre: 'Gaseosa Naranja 350ml', precio: 4500, descripcion: 'Bebida gaseosa sabor naranja 350ml', ingredientes: [], tipo: 'bebida' },
  { productoId: 'B003', nombre: 'Agua con gas 500ml', precio: 4000, descripcion: 'Agua mineral con gas 500ml', ingredientes: [], tipo: 'bebida' },
  { productoId: 'B004', nombre: 'Agua sin gas 500ml', precio: 3500, descripcion: 'Agua mineral sin gas 500ml', ingredientes: [], tipo: 'bebida' },
  { productoId: 'B005', nombre: 'Té frío limón 400ml', precio: 5000, descripcion: 'Té frío sabor limón 400ml', ingredientes: [], tipo: 'bebida' }
];

const products = [...basePizzas, ...bebidas];

async function seed() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('ordersDB');
    const col = db.collection('productos');

    for (const p of products) {
      await col.updateOne(
        { productoId: p.productoId },
        { $set: p },
        { upsert: true }
      );
    }
    console.log(`Seed completado: ${products.length} productos upserted.`);
  } catch (err) {
    console.error('Error en seed:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();
