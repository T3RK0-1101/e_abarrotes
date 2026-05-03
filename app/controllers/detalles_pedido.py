# app/controllers/detalles_pedido.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import SessionLocal
from app.models import models, schemas

router = APIRouter(prefix="/detalles", tags=["detalles_pedido"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Crear detalle de pedido
@router.post("/", response_model=schemas.DetallePedido)
def crear_detalle(detalle: schemas.DetallePedidoCreate, db: Session = Depends(get_db)):
    pedido = db.query(models.Pedido).filter(models.Pedido.id == detalle.pedido_id).first()
    producto = db.query(models.Producto).filter(models.Producto.id == detalle.producto_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # Verificar stock suficiente
    if producto.stock < detalle.cantidad:
        raise HTTPException(
            status_code=400,
            detail=f"Stock insuficiente para '{producto.nombre}'. Disponible: {producto.stock}"
        )

    nuevo = models.DetallePedido(
        pedido_id=detalle.pedido_id,
        producto_id=detalle.producto_id,
        cantidad=detalle.cantidad,
        subtotal=detalle.subtotal
    )
    db.add(nuevo)

    # Descontar stock
    producto.stock -= detalle.cantidad

    db.commit()
    db.refresh(nuevo)
    return nuevo

# Listar todos los detalles
@router.get("/", response_model=List[schemas.DetallePedido])
def listar_detalles(db: Session = Depends(get_db)):
    return db.query(models.DetallePedido).all()

# Obtener detalle por ID
@router.get("/{detalle_id}", response_model=schemas.DetallePedido)
def obtener_detalle(detalle_id: int, db: Session = Depends(get_db)):
    detalle = db.query(models.DetallePedido).filter(models.DetallePedido.id == detalle_id).first()
    if not detalle:
        raise HTTPException(status_code=404, detail="Detalle no encontrado")
    return detalle

# Eliminar detalle
@router.delete("/{detalle_id}")
def eliminar_detalle(detalle_id: int, db: Session = Depends(get_db)):
    detalle = db.query(models.DetallePedido).filter(models.DetallePedido.id == detalle_id).first()
    if not detalle:
        raise HTTPException(status_code=404, detail="Detalle no encontrado")
    db.delete(detalle)
    db.commit()
    return {"mensaje": "Detalle eliminado correctamente"}

# Actualizar detalle (PUT)
@router.put("/{detalle_id}", response_model=schemas.DetallePedido)
def actualizar_detalle(detalle_id: int, detalle: schemas.DetallePedidoCreate, db: Session = Depends(get_db)):
    existente = db.query(models.DetallePedido).filter(models.DetallePedido.id == detalle_id).first()
    if not existente:
        raise HTTPException(status_code=404, detail="Detalle no encontrado")

    producto = db.query(models.Producto).filter(models.Producto.id == detalle.producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # Actualizar cantidad y subtotal (por ahora lo recibes del frontend)
    existente.cantidad = detalle.cantidad
    existente.subtotal = detalle.subtotal

    db.commit()
    db.refresh(existente)
    return existente
