const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path'); 
const fs = require('fs'); 
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = express();

// CORRECCIÓN DIRECTA: Crear carpeta temporal de imágenes si no existe
const dirUploads = path.join(__dirname, 'uploads');
if (!fs.existsSync(dirUploads)){
    fs.mkdirSync(dirUploads);
}

// Configurar Multer para almacenar las imágenes localmente en tu computadora
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// --- CONFIGURACIÓN DE MONGODB PORTÁTIL ---
async function iniciarBaseDeDatos() {
  try {
    const mongoServer = await MongoMemoryServer.create({
      binary: { version: '6.0.14' }
    });
    const uriLocal = mongoServer.getUri();
    await mongoose.connect(uriLocal);
    console.log('¡Conectado con éxito a tu MongoDB Local Automático (v6.0)! 🚀');
  } catch (err) {
    console.error('Error al inicializar la base de datos local:', err);
  }
}
iniciarBaseDeDatos();

// Definimos el esquema y el modelo de Producto
const Producto = mongoose.model('Producto', new mongoose.Schema({
    nombre: String,
    precio: Number,
    imagen: String
}));

// --- MIDDLEWARES ---
app.use(express.json()); 
app.use(express.static(path.join(__dirname, '.'))); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Servir imágenes locales

app.get('/', (req, res) => {
    const htmlPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(htmlPath)) {
        res.sendFile(htmlPath);
    } else {
        res.send("<h1>¡Servidor funcionando!</h1>");
    }
});

// 1. OBTENER PRODUCTOS
app.get('/productos', async (req, res) => {
    try {
        const productos = await Producto.find();
        res.json(productos);
    } catch (err) {
        res.status(500).send("Error al obtener productos");
    }
});

// 2. CREAR PRODUCTO (MongoDB Portátil + Multer Local)
app.post('/productos', upload.single('imagen'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send("Error: No se recibió ningún archivo de imagen.");
        }
        
        // Construimos la ruta local legible por el navegador (ej: /uploads/12345.png)
        const imagenPath = '/uploads/' + req.file.filename;

        const nuevoProducto = new Producto({
            nombre: req.body.nombre,
            precio: Number(req.body.precio), 
            imagen: imagenPath 
        });

        const productoGuardado = await nuevoProducto.save();
        return res.status(201).json(productoGuardado); 
        
    } catch (err) {
        console.error("❌ ERROR INTERNO EN POST /PRODUCTOS:", err);
        return res.status(500).send("Error interno del servidor: " + err.message);
    }
});

// 3. LOGIN
app.post('/login', (req, res) => {
    const { usuario, password } = req.body;
    if (usuario === "admin" && password === "1234") {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: "Acceso denegado" });
    }
});

// 4. ELIMINAR PRODUCTO
app.delete('/productos/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await Producto.findByIdAndDelete(id); 
        res.send("Producto eliminado");
    } catch (err) {
        res.status(500).send("Error al eliminar: " + err.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));