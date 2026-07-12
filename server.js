const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const app = express();

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });
const mongoose = require('mongoose');

// Aquí va el link que copiaste de "Drivers" en Atlas
// IMPORTANTE: Cambia <password> por tu contraseña real: jajajaok
const uri = "mongodb+srv://pagina_lyn_store:jajajaok@cluster0.XXXXX.mongodb.net/?retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(() => console.log('¡Conectado a la nube de MongoDB!'))
  .catch(err => console.error('Error al conectar:', err));

// Definimos cómo se ve un producto en nuestra base de datos
const Producto = mongoose.model('Producto', {
    nombre: String,
    precio: Number,
    imagen: String
});

app.use(express.json());
app.use(express.static('.')); 
app.use('/uploads', express.static('uploads'));

const db = new sqlite3.Database('./tienda.db');
db.run("CREATE TABLE IF NOT EXISTS productos (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT, precio REAL, imagen TEXT)");

app.get('/productos', async (req, res) => {
    const productos = await Producto.find();
    res.json(productos);
});

app.post('/productos', upload.single('imagen'), async (req, res) => {
    const nuevoProducto = new Producto({
        nombre: req.body.nombre,
        precio: req.body.precio,
        imagen: '/uploads/' + req.file.filename
    });
    await nuevoProducto.save();
    res.send("Producto guardado en la nube");
});

app.post('/login', (req, res) => {
    const { usuario, password } = req.body;
    // Credenciales "de base" (hardcoded)
    if (usuario === "admin" && password === "1234") {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: "Acceso denegado" });
    }
});

app.delete('/productos/:id', (req, res) => {
    const id = req.params.id;
    db.run("DELETE FROM productos WHERE id = ?", id, (err) => {
        if (err) return res.status(500).send(err.message);
        res.send("Producto eliminado");
    });
});

//app.listen(3000, () => console.log('Servidor activo en http://localhost:3000'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));