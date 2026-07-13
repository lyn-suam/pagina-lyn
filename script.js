let carritoTotal = 0;

// Abrir el modal en lugar del prompt
function mostrarVista(vista) {
    if (vista === 'vendedor') {
        document.getElementById('login-modal').style.display = 'flex';
    } else {
    // En lugar de borrar todo el HTML con innerHTML, solo mandamos a llamar los productos
        cargarProductos();
    }
}

function cerrarModal() {
    document.getElementById('login-modal').style.display = 'none';
}

// Verificar credenciales desde el modal
async function verificarLogin() {
    const usuario = document.getElementById('login-user').value;
    const password = document.getElementById('login-pass').value;

    const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password })
    });

    const data = await res.json();
    if (data.success) {
        cerrarModal();
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="form-container">
                <h1>Nuevo Producto</h1>
                <input id="nombre" placeholder="Nombre"><br>
                <input id="precio" type="number" placeholder="Precio"><br>
                <input type="file" id="fileInput"><br>
                <button onclick="subirProducto()">Guardar Producto</button>
                <div id="productos-grid" class="grid"></div>
            </div>
        `;        
        cargarProductos(true);
    } else {
        alert("Credenciales incorrectas");
    }
}

// Cargar productos desde MongoDB Atlas
async function cargarProductos(esVendedor = false) {
    try {
        const res = await fetch('/productos');
        const productos = await res.json();
        const grid = document.getElementById('productos-grid');
        
        // CORRECCIÓN: Se cambió p.id por p._id para que coincida con MongoDB
        grid.innerHTML = productos.map(p => `
            <div class="producto-card">
                <img src="${p.imagen}" style="width:150px; height:150px; border-radius:10px; object-fit: cover;">
                <h3>${p.nombre}</h3>
                <p class="price">S/ ${p.precio}</p>
                <button onclick="agregarAlCarrito(${p.precio})">Agregar al Carrito</button>
                ${esVendedor ? `<button class="btn-eliminar" onclick="eliminarProducto('${p._id}')">Eliminar</button>` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error("Error al renderizar los productos:", error);
    }
}

// Función para llamar al servidor y borrar usando el _id de MongoDB
async function eliminarProducto(id) {
    if (confirm("¿Estás seguro de eliminar este producto?")) {
        await fetch(`/productos/${id}`, { method: 'DELETE' });
        alert("Producto eliminado");
        cargarProductos(true); // Recargar la lista en vista vendedor
    }
}

// Subir producto a Node.js -> Cloudinary -> MongoDB
async function subirProducto() {
    const nombreInput = document.getElementById('nombre').value;
    const precioInput = document.getElementById('precio').value;
    const fileInput = document.getElementById('fileInput').files[0];

    if (!nombreInput || !precioInput || !fileInput) {
        alert("Por favor, completa todos los campos e introduce una imagen.");
        return;
    }

    const formData = new FormData();
    formData.append('nombre', nombreInput);
    formData.append('precio', precioInput);
    formData.append('imagen', fileInput);
    
    await fetch('/productos', { method: 'POST', body: formData });
    alert("Producto guardado exitosamente");
    mostrarVista('comprador'); // Redirige al catálogo general para ver el resultado
}

function agregarAlCarrito(precio) {
    carritoTotal += precio;
    document.getElementById('total-display').innerText = `S/ ${carritoTotal.toFixed(2)}`;
}

document.addEventListener('DOMContentLoaded', () => mostrarVista('comprador'));