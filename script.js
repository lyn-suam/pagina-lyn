let carritoTotal = 0;

function mostrarVista(vista) {
    const app = document.getElementById('app');
    if (!app) return;

    if (vista === 'vendedor') {
        document.getElementById('login-modal').style.display = 'flex';
    } else {
        app.innerHTML = `
            <h1 style="text-align: center; margin-top: 20px;">Catálogo de Productos</h1>
            <div id="productos-grid" class="grid"></div>
        `;
        cerrarModal();
        cargarProductos(false);
    }
}

function cerrarModal() {
    const modal = document.getElementById('login-modal');
    if (modal) modal.style.display = 'none';
}

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
            <div class="form-container" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 400px; margin: 20px auto;">
                <h2>Nuevo Producto</h2>
                <input id="nombre" placeholder="Nombre" style="width:90%; padding:8px; margin-bottom:10px;"><br>
                <input id="precio" type="number" placeholder="Precio" style="width:90%; padding:8px; margin-bottom:10px;"><br>
                <input type="file" id="fileInput" style="margin-bottom:15px;"><br>
                <button class="btn-guardar" type="button" onclick="subirProducto(event)" style="padding:10px 20px; cursor:pointer;">Guardar Producto</button>
            </div>
            <h2 style="text-align:center; margin-top:30px;">Tus Productos (Modo Administrador)</h2>
            <div id="productos-grid" class="grid"></div>
        `;        
        cargarProductos(true);
    } else {
        alert("Credenciales incorrectas");
    }
}

async function cargarProductos(esVendedor = false) {
    try {
        const res = await fetch('/productos');
        const productos = await res.json();
        const grid = document.getElementById('productos-grid');
        
        if (!grid) return;
        
        if (productos.length === 0) {
            grid.innerHTML = `<p style="text-align:center; grid-column: 1/-1; color: gray; margin-top: 20px;">No hay productos registrados.</p>`;
            return;
        }

        grid.innerHTML = productos.map(p => `
            <div class="producto-card">
                <img src="${p.imagen}" style="width:150px; height:150px; border-radius:10px; object-fit: cover;">
                <h3>${p.nombre}</h3>
                <p class="price">S/ ${Number(p.precio).toFixed(2)}</p>
                <button onclick="agregarAlCarrito(${p.precio})">Agregar al Carrito</button>
                ${esVendedor ? `<br><button class="btn-eliminar" style="margin-top:5px; background:#ff4d4d; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;" onclick="eliminarProducto('${p._id}')">Eliminar</button>` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error("Error al renderizar los productos:", error);
    }
}

async function eliminarProducto(id) {
    if (confirm("¿Estás seguro de eliminar este producto?")) {
        await fetch(`/productos/${id}`, { method: 'DELETE' });
        alert("Producto eliminado");
        cargarProductos(true); 
    }
}

async function subirProducto(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    const nombre = document.getElementById('nombre').value.trim();
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

    try {
        console.log("⏳ Guardando imagen localmente y registrando en la base de datos...");
        const respuesta = await fetch('/productos', { method: 'POST', body: formData });
        
        if (respuesta.ok) {
            alert("¡Producto guardado exitosamente!");
            
            setTimeout(() => {
                mostrarVista('comprador');
            }, 400);
        } else {
            const errorTxt = await respuesta.text();
            alert("Hubo un problema en el servidor: " + errorTxt);
        }
    } catch (error) {
        console.error("Error al subir el producto:", error);
        alert("Error de red al conectar con el servidor.");
    }
}

function agregarAlCarrito(precio) {
    carritoTotal += Number(precio);
    document.getElementById('total-display').innerText = `S/ ${carritoTotal.toFixed(2)}`;
}

document.addEventListener('DOMContentLoaded', () => mostrarVista('comprador'));


// Forzando actualizacion de Git - Intento 1