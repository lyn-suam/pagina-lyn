let carritoTotal = 0;

// Abrir el modal en lugar del prompt
function mostrarVista(vista) {
    if (vista === 'vendedor') {
        document.getElementById('login-modal').style.display = 'flex';
    } else {
        // Lógica normal de comprador
        const app = document.getElementById('app');
        app.innerHTML = `<h1>Catálogo</h1><div id="productos-grid" class="grid"></div>`;
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

async function cargarProductos(esVendedor = false) {
    const res = await fetch('/productos');
    const productos = await res.json();
    const grid = document.getElementById('productos-grid');
    
    grid.innerHTML = productos.map(p => `
        <div class="producto-card">
            <img src="${p.imagen}" style="width:150px; height:150px; border-radius:10px;">
            <h3>${p.nombre}</h3>
            <p class="price">S/ ${p.precio}</p>
            <button onclick="agregarAlCarrito(${p.precio})">Agregar al Carrito</button>
            ${esVendedor ? `<button class="btn-eliminar" onclick="eliminarProducto(${p.id})">Eliminar</button>` : ''}
        </div>
    `).join('');
}

// Función para llamar al servidor y borrar
async function eliminarProducto(id) {
    if (confirm("¿Estás seguro de eliminar este producto?")) {
        await fetch(`/productos/${id}`, { method: 'DELETE' });
        alert("Producto eliminado");
        cargarProductos(true); // Recargar la lista
    }
}

async function subirProducto() {
    const formData = new FormData();
    formData.append('nombre', document.getElementById('nombre').value);
    formData.append('precio', document.getElementById('precio').value);
    formData.append('imagen', document.getElementById('fileInput').files[0]);
    
    await fetch('/productos', { method: 'POST', body: formData });
    alert("Producto guardado exitosamente");
    mostrarVista('comprador');
}

function agregarAlCarrito(precio) {
    carritoTotal += precio;
    document.getElementById('total-display').innerText = `S/ ${carritoTotal.toFixed(2)}`;
}

document.addEventListener('DOMContentLoaded', () => mostrarVista('comprador'));