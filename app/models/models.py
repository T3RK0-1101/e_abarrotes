# app/models/models.py
from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum

class RolEnum(str, enum.Enum):
    cliente = "cliente"
    admin = "admin"

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    contraseña = Column(String(100), nullable=False)

    direcciones = relationship("Direccion", back_populates="usuario")
    pedidos = relationship("Pedido", back_populates="usuario")
    rol = Column(Enum(RolEnum), default=RolEnum.cliente, nullable=False)


class Direccion(Base):
    __tablename__ = "direcciones"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    calle = Column(String(150), nullable=False)
    colonia = Column(String(100), nullable=True)
    ciudad = Column(String(100), nullable=False)
    estado = Column(String(100), nullable=False)
    codigo_postal = Column(String(10), nullable=False)
    referencia = Column(Text, nullable=True)

    usuario = relationship("Usuario", back_populates="direcciones")

class Categoria(Base):
    __tablename__ = "categorias"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)

    productos = relationship("Producto", back_populates="categoria")

class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    precio = Column(Float, nullable=False)
    stock = Column(Integer, nullable=False)
    categoria_id = Column(Integer, ForeignKey("categorias.id"))

    categoria = relationship("Categoria", back_populates="productos")
    detalles = relationship("DetallePedido", back_populates="producto")

class Pedido(Base):
    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    direccion_id = Column(Integer, ForeignKey("direcciones.id"), nullable=False)
    fecha = Column(DateTime, nullable=True)   # <-- ahora opcional, coincide con la BD
    total = Column(Float, nullable=True)      # <-- ahora opcional, coincide con la BD
    estado = Column(String(50), nullable=True, default="pendiente")

    usuario = relationship("Usuario", back_populates="pedidos")
    direccion = relationship("Direccion")
    detalles = relationship("DetallePedido", back_populates="pedido")

class DetallePedido(Base):
    __tablename__ = "detalles_pedido"

    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id"))
    producto_id = Column(Integer, ForeignKey("productos.id"))
    cantidad = Column(Integer, nullable=False)
    subtotal = Column(Float, nullable=False)

    pedido = relationship("Pedido", back_populates="detalles")
    producto = relationship("Producto", back_populates="detalles")
