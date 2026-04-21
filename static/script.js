// Variables globales
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
let pagina_actual = 1;
const PRODUCTOS_POR_PAGINA = 24;
let categoria_actual = "Todos";
let total_paginas = 1;

// Al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    cargarCategorias();
    cargarProductos();
    actualizarCarrito();
});

// ============ CATEGORÍAS ============

async function cargarCategorias() {
    try {
        const response = await fetch('/api/categorias');
        const categorias = await response.json();
        
        const categoriasListDiv = document.getElementById('categorias-list');
        
        // Limpiar y reconstruir
        categoriasListDiv.innerHTML = `
            <button class="categoria-btn activa" onclick="filtrarCategoria('Todos')">
                Todos (2000)
            </button>
        `;
        
        categorias.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'categoria-btn';
            btn.textContent = `${cat.nombre} (${cat.cantidad})`;
            btn.onclick = () => filtrarCategoria(cat.nombre);
            categoriasListDiv.appendChild(btn);
        });
    } catch (error) {
        console.error('Error cargando categorías:', error);
    }
}

function filtrarCategoria(categoria) {
    categoria_actual = categoria;
    pagina_actual = 1;
    
    // Actualizar botones activos
    document.querySelectorAll('.categoria-btn').forEach(btn => {
        btn.classList.remove('activa');
        if (btn.textContent.startsWith(categoria)) {
            btn.classList.add('activa');
        }
    });
    
    cargarProductos();
}

// ============ PRODUCTOS ============

async function cargarProductos() {
    try {
        const ordenar = document.getElementById('ordenar-por').value || '';
        const buscar = document.getElementById('input-buscar').value || '';
        
        const params = new URLSearchParams({
            pagina: pagina_actual,
            por_pagina: PRODUCTOS_POR_PAGINA,
            ...(categoria_actual !== "Todos" && { categoria: categoria_actual }),
            ...(ordenar && { ordenar_por: ordenar }),
            ...(buscar && { buscar: buscar })
        });
        
        const response = await fetch(`/api/productos?${params}`);
        const data = await response.json();
        
        mostrarProductos(data.productos);
        total_paginas = data.total_paginas;
        
        // Actualizar info de resultados
        const inicio = (pagina_actual - 1) * PRODUCTOS_POR_PAGINA + 1;
        const fin = Math.min(pagina_actual * PRODUCTOS_POR_PAGINA, data.total);
        document.getElementById('resultados-texto').textContent = 
            `Mostrando ${inicio}-${fin} de ${data.total} productos`;
        
        generarPaginacion();
    } catch (error) {
        console.error('Error cargando productos:', error);
    }
}

