from fastapi import FastAPI, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import json
from typing import Optional

app = FastAPI()

# Montar archivos estáticos (CSS, JS, imágenes)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Cargar productos desde JSON
def cargar_productos():
    with open("data/productos.json", "r", encoding="utf-8") as f:
        return json.load(f)

@app.get("/", response_class=HTMLResponse)
async def root():
    with open("templates/index.html", "r", encoding="utf-8") as f:
        return f.read()

@app.get("/api/categorias")
async def get_categorias():
    """Obtiene todas las categorías con contadores"""
    productos = cargar_productos()
    categorias = {}
    
    for producto in productos:
        cat = producto.get("categoria", "Sin categoría")
        if cat not in categorias:
            categorias[cat] = 0
        categorias[cat] += 1
    
    # Retornar como lista ordenada
    return [{"nombre": cat, "cantidad": count} for cat, count in sorted(categorias.items())]

@app.get("/api/productos")
async def get_productos(
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(24, ge=1, le=100),
    categoria: Optional[str] = Query(None),
    ordenar_por: Optional[str] = Query(None),  # "precio_asc", "precio_desc", "reciente"
    buscar: Optional[str] = Query(None)
):
    """
    Obtiene productos con paginación, filtros y búsqueda
    
    - pagina: número de página (por defecto 1)
    - por_pagina: productos por página (por defecto 24)
    - categoria: filtrar por categoría específica
    - ordenar_por: precio_asc, precio_desc, reciente, disponibilidad
    - buscar: búsqueda por nombre o descripción
    """
    productos = cargar_productos()
    
    # Filtrar por categoría
    if categoria and categoria != "Todos":
        productos = [p for p in productos if p.get("categoria") == categoria]
    
    # Búsqueda por texto
    if buscar:
        buscar_lower = buscar.lower()
        productos = [p for p in productos if buscar_lower in p.get("nombre", "").lower() or 
                     buscar_lower in p.get("descripcion", "").lower()]
    
    # Ordenamiento
    if ordenar_por == "precio_asc":
        productos.sort(key=lambda x: x.get("precio", 0))
    elif ordenar_por == "precio_desc":
        productos.sort(key=lambda x: x.get("precio", 0), reverse=True)
    elif ordenar_por == "disponibilidad":
        productos.sort(key=lambda x: x.get("stock", 0), reverse=True)
    elif ordenar_por == "reciente":
        # Simulamos reciente usando el ID (últimos primero)
        productos.sort(key=lambda x: x.get("id", 0), reverse=True)
    
    # Paginación
    total = len(productos)
    inicio = (pagina - 1) * por_pagina
    fin = inicio + por_pagina
    productos_pagina = productos[inicio:fin]
    
    total_paginas = (total + por_pagina - 1) // por_pagina
    
    return {
        "productos": productos_pagina,
        "pagina": pagina,
        "por_pagina": por_pagina,
        "total": total,
        "total_paginas": total_paginas
    }

@app.get("/api/productos/{producto_id}")
async def get_producto(producto_id: int):
    """Obtiene un producto específico por ID"""
    productos = cargar_productos()
    for producto in productos:
        if producto["id"] == producto_id:
            return producto
    return {"error": "Producto no encontrado"}

