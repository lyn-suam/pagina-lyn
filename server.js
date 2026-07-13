const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path'); 
const fs = require('fs'); 

const app = express();

// --- CONFIGURACIÓN DE CLOUDINARY ---
cloudinary.config({ 
  cloud_name: 'pzgr0js', 
  api_key: '336281365133553', 
  api_secret: 'qs2Fano3P1BSu1B5ThOC1-0Re9Y' 
});

// Configurar Multer para enviar los archivos directo a Cloudinary (Acepta cualquier formato en Render)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'tienda_productos', 
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'jfif']
  },
});
const upload = multer({ storage });

// --- CONFIGURACIÓN DE MONGODB ATLAS (PRODUCCIÓN REAL) ---
// ⚠️ REEMPLAZA ESTE ENLACE POR TU STRING DE CONEXIÓN DE MONGODB ATLAS
// EJEMPLO DE CÓMO DEBE QUEDAR EN TU ARCHIVO (Con tus datos reales):
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://esuam30:jajajaok.@lynlyn.8u3ac5t.mongodb.net/?appName=lynlyn';

mongoose.connect(MONGO_URI)
  .then(() => console.log('¡Conectado con éxito a MongoDB Atlas en la nube! ☁️🚀'))
  .catch(err => console.error('Error al conectar a MongoDB Atlas:', err));

// Definimos el esquema y el modelo de Producto
const Producto = mongoose.model('Producto', new mongoose.Schema({
    nombre: String,
    precio: Number,
    imagen: String
}));

// --- MIDDLEWARES ---
app.use(express.json()); 
app.use(express.static(path.join(__dirname, '.'))); 

app.get('/', (req, res) => {
    const htmlPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(htmlPath)) {
        res.sendFile(htmlPath);
    } else {
        res.send("<h1>¡Servidor de LYN Store Funcionando en Render!</h1>");
    }
});

// 1. OBTENER PRODUCTOS (Desde la nube de Atlas)
app.get('/productos', async (req, res) => {
    try {
        const productos = await Producto.find();
        res.json(productos);
    } catch (err) {
        res.status(500).send("Error al obtener productos");
    }
});

// 2. CREAR PRODUCTO (MongoDB Atlas + Cloudinary)
app.post('/productos', upload.single('imagen'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send("Error: No se recibió ningún archivo de imagen.");
        }
        
        const nuevoProducto = new Producto({
            nombre: req.body.nombre,
            precio: Number(req.body.precio), 
            imagen: req.file.path // La URL segura https://res.cloudinary.com/...
        });

        const productoGuardado = await nuevoProducto.save();
        return res.status(201).json(productoGuardado); 
        
    } catch (err) {
        console.error("❌ ERROR EN PRODUCCIÓN:", err);
        return res.status(500).send("Error interno en la nube: " + err.message);
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
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));