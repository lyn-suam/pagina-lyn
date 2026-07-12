const express = require('express');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose'); // Usamos Mongoose para MongoDB

const app = express();

// Configuración de almacenamiento para imágenes
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
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
app.use(express.json());
app.use(express.static('.')); 
app.use('/uploads', express.static('uploads'));

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
app.post('/productos', upload.single('imagen'), async (req, res) => {
    try {
        const nuevoProducto = new Producto({
            nombre: req.body.nombre,
            precio: req.body.precio,
            imagen: '/uploads/' + req.file.filename
        });
        await nuevoProducto.save();
        res.send("Producto guardado en la nube");
    } catch (err) {
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