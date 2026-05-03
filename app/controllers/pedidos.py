# app/controllers/pedidos.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from app.db.database import SessionLocal
from app.models import models, schemas

router = APIRouter(prefix="/pedidos", tags=["pedidos"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Crear pedido
@router.post("/", response_model=schemas.Pedido)
def crear_pedido(pedido: schemas.PedidoCreate, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.id == pedido.usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    nueva_fecha = pedido.fecha if pedido.fecha else datetime.now()

    nuevo = models.Pedido(
        usuario_id=pedido.usuario_id,
        direccion_id=pedido.direccion_id,
        fecha=nueva_fecha,
        total=pedido.total,
        estado=pedido.estado  # <-- ahora también se guarda el estado
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    nuevo.usuario = usuario
    nuevo.detalles = []
    return nuevo

# Listar todos los pedidos
@router.get("/", response_model=List[schemas.Pedido])
def listar_pedidos(db: Session = Depends(get_db)):
    return db.query(models.Pedido).all()

# Obtener un pedido por ID
@router.get("/{pedido_id}", response_model=schemas.Pedido)
def obtener_pedido(pedido_id: int, db: Session = Depends(get_db)):
    pedido = db.query(models.Pedido).filter(models.Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return pedido

# Eliminar un pedido
@router.delete("/{pedido_id}")
def eliminar_pedido(pedido_id: int, db: Session = Depends(get_db)):
    pedido = db.query(models.Pedido).filter(models.Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    db.delete(pedido)
    db.commit()
    return {"mensaje": "Pedido eliminado correctamente"}

# Actualizar pedido completo
@router.put("/{pedido_id}", response_model=schemas.Pedido)
def actualizar_pedido(pedido_id: int, pedido: schemas.PedidoCreate, db: Session = Depends(get_db)):
    existente = db.query(models.Pedido).filter(models.Pedido.id == pedido_id).first()
    if not existente:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    existente.usuario_id = pedido.usuario_id
    existente.direccion_id = pedido.direccion_id
    existente.total = pedido.total
    existente.fecha = pedido.fecha if pedido.fecha else existente.fecha
    existente.estado = pedido.estado  # <-- ahora también se actualiza el estado

    db.commit()
    db.refresh(existente)
    return existente

# Actualizar solo el estado del pedido
@router.patch("/{pedido_id}/estado")
def actualizar_estado_pedido(pedido_id: int, estado: str, db: Session = Depends(get_db)):
    pedido = db.query(models.Pedido).filter(models.Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    # Si se cancela, restablecer stock de cada producto
    if estado == "cancelado" and pedido.estado != "cancelado":
        for detalle in pedido.detalles:
            producto = db.query(models.Producto).filter(models.Producto.id == detalle.producto_id).first()
            if producto:
                producto.stock += detalle.cantidad

    pedido.estado = estado
    db.commit()
    db.refresh(pedido)
    return {"mensaje": "Estado actualizado", "pedido_id": pedido.id, "estado": pedido.estado}

# Recalcular total del pedido
@router.patch("/{pedido_id}/recalcular_total", response_model=float)
def recalcular_total(pedido_id: int, db: Session = Depends(get_db)):
    pedido = db.query(models.Pedido).filter(models.Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    total = sum(detalle.subtotal for detalle in pedido.detalles)
    pedido.total = total
    db.commit()
    db.refresh(pedido)
    return total


