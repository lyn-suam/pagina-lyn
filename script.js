let carritoTotal = 0;

// Abrir el modal en lugar del prompt
function mostrarVista(vista) {
    if (vista === 'vendedor') {
        document.getElementById('login-modal').style.display = 'flex';
    } else {
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
        
        // BUSCAMOS EL CONTENEDOR PRINCIPAL DE TU HTML
        // Intentará buscar un <main>, si no existe buscará una sección, o el body.
        const contenedorPrincipal = document.querySelector('main') || document.querySelector('.container') || document.body;
        
        if (contenedorPrincipal) {
            // Reemplazamos el contenido de forma segura e inyectamos el formulario y el grid abajo
            contenedorPrincipal.innerHTML = `
                <div class="form-container" style="margin: 20px auto; text-align: center; max-width: 400px; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background: #fff;">
                    <h1>Nuevo Producto</h1>
                    <input id="nombre" placeholder="Nombre" style="margin: 5px; padding: 8px; width: 80%;"><br>
                    <input id="precio" type="number" placeholder="Precio" style="margin: 5px; padding: 8px; width: 80%;"><br>
                    <input type="file" id="fileInput" style="margin: 5px; padding: 8px; width: 80%;"><br>
                    <button onclick="subirProducto()" style="padding: 10px 20px; background-color: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 10px;">Guardar Producto</button>
                </div>
                <div id="productos-grid" class="grid"></div>
            `;
        }
        
        // Esperamos un instante a que se dibuje el nuevo grid y cargamos los productos como vendedor
        setTimeout(() => cargarProductos(true), 150);
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
        
        // Si por alguna razón el grid no existe en este milisegundo, detenemos la función sin romper nada
        if (!grid) return;
        
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

// Función para llamar al servidor y borrar usando el _id de MongoDB
async function eliminarProducto(id) {
    if (confirm("¿Estás seguro de eliminar este producto?")) {
        await fetch(`/productos/${id}`, { method: 'DELETE' });
        alert("Producto eliminado");
        
        // Validamos si el formulario sigue en pantalla para saber si recargar en modo vendedor
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
    
    // Recarga la página completa para volver al modo comprador limpio con el catálogo actualizado
    window.location.reload();
}

function agregarAlCarrito(precio) {
    carritoTotal += precio;
    document.getElementById('total-display').innerText = `S/ ${carritoTotal.toFixed(2)}`;
}

document.addEventListener('DOMContentLoaded', () => mostrarVista('comprador'));