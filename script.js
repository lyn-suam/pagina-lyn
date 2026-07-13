let carritoTotal = 0;

// Alternar vistas limpiando y estructurando el contenedor principal
function mostrarVista(vista) {
    if (vista === 'vendedor') {
        document.getElementById('login-modal').style.display = 'flex';
    } else {
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = `
                <h1>Bienvenido a la Tienda</h1>
                <div id="productos-grid" class="grid"></div>
            `;
        }
        cargarProductos();
    }
}

// Cerrar el modal de login de forma segura
function cerrarModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Verificar credenciales e inyectar panel de administración
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
            // Inyectamos de forma segura el formulario arriba y el grid abajo
            app.innerHTML = `
                <div class="form-container" style="margin: 30px auto; text-align: center; max-width: 420px; padding: 30px; border-radius: 15px; background: rgba(255, 255, 255, 0.95); box-shadow: 0 4px 15px rgba(0,0,0,0.2); color: #333; font-family: sans-serif;">
                    <h1 style="color: #ae2012; margin-bottom: 20px; font-size: 24px;">Panel de Administración</h1>
                    <p style="color: #666; margin-bottom: 15px;">Introduce los datos del nuevo producto:</p>
                    
                    <input id="nombre" placeholder="Nombre del producto" style="margin: 8px 0; padding: 10px; width: 85%; border: 1px solid #ccc; border-radius: 5px; font-size: 14px;"><br>
                    <input id="precio" type="number" placeholder="Precio (S/)" style="margin: 8px 0; padding: 10px; width: 85%; border: 1px solid #ccc; border-radius: 5px; font-size: 14px;"><br>
                    
                    <div style="margin: 15px 0; text-align: left; padding-left: 8%;">
                        <label style="font-size: 12px; color: #555; display: block; margin-bottom: 5px;">Imagen del producto:</label>
                        <input type="file" id="fileInput" style="font-size: 13px;">
                    </div>
                    
                    <button onclick="subirProducto()" style="padding: 12px 25px; background-color: #1e88e5; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 15px; font-size: 15px; font-weight: bold; width: 90%;">
                        🚀 Guardar y Publicar Producto
                    </button>
                </div>
                <div id="productos-grid" class="grid" style="margin-top: 40px;"></div>
            `;
        }
        
        // Cargamos los productos con los botones de eliminar activos
        setTimeout(() => cargarProductos(true), 100);
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
        
        if (!grid) return; // Protección para que no rompa la consola
        
        grid.innerHTML = productos.map(p => `
            <div class="producto-card">
                <img src="${p.imagen}" style="width:150px; height:150px; border-radius:10px; object-fit: cover;">
                <h3>${p.nombre}</h3>
                <p class="price">S/ ${p.precio}</p>
                <button onclick="agregarAlCarrito(${p.precio})">Agregar al Carrito</button>
                ${esVendedor ? `<button class="btn-eliminar" onclick="eliminarProducto('${p._id}')" style="background-color: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 3px; margin-top: 5px; cursor: pointer;">Eliminar</button>` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error("Error al renderizar los productos:", error);
    }
}

// Función para eliminar usando el _id de MongoDB
async function eliminarProducto(id) {
    if (confirm("¿Estás seguro de eliminar este producto?")) {
        await fetch(`/productos/${id}`, { method: 'DELETE' });
        alert("Producto eliminado");
        
        const formularioExiste = document.getElementById('nombre') !== null;
        cargarProductos(formularioExiste); 
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
    
    // Forzamos un refresco completo para limpiar el formulario y renderizar la tienda de comprador de manera limpia
    window.location.reload();
}

function agregarAlCarrito(precio) {
    carritoTotal += precio;
    document.getElementById('total-display').innerText = `S/ ${carritoTotal.toFixed(2)}`;
}

// Arranca mostrando el catálogo limpio del comprador al abrir la página
document.addEventListener('DOMContentLoaded', () => mostrarVista('comprador'));