let carritoTotal = 0;

// Alternar vistas controlando la visibilidad nativa de los elementos
function mostrarVista(vista) {
    const titulo = document.getElementById('titulo-pagina');
    const formulario = document.getElementById('admin-form-container');
    
    if (vista === 'vendedor') {
        document.getElementById('login-modal').style.display = 'flex';
    } else {
        // Modo Comprador: Ocultamos formulario y mostramos catálogo
        if (titulo) titulo.innerText = "Bienvenido a la Tienda";
        if (formulario) formulario.style.display = 'none';
        cerrarModal();
        cargarProductos(false);
    }
}

function cerrarModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Iniciar sesión como administrador
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
        
        const titulo = document.getElementById('titulo-pagina');
        const formulario = document.getElementById('admin-form-container');
        
        // Activamos la interfaz de vendedor de forma limpia sin romper el DOM
        if (titulo) titulo.innerText = "Panel de Administración";
        if (formulario) formulario.style.display = 'flex';
        
        cargarProductos(true); // Carga los productos con botones de eliminar
    } else {
        alert("Credenciales incorrectas");
    }
}

// Cargar productos en la grilla dinámica desde MongoDB Atlas
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
                ${esVendedor ? `<br><button class="btn-eliminar" onclick="eliminarProducto('${p._id}')">Eliminar</button>` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error("Error al renderizar los productos:", error);
    }
}

// Eliminar Producto usando el _id único de MongoDB
async function eliminarProducto(id) {
    if (confirm("¿Estás seguro de eliminar este producto?")) {
        await fetch(`/productos/${id}`, { method: 'DELETE' });
        alert("Producto eliminado");
        
        // Verificamos en qué modo estamos para recargar correctamente
        const formulario = document.getElementById('admin-form-container');
        const esVendedor = formulario && formulario.style.display === 'flex';
        cargarProductos(esVendedor);
    }
}

// Subir nuevo producto a Cloudinary y MongoDB Atlas
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
    
    // Limpiamos los campos del formulario anterior
    document.getElementById('nombre').value = '';
    document.getElementById('precio').value = '';
    document.getElementById('fileInput').value = '';
    
    // Regresamos fluidamente a la vista de comprador
    mostrarVista('comprador');
}

function agregarAlCarrito(precio) {
    carritoTotal += Number(precio);
    document.getElementById('total-display').innerText = `S/ ${carritoTotal.toFixed(2)}`;
}

// Inicializar la carga por primera vez
document.addEventListener('DOMContentLoaded', () => mostrarVista('comprador'));