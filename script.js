let carritoTotal = 0;

// Manejo de Vistas sincronizado
function mostrarVista(vista) {
    if (vista === 'vendedor') {
        document.getElementById('login-modal').style.display = 'flex';
    } else {
        const app = document.getElementById('app');
        if (app) {
            // Reestablecemos el layout nativo del comprador de forma limpia
            app.innerHTML = `
                <h1>Bienvenido a la Tienda</h1>
                <div id="productos-grid" class="grid"></div>
            `;
        }
        setTimeout(() => cargarProductos(false), 50);
    }
}

function cerrarModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Login del Administrador
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
        if (app) {
            // Colocamos el formulario administrativo arriba y la grilla abajo
            app.innerHTML = `
                <div class="form-container" style="margin: 20px auto; text-align: center; max-width: 400px; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background: #fff; color: #333;">
                    <h1>Nuevo Producto</h1>
                    <input id="nombre" placeholder="Nombre" style="margin: 5px; padding: 8px; width: 80%;"><br>
                    <input id="precio" type="number" placeholder="Precio" style="margin: 5px; padding: 8px; width: 80%;"><br>
                    <input type="file" id="fileInput" style="margin: 5px; padding: 8px; width: 80%;"><br>
                    <button onclick="subirProducto()" style="padding: 10px 20px; margin-top: 10px; cursor: pointer;">Guardar Producto</button>
                </div>
                <div id="productos-grid" class="grid"></div>
            `;
        }
        setTimeout(() => cargarProductos(true), 50);
    } else {
        alert("Credenciales incorrectas");
    }
}

// Cargar productos en la grilla dinámica
async function cargarProductos(esVendedor = false) {
    try {
        const res = await fetch('/productos');
        const productos = await res.json();
        const grid = document.getElementById('productos-grid');
        
        if (!grid) return; // Validación de seguridad
        
        grid.innerHTML = productos.map(p => `
            <div class="producto-card">
                <img src="${p.imagen}" style="width:150px; height:150px; border-radius:10px; object-fit: cover;">
                <h3>${p.nombre}</h3>
                <p class="price">S/ ${Number(p.precio).toFixed(2)}</p>
                <button onclick="agregarAlCarrito(${p.precio})">Agregar al Carrito</button>
                ${esVendedor ? `<button class="btn-eliminar" onclick="eliminarProducto('${p._id}')" style="background-color: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 3px; margin-top: 5px; cursor: pointer;">Eliminar</button>` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error("Error al obtener o renderizar productos:", error);
    }
}

// Eliminar Producto
async function eliminarProducto(id) {
    if (confirm("¿Estás seguro de eliminar este producto?")) {
        await fetch(`/productos/${id}`, { method: 'DELETE' });
        alert("Producto eliminado");
        cargarProductos(true);
    }
}

// Subir Producto
async function subirProducto() {
    const nombre = document.getElementById('nombre').value;
    const precio = document.getElementById('precio').value;
    const imagen = document.getElementById('fileInput').files[0];

    if (!nombre || !precio || !imagen) {
        alert("Por favor, completa todos los campos.");
        return;
    }

    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('precio', precio);
    formData.append('imagen', imagen);

    await fetch('/productos', { method: 'POST', body: formData });
    alert("Producto guardado exitosamente");
    
    // Forzamos un regreso limpio a la vista de comprador
    mostrarVista('comprador');
}

function agregarAlCarrito(precio) {
    carritoTotal += Number(precio);
    document.getElementById('total-display').innerText = `S/ ${carritoTotal.toFixed(2)}`;
}

document.addEventListener('DOMContentLoaded', () => mostrarVista('comprador'));