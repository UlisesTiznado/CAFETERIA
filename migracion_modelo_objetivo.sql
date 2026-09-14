-- ============================================================
-- CAFETERÍA ORIGEN
-- Migración incremental hacia el modelo entidad-relación nuevo.
-- IMPORTANTE:
-- 1) NO elimina categorias/productos/ventas/detalle_ventas actuales.
-- 2) Crea las tablas nuevas que aún faltan.
-- 3) Ejecuta primero un respaldo de tu base de datos.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS rol (
  id_rol SERIAL PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS empleado (
  id_empleado SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  telefono VARCHAR(30),
  turno VARCHAR(40),
  estado VARCHAR(30) NOT NULL DEFAULT 'Activo',
  id_rol INTEGER REFERENCES rol(id_rol)
);

CREATE TABLE IF NOT EXISTS corte_caja (
  id_corte SERIAL PRIMARY KEY,
  id_empleado INTEGER REFERENCES empleado(id_empleado),
  fecha_apertura TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_cierre TIMESTAMP,
  fondo_inicial NUMERIC(10,2) NOT NULL DEFAULT 0,
  efectivo_esperado NUMERIC(10,2) DEFAULT 0,
  reserva_siguiente_turno NUMERIC(10,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS factura (
  id_factura SERIAL PRIMARY KEY,
  id_venta INTEGER UNIQUE REFERENCES ventas(id_venta) ON DELETE CASCADE,
  cliente VARCHAR(150),
  rfc VARCHAR(20),
  fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total NUMERIC(10,2) NOT NULL,
  estado VARCHAR(30) NOT NULL DEFAULT 'Emitida'
);

CREATE TABLE IF NOT EXISTS proveedor (
  id_proveedor SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  contacto VARCHAR(120),
  telefono VARCHAR(30),
  estado VARCHAR(30) NOT NULL DEFAULT 'Activo'
);

CREATE TABLE IF NOT EXISTS categoria_insumo (
  id_cat_insumo SERIAL PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS insumo (
  id_insumo SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  stock NUMERIC(12,3) NOT NULL DEFAULT 0,
  unidad VARCHAR(30) NOT NULL,
  min_stock NUMERIC(12,3) NOT NULL DEFAULT 0,
  id_cat_insumo INTEGER REFERENCES categoria_insumo(id_cat_insumo)
);

CREATE TABLE IF NOT EXISTS proveedor_insumo (
  id_proveedor INTEGER REFERENCES proveedor(id_proveedor) ON DELETE CASCADE,
  id_insumo INTEGER REFERENCES insumo(id_insumo) ON DELETE CASCADE,
  precio_compra NUMERIC(10,2) NOT NULL,
  PRIMARY KEY (id_proveedor, id_insumo)
);

CREATE TABLE IF NOT EXISTS tamano (
  id_tamano SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  modificador_precio NUMERIC(10,2) NOT NULL DEFAULT 0,
  id_insumo_vaso INTEGER REFERENCES insumo(id_insumo)
);

CREATE TABLE IF NOT EXISTS sabor (
  id_sabor SERIAL PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE,
  modificador_precio NUMERIC(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS producto_sabor (
  id_producto INTEGER REFERENCES productos(id_producto) ON DELETE CASCADE,
  id_sabor INTEGER REFERENCES sabor(id_sabor) ON DELETE CASCADE,
  PRIMARY KEY (id_producto, id_sabor)
);

CREATE TABLE IF NOT EXISTS receta (
  id_producto INTEGER REFERENCES productos(id_producto) ON DELETE CASCADE,
  id_insumo INTEGER REFERENCES insumo(id_insumo) ON DELETE CASCADE,
  cantidad_usada NUMERIC(12,3) NOT NULL CHECK (cantidad_usada > 0),
  PRIMARY KEY (id_producto, id_insumo)
);

-- Agrega campos del modelo nuevo a PRODUCTO sin romper la tabla actual.
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS precio_base NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS categoria_pos VARCHAR(60),
  ADD COLUMN IF NOT EXISTS estado BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE productos
SET precio_base = COALESCE(precio_base, precio)
WHERE precio_base IS NULL;

-- Agrega referencias del nuevo modelo a VENTA.
ALTER TABLE ventas
  ADD COLUMN IF NOT EXISTS id_empleado INTEGER REFERENCES empleado(id_empleado),
  ADD COLUMN IF NOT EXISTS id_corte INTEGER REFERENCES corte_caja(id_corte),
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS iva NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS efectivo_recibido NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS cambio_entregado NUMERIC(10,2);

-- Extiende detalle_ventas con tamaño/sabor/subtotal, manteniendo columnas actuales.
ALTER TABLE detalle_ventas
  ADD COLUMN IF NOT EXISTS id_tamano INTEGER REFERENCES tamano(id_tamano),
  ADD COLUMN IF NOT EXISTS id_sabor INTEGER REFERENCES sabor(id_sabor),
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2);

INSERT INTO rol(nombre) VALUES ('Empleado'), ('Administrador')
ON CONFLICT (nombre) DO NOTHING;

COMMIT;
