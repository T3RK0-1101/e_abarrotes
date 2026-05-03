# app/controllers/productos.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models import models, schemas

router = APIRouter(prefix="/productos", tags=["productos"])

# Dependencia para obtener la sesión de BD
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Crear producto
@router.post("/", response_model=schemas.Producto)
def crear_producto(producto: schemas.ProductoCreate, db: Session = Depends(get_db)):
    categoria = db.query(models.Categoria).filter(models.Categoria.id == producto.categoria_id).first()
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    nuevo = models.Producto(
        nombre=producto.nombre,
        precio=producto.precio,
        stock=producto.stock,
        categoria_id=producto.categoria_id
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

# Listar productos
@router.get("/", response_model=list[schemas.Producto])
def listar_productos(db: Session = Depends(get_db)):
    return db.query(models.Producto).all()

# Obtener producto por ID
@router.get("/{producto_id}", response_model=schemas.Producto)
def obtener_producto(producto_id: int, db: Session = Depends(get_db)):
    producto = db.query(models.Producto).filter(models.Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto

# Eliminar producto
@router.delete("/{producto_id}")
def eliminar_producto(producto_id: int, db: Session = Depends(get_db)):
    producto = db.query(models.Producto).filter(models.Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    db.delete(producto)
    db.commit()
    return {"mensaje": "Producto eliminado correctamente"}

@router.put("/{producto_id}", response_model=schemas.Producto)
def actualizar_producto(producto_id: int, producto: schemas.ProductoCreate, db: Session = Depends(get_db)):
    existente = db.query(models.Producto).filter(models.Producto.id == producto_id).first()
    if not existente:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    if producto.precio < 0:
        raise HTTPException(status_code=400, detail="El precio no puede ser negativo")
    if producto.stock < 0:
        raise HTTPException(status_code=400, detail="El stock no puede ser negativo")

    existente.nombre = producto.nombre
    existente.precio = producto.precio
    existente.stock = producto.stock
    existente.categoria_id = producto.categoria_id

    db.commit()
    db.refresh(existente)
    return existente
