const express = require('express');
const mongoose = require('mongoose');
const path = require('path'); 
const fs = require('fs'); 

const app = express();

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// --- CONEXIÓN DIRECTA Y SEGURA CON CLOUDINARY ---
cloudinary.config({ 
  cloud_name: 'pzgr08js', 
  api_key: '336281365133553', 
  api_secret: 'qs2Fano3P1BSu1B5ThOC1-0Re9Y' 
});

// --- CONFIGURACIÓN DEL ALMACENAMIENTO ---
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'tienda_lyn', // Crea una carpeta organizada en tu cuenta de Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'jfif', 'webp'], // Permite audios.jfif sin problemas
  },
});

const upload = multer({ storage: storage });

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


// 2. CREAR PRODUCTO (Ruta auditada con Logs detallados)
app.post('/productos', upload.single('imagen'), async (req, res) => {
    console.log("=== 📥 NUEVA PETICIÓN DETECTADA EN /PRODUCTOS ===");
    console.log("Cuerpo del formulario (body):", req.body);
    console.log("Archivo recibido (file):", req.file);

    try {
        if (!req.file) {
            console.log("❌ Alerta: No llegó ningún archivo de imagen a la ruta.");
            return res.status(400).send("Error: No se recibió ningún archivo de imagen.");
        }
        
        console.log("⏳ Intentando guardar los datos del producto en MongoDB Atlas...");
        const nuevoProducto = new Producto({
            nombre: req.body.nombre,
            precio: Number(req.body.precio), 
            imagen: req.file.path // URL de Cloudinary
        });

        const productoGuardado = await nuevoProducto.save();
        console.log("✅ ¡Producto guardado exitosamente en Atlas!", productoGuardado);
        return res.status(201).json(productoGuardado); 
        
    } catch (err) {
        // 1. Esto imprime el objeto completo con su rastreo de líneas exactas (Stack Trace)
        console.error("💥 ERROR DETECTADO EN LA NUBE:");
        console.error(err); 
        
        // 2. Si es un error de Mongoose/MongoDB, esto extraerá el detalle interno
        if (err.name) console.error("📋 Tipo de Error:", err.name);
        if (err.code) console.error("🔑 Código de Error Mongo:", err.code);

        return res.status(500).send("Error interno del servidor al guardar el producto.");
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

app.use((err, req, res, next) => {
    console.error("💥 ERROR GLOBAL DETECTADO EN EL SERVIDOR:");
    
    // Imprime el mensaje directo
    console.error("Mensaje:", err.message);
    
    // Imprime todo el objeto de error detallado en la consola de Render
    console.error(err); 
    
    // Si viene de Multer, nos dará una pista de archivo
    if (err instanceof multer.MulterError) {
        console.error("❌ Error específico de Multer:", err.code);
    }

    res.status(500).send("Error interno atrapado por el middleware global: " + err.message);
});

app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));