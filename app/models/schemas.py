# app/models/schemas.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# -------------------
# Direcciones
# -------------------
class DireccionBase(BaseModel):
    usuario_id: int
    calle: str
    colonia: Optional[str] = None   # <-- ahora opcional
    ciudad: str
    estado: str
    codigo_postal: str
    referencia: Optional[str] = None

class DireccionCreate(DireccionBase):
    pass

class Direccion(DireccionBase):
    id: int

    class Config:
        orm_mode = True

# -------------------
# Usuarios
# -------------------
class UsuarioBase(BaseModel):
    nombre: str
    email: str
    rol: str = "cliente"   # <-- agregado

class UsuarioCreate(UsuarioBase):
    contraseña: str

class Usuario(UsuarioBase):
    id: int
    direcciones: List[Direccion] = []

    class Config:
        orm_mode = True

# -------------------
# Categorías
# -------------------
class CategoriaBase(BaseModel):
    nombre: str

class CategoriaCreate(CategoriaBase):
    pass

class Categoria(CategoriaBase):
    id: int

    class Config:
        orm_mode = True

# -------------------
# Productos
# -------------------
class ProductoBase(BaseModel):
    nombre: str
    precio: float
    stock: int

class ProductoCreate(ProductoBase):
    categoria_id: int

class Producto(ProductoBase):
    id: int
    categoria: Optional[Categoria]

    class Config:
        orm_mode = True

# -------------------
# Detalles de Pedido
# -------------------
class DetallePedidoBase(BaseModel):
    cantidad: int
    subtotal: float

class DetallePedidoCreate(DetallePedidoBase):
    pedido_id: int
    producto_id: int

class DetallePedido(DetallePedidoBase):
    id: int
    producto: Producto

    class Config:
        orm_mode = True

# -------------------
# Pedidos
# -------------------
class PedidoBase(BaseModel):
    fecha: Optional[datetime] = None   # <-- opcional
    total: Optional[float] = None      # <-- opcional
    estado: Optional[str] = "pendiente"  # <-- agregado

class PedidoCreate(BaseModel):
    usuario_id: int
    direccion_id: int
    total: Optional[float] = None
    fecha: Optional[datetime] = None
    estado: Optional[str] = "pendiente"  # <-- agregado

class Pedido(PedidoBase):
    id: int
    usuario: Usuario
    detalles: List[DetallePedido] = []

    class Config:
        orm_mode = True