function mostrarProductos(productos) {
    const grid = document.getElementById('productos-grid');
    grid.innerHTML = '';
    
    if (productos.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No hay productos disponibles</p>';
        return;
    }
    
    productos.forEach(producto => {
        const card = document.createElement('div');
        card.className = 'producto-card';
        
        const icono = getIconoProducto(producto.categoria);
        const actualizacion = new Date().toLocaleDateString('es-ES');
        
        card.innerHTML = `
            <div class="producto-imagen">
                ${icono}
                <span class="producto-badge">${producto.categoria}</span>
            </div>
            <div class="producto-info">
                <div class="producto-categoria">${producto.categoria}</div>
                <h3 class="producto-nombre">${producto.nombre}</h3>
                <p class="producto-descripcion">${producto.descripcion}</p>
                <div class="producto-actualizacion">📅 ${actualizacion}</div>
                <div class="producto-precio">$${producto.precio.toFixed(2)}</div>
                <div class="producto-stock">
                    📦 Stock: <strong>${producto.stock}</strong>
                </div>
                <button class="btn-agregar" onclick="agregarAlCarrito(${producto.id}, '${producto.nombre.replace(/'/g, "\\'")}', ${producto.precio})">
                    + Añadir al Carrito
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function getIconoProducto(categoria) {
    const iconos = {
        'Almacenamiento': '💾',
        'Periféricos de Entrada': '⌨️',
        'Periféricos de Salida': '🖥️',
        'Antivirus': '🔒',
        'Office': '📄',
        'Procesadores': '⚙️',
        'RAM': '🧠',
        'GPUs': '🎮',
        'Placas Base': '🔧',
        'Fuentes': '🔌',
        'Gabinetes': '📦',
        'Refrigeración': '❄️',
        'Redes': '🌐',
        'Cables': '🔗',
        'Audio': '🎧',
        'Laptops': '💻',
        'Monitores': '🖲️',
        'Impresoras': '🖨️',
        'Cámaras Web': '📹',
        'Energía': '⚡'
    };
    return iconos[categoria] || '📦';
}

// ============ PAGINACIÓN ============

function generarPaginacion() {
    const container = document.getElementById('numeros-paginas');
    container.innerHTML = '';
    
    // Determinar rango de páginas a mostrar (máximo 10)
    let inicio = Math.max(1, pagina_actual - 5);
    let fin = Math.min(total_paginas, pagina_actual + 4);
    
    // Ajustar si estamos cerca del inicio o fin
    if (fin - inicio < 9) {
        if (inicio === 1) fin = Math.min(10, total_paginas);
        else inicio = Math.max(1, fin - 9);
    }
    
    // Botón primera página
    if (inicio > 1) {
        const btn = crearBotonPagina(1, '1');
        container.appendChild(btn);
        if (inicio > 2) {
            const puntos = document.createElement('span');
            puntos.style.color = 'var(--text-secondary)';
            puntos.textContent = '...';
            container.appendChild(puntos);
        }
    }
    
    // Números de página
    for (let i = inicio; i <= fin; i++) {
        const btn = crearBotonPagina(i, String(i));
        container.appendChild(btn);
    }
    
    // Botón última página
    if (fin < total_paginas) {
        if (fin < total_paginas - 1) {
            const puntos = document.createElement('span');
            puntos.style.color = 'var(--text-secondary)';
            puntos.textContent = '...';
            container.appendChild(puntos);
        }
        const btn = crearBotonPagina(total_paginas, String(total_paginas));
        container.appendChild(btn);
    }
    
    // Actualizar estado de botones anterior/siguiente
    document.getElementById('btn-anterior').disabled = pagina_actual === 1;
    document.getElementById('btn-siguiente').disabled = pagina_actual === total_paginas;
}

function crearBotonPagina(numero, texto) {
    const btn = document.createElement('button');
    btn.className = 'numero-pagina';
    btn.textContent = texto;
    
    if (numero === pagina_actual) {
        btn.classList.add('activo');
    }
    
    btn.onclick = () => irPagina(numero);
    return btn;
}

function irPagina(numero) {
    if (numero >= 1 && numero <= total_paginas) {
        pagina_actual = numero;
        cargarProductos();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ============ FILTROS ============

function aplicarFiltros() {
    pagina_actual = 1;
    cargarProductos();
}

function buscarProductos() {
    pagina_actual = 1;
    cargarProductos();
}

// Búsqueda al presionar Enter
document.addEventListener('DOMContentLoaded', () => {
    const inputBuscar = document.getElementById('input-buscar');
    if (inputBuscar) {
        inputBuscar.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                buscarProductos();
            }
        });
    }
});

// ============ CARRITO ============

function agregarAlCarrito(id, nombre, precio) {
    const itemExistente = carrito.find(item => item.id === id);
    
    if (itemExistente) {
        itemExistente.cantidad++;
    } else {
        carrito.push({ id, nombre, precio, cantidad: 1 });
    }
    
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarCarrito();
    
    // Efecto visual
    mostrarNotificacion(`${nombre} añadido al carrito`);
}

function eliminarDelCarrito(id) {
    carrito = carrito.filter(item => item.id !== id);
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarCarrito();
}

function actualizarCarrito() {
    const count = document.getElementById('carrito-count');
    const items = document.getElementById('carrito-items');
    const total = document.getElementById('total-precio');
    
    // Total de items
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    count.textContent = totalItems;
    
    // Limpiar items
    items.innerHTML = '';
    
    if (carrito.length === 0) {
        items.innerHTML = '<div class="carrito-vacio">Carrito vacío</div>';
        total.textContent = '0.00';
        return;
    }
    
    // Mostrar items
    carrito.forEach(item => {
        const div = document.createElement('div');
        div.className = 'carrito-item';
        div.innerHTML = `
            <div class="carrito-item-nombre">${item.nombre}</div>
            <div class="carrito-item-detalles">
                <span class="carrito-item-cantidad">x${item.cantidad}</span>
                <span>$${(item.precio * item.cantidad).toFixed(2)}</span>
                <button class="carrito-item-quitar" onclick="eliminarDelCarrito(${item.id})">✕</button>
            </div>
        `;
        items.appendChild(div);
    });
    
    // Total
    const totalPrecio = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    total.textContent = totalPrecio.toFixed(2);
}

function toggleCarrito() {
    const sidebar = document.getElementById('carrito-sidebar');
    sidebar.style.display = sidebar.style.display === 'none' ? 'block' : 'none';
}

function realizarCompra() {
    if (carrito.length === 0) {
        mostrarNotificacion('Tu carrito está vacío');
        return;
    }
    
    const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    mostrarNotificacion(`¡Compra realizada por $${total.toFixed(2)}! 🎉`);
    
    carrito = [];
    localStorage.removeItem('carrito');
    actualizarCarrito();
}

function mostrarNotificacion(mensaje) {
    // Simple alert por ahora, puedes mejorar esto con un toast
    alert(mensaje);
}

