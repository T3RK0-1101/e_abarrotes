# app/controllers/direcciones.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import SessionLocal
from app.models import models, schemas

router = APIRouter(prefix="/direcciones", tags=["direcciones"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Crear dirección
@router.post("/", response_model=schemas.Direccion)
def crear_direccion(direccion: schemas.DireccionCreate, db: Session = Depends(get_db)):
    nueva = models.Direccion(**direccion.dict())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva

# Listar todas las direcciones
@router.get("/", response_model=List[schemas.Direccion])
def listar_direcciones(db: Session = Depends(get_db)):
    return db.query(models.Direccion).all()

# Obtener una dirección por ID
@router.get("/{direccion_id}", response_model=schemas.Direccion)
def obtener_direccion(direccion_id: int, db: Session = Depends(get_db)):
    direccion = db.query(models.Direccion).filter(models.Direccion.id == direccion_id).first()
    if not direccion:
        raise HTTPException(status_code=404, detail="Dirección no encontrada")
    return direccion

# Eliminar una dirección
@router.delete("/{direccion_id}")
def eliminar_direccion(direccion_id: int, db: Session = Depends(get_db)):
    direccion = db.query(models.Direccion).filter(models.Direccion.id == direccion_id).first()
    if not direccion:
        raise HTTPException(status_code=404, detail="Dirección no encontrada")
    db.delete(direccion)
    db.commit()
    return {"mensaje": "Dirección eliminada correctamente"}

@router.put("/{direccion_id}", response_model=schemas.Direccion)
def actualizar_direccion(direccion_id: int, direccion: schemas.DireccionCreate, db: Session = Depends(get_db)):
    existente = db.query(models.Direccion).filter(models.Direccion.id == direccion_id).first()
    if not existente:
        raise HTTPException(status_code=404, detail="Dirección no encontrada")

    for key, value in direccion.dict().items():
        setattr(existente, key, value)

    db.commit()
    db.refresh(existente)
    return existente
