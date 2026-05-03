# app/main.py
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.db.database import engine
from app.models import models
from app.controllers import direcciones
from app.controllers import usuarios, productos, categorias, pedidos, detalles_pedido
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

# Crear tablas en la BD
models.Base.metadata.create_all(bind=engine)

# Crear carpeta de imágenes si no existe
os.makedirs("app/static/imagenes", exist_ok=True)

# Servir archivos estáticos
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Incluir rutas
app.include_router(usuarios.router)
app.include_router(productos.router)
app.include_router(categorias.router)
app.include_router(pedidos.router)
app.include_router(detalles_pedido.router)
app.include_router(direcciones.router)

@app.get("/")
def inicio():
    return {"mensaje": "Bienvenido a la API de abarrotes"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)