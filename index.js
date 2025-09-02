import express from 'express';
import { dbConnect } from './src/database/config.js';
import http from 'http';
import cors from 'cors';
import morgan from 'morgan';
import { Server } from 'socket.io';
import ordenesRoutes from './src/Routes/Ordenes/index.js';
import proveedoresRoutes from './src/Routes/Proveedores/index.js';
import productosRoutes from "./src/Routes/Producto/index.js";
import tipoProductoRoutes from "./src/Routes/Producto/tipoProducto.js";
import unidadesRoutes from "./src/Routes/UnidadMedida/index.js";
import estadoOrdenRoutes from "./src//Routes/Ordenes/estado.js";
import usuariosRoutes from './src/Routes/Usuarios/index.js'
import rolesRoutes from './src/Routes/Roles/index.js';
import permisosRoutes from './src/Routes/Permisos/index.js'
import recetasRoutes from "./src/Routes/Receta/index.js";
import procesosProduccionRoutes from "./src/Routes/ProcesoProduccion/index.js";
import ingredientesRoutes from './src/Routes/Producto/ingredientes.js';
import stockRoutes from './src/Routes/Stock/index.js';
import movimientosRoutes from './src/Routes/movimientosRoutes/index.js';

const app = express();
const server = http.createServer(app);


// 👉 CORS general para Express
const allowedOrigins = ['http://localhost:5173', 'https://americanobar.netlify.app'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('No permitido por CORS'));
  },
  credentials: true,
}));

// 👉 Socket.io con mismo CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

app.locals.io = io;

// Middleware base
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));


app.use('/ordenes', ordenesRoutes);
app.use('/proveedores', proveedoresRoutes);
app.use("/productos", productosRoutes);
app.use("/tipos", tipoProductoRoutes);
app.use("/unidades", unidadesRoutes);
app.use("/estados", estadoOrdenRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/roles', rolesRoutes);
app.use('/permisos', permisosRoutes);
app.use('/recetas', recetasRoutes);
app.use('/procesos', procesosProduccionRoutes);
app.use('/ingredientes', ingredientesRoutes);
app.use('/stock', stockRoutes);
app.use('/movimientos', movimientosRoutes);


// WebSocket connection
io.on('connection', (socket) => {
  console.log('🟢 Cliente conectado:', socket.id);

  // Unir por defecto a la sala "procesos"
  socket.join("procesos");

  socket.on("joinRoom", async (roomName) => {
    socket.join(roomName);
    console.log(`✅ ${socket.id} -> sala ${roomName}`);
  });

  socket.on('disconnect', () => {
    console.log('🔴 Cliente desconectado');
  });
});

// Arrancar el servidor
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});

// Conexión a DB
dbConnect()
  .then(() => console.log('📦 Base de datos conectada'))
  .catch((err) => console.error('❌ Error DB:', err));
