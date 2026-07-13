const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();

// CONFIGURACIÓN DE CLOUDINARY (Pon tus datos aquí)
cloudinary.config({ 
  cloud_name: 'pzgr0js', 
  api_key: '336281365133553', 
  api_secret: 'qs2Fano3P1BSu1B5ThOC1-0Re9Y' // <-- Pega aquí lo que sale al dar clic en Revelar
});

// Configurar Multer para que envíe los archivos directo a Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'tienda_productos', // Nombre de la carpeta que se creará en Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
  },
});
const upload = multer({ storage });

// Conexión a la nube de MongoDB Atlas
const uri = "mongodb+srv://pagina_lyn_store:jajajaok@cluster0.XXXXX.mongodb.net/?retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(() => console.log('¡Conectado a la nube de MongoDB!'))
  .catch(err => console.error('Error al conectar:', err));

// Definimos el modelo de Producto para MongoDB
const Producto = mongoose.model('Producto', {
    nombre: String,
    precio: Number,
    imagen: String
});

// Middlewares
/*
app.use(express.json());
app.use(express.static('.')); 
app.use('/uploads', express.static('uploads'));
*/
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

// 2. CREAR PRODUCTO (MongoDB)
// CREAR PRODUCTO (Subiendo imagen a Cloudinary de forma permanente)
app.post('/productos', upload.single('imagen'), async (req, res) => {
    try {
        const nuevoProducto = new Producto({
            nombre: req.body.nombre,
            precio: req.body.precio,
            imagen: req.file.path // <-- Cloudinary nos da la URL directa aquí automáticamente
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

// 4. ELIMINAR PRODUCTO (Migrado de SQLite a MongoDB)
app.delete('/productos/:id', async (req, res) => {
    try {
        const id = req.params.id;
        // En MongoDB usamos findByIdAndDelete con el ID único de la nube
        await Producto.findByIdAndDelete(id); 
        res.send("Producto eliminado de la nube");
    } catch (err) {
        res.status(500).send("Error al eliminar el producto: " + err.message);
    }
});

// Puerto dinámico para Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));