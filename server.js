const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path'); // Requerido para manejar rutas de archivos de forma segura

const app = express();

// CONFIGURACIÓN DE CLOUDINARY
cloudinary.config({ 
  cloud_name: 'pzgr0js', 
  api_key: '336281365133553', 
  api_secret: 'qs2Fano3P1BSu1B5ThOC1-0Re9Y' 
});

// Configurar Multer para enviar los archivos directo a Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'tienda_productos', 
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
  },
});
const upload = multer({ storage });

// Conexión a la nube de MongoDB Atlas

const uri = "mongodb+srv://esuam30:jajajaok.@cluster0.tphf9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(uri)
  .then(() => console.log('¡Conectado a la nube de MongoDB!'))
  .catch(err => console.error('Error al conectar:', err));

// Definimos el modelo de Producto para MongoDB
const Producto = mongoose.model('Producto', {
    nombre: String,
    precio: Number,
    imagen: String
});

// --- MIDDLEWARES (¡Reactivados y Corregidos!) ---
app.use(express.json()); // Permite que Express entienda los datos JSON que envía tu frontend

// Sirve todos los archivos de la carpeta principal (HTML, CSS, JS del cliente)
app.use(express.static(path.join(__dirname, '.'))); 

// RUTA RAÍZ: Asegura el envío de tu interfaz visual principal cuando cargue el link de Render
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


// --- RUTAS DE LA API ---

// 1. OBTENER PRODUCTOS (MongoDB)
app.get('/productos', async (req, res) => {
    try {
        const productos = await Producto.find();
        res.json(productos);
    } catch (err) {
        res.status(500).send("Error al obtener productos");
    }
});

// 2. CREAR PRODUCTO (MongoDB + Cloudinary)
app.post('/productos', upload.single('imagen'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send("No se subió ninguna imagen");
        }
        const nuevoProducto = new Producto({
            nombre: req.body.nombre,
            precio: req.body.precio,
            imagen: req.file.path // La URL segura que nos genera Cloudinary de forma permanente
        });
        await nuevoProducto.save();
        res.send("Producto guardado en la nube de forma permanente");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error al guardar el producto");
    }
});

// 3. LOGIN (Fijo en código)
app.post('/login', (req, res) => {
    const { usuario, password } = req.body;
    if (usuario === "admin" && password === "1234") {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: "Acceso denegado" });
    }
});

// 4. ELIMINAR PRODUCTO (MongoDB)
app.delete('/productos/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await Producto.findByIdAndDelete(id); 
        res.send("Producto eliminado de la nube");
    } catch (err) {
        res.status(500).send("Error al eliminar el producto: " + err.message);
    }
});

// Puerto dinámico para Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));