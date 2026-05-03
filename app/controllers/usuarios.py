# app/controllers/usuarios.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models import models, schemas

router = APIRouter(prefix="/usuarios", tags=["usuarios"])

# Dependencia para obtener la sesión de BD
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Crear usuario
@router.post("/", response_model=schemas.Usuario)
def crear_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    # Verificar si ya existe el email
    existente = db.query(models.Usuario).filter(models.Usuario.email == usuario.email).first()
    if existente:
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    nuevo = models.Usuario(
        nombre=usuario.nombre,
        email=usuario.email,
        contraseña=usuario.contraseña,
        rol=usuario.rol  # <-- ahora también se guarda el rol
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

# Listar usuarios
@router.get("/", response_model=list[schemas.Usuario])
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(models.Usuario).all()

# Obtener usuario por ID
@router.get("/{usuario_id}", response_model=schemas.Usuario)
def obtener_usuario(usuario_id: int, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario

# Eliminar usuario
@router.delete("/{usuario_id}")
def eliminar_usuario(usuario_id: int, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.delete(usuario)
    db.commit()
    return {"mensaje": "Usuario eliminado correctamente"}

# Actualizar usuario
@router.put("/{usuario_id}", response_model=schemas.Usuario)
def actualizar_usuario(usuario_id: int, usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    existente = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not existente:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    existente.nombre = usuario.nombre
    existente.email = usuario.email
    existente.contraseña = usuario.contraseña
    existente.rol = usuario.rol  # <-- ahora también se actualiza el rol

    db.commit()
    db.refresh(existente)
    return existente

# Login básico
@router.post("/login")
def login(email: str, contraseña: str, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if not usuario or usuario.contraseña != contraseña:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    return {
        "mensaje": "Login exitoso",
        "usuario_id": usuario.id,
        "rol": usuario.rol
    }
