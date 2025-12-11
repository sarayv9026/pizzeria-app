import dotenv from 'dotenv';

dotenv.config();

const env = {
  host: process.env.HOST || '127.0.0.1',
  port: Number(process.env.PORT || 3000),
  mongoUri: process.env.MONGODB_URI
};

if (!env.mongoUri) {
  console.warn('MONGODB_URI no está definido; las rutas que usan BD fallarán.');
}

export default env;
