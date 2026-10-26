const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Servir la carpeta frontend completa como archivos estáticos
app.use(express.static(path.join(__dirname, '../frontend')));

// ==========================================
// ENDPOINT DE AUTENTICACIÓN (LOGIN)
// ==========================================
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(
      `
      SELECT
        u.id_usuario,
        u.username,
        e.id_empleado,
        e.nombre AS nombre_empleado,
        e.estado,
        r.id_rol,
        r.nombre AS rol
      FROM usuarios u
      LEFT JOIN empleado e ON e.id_empleado = u.id_empleado
      LEFT JOIN rol r ON r.id_rol = e.id_rol
      WHERE u.username = $1 AND u.password = $2
      `,
      [username, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuario o contraseña incorrectos'
      });
    }

    const usuario = result.rows[0];
    return res.json({
      success: true,
      user: {
        id_usuario: usuario.id_usuario,
        username: usuario.username,
        id_empleado: usuario.id_empleado,
        nombre: usuario.nombre_empleado,
        id_rol: usuario.id_rol,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ==========================================
// OBTENER MENÚ (POS)
// ==========================================
app.get('/api/menu', async (req, res) => {
    try {
        const query = `
            SELECT
                p.id_producto,
                p.nombre,
                p.precio,
                c.nombre AS categoria,
                CASE
                    -- Productos comprados ya terminados: IDs usados también en el descuento directo de inventario.
                    WHEN p.id_producto >= 50 OR p.id_producto = 3 THEN
                        COALESCE((
                            SELECT FLOOR(i.stock)
                            FROM public.insumo i
                            WHERE i.id_insumo = p.id_producto
                        ), 0)
                    -- Productos preparados con receta: limita la cantidad por el ingrediente más escaso.
                    ELSE COALESCE((
                        SELECT MIN(FLOOR(i.stock / NULLIF(r.cantidad_usada, 0)))
                        FROM public.receta r
                        JOIN public.insumo i ON i.id_insumo = r.id_insumo
                        WHERE r.id_producto = p.id_producto
                    ), 0)
                END AS stock,
                COALESCE(p.stock_minimo, 5) AS stock_minimo
            FROM public.productos p
            JOIN public.categorias c ON p.id_categoria = c.id_categoria
            WHERE p.estado = true
            ORDER BY c.id_categoria, p.id_producto;
        `;

        const result = await pool.query(query);
        const categoriasMap = {};

        result.rows.forEach(row => {
            if (!categoriasMap[row.categoria]) {
                categoriasMap[row.categoria] = {
                    categoria: row.categoria,
                    productos: []
                };
            }

            categoriasMap[row.categoria].productos.push({
                id_producto: row.id_producto,
                nombre: row.nombre,
                precio: parseFloat(row.precio),
                stock: Number(row.stock || 0),
                stock_minimo: Number(row.stock_minimo ?? 5)
            });
        });

        res.json(Object.values(categoriasMap));
    } catch (err) {
        console.error('Error al obtener el menú:', err);
        res.status(500).json({ error: 'Error al obtener el menú' });
    }
});

// ==========================================
// CRUD DE INVENTARIO
// ==========================================
app.get('/api/inventario', async (req, res) => {
    try {
        const query = `
            SELECT 
                i.id_insumo AS id_producto,
                i.nombre AS producto,
                COALESCE(ci.nombre, 'General') AS categoria,
                i.stock AS stock_actual,
                i.min_stock AS stock_minimo,
                i.unidad,
                CASE 
                    WHEN i.stock > i.min_stock THEN 'Disponible'
                    WHEN i.stock > 0 THEN 'Stock bajo'
                    ELSE 'Agotado'
                END AS estado
            FROM public.insumo i
            LEFT JOIN public.categoria_insumo ci ON i.id_cat_insumo = ci.id_cat_insumo
            ORDER BY i.id_insumo;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener el inventario:', err);
        res.status(500).json({ error: 'Error al obtener el inventario' });
    }
});

app.put('/api/inventario/:id', async (req, res) => {
    const { id } = req.params;
    const { stock, min_stock, nombre } = req.body;
    try {
        const query = `
            UPDATE public.insumo 
            SET stock = COALESCE($1, stock), 
                min_stock = COALESCE($2, min_stock),
                nombre = COALESCE($3, nombre)
            WHERE id_insumo = $4
            RETURNING *;
        `;
        const result = await pool.query(query, [stock, min_stock, nombre, id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Insumo no encontrado' });
        }
        res.json({ status: 'ok', insumo: result.rows[0] });
    } catch (err) {
        console.error('Error al actualizar el inventario:', err);
        res.status(500).json({ error: 'Error al actualizar el inventario' });
    }
});

// ==========================================
// OBTENER HISTORIAL DE VENTAS (GERENCIA)
// ==========================================
app.get('/api/ventas', async (req, res) => {
    try {
        const queryVentas = `
            SELECT id_venta, total, metodo_pago, efectivo_recibido, cambio_entregado, fecha_hora 
            FROM public.ventas 
            ORDER BY fecha_hora DESC;
        `;
        const ventasRes = await pool.query(queryVentas);
        const ventas = [];

        for (let v of ventasRes.rows) {
            const detalleRes = await pool.query(`
                SELECT dv.cantidad, p.nombre, dv.precio_unitario AS precio, dv.subtotal
                FROM public.detalle_ventas dv
                JOIN public.productos p ON dv.id_producto = p.id_producto
                WHERE dv.id_venta = $1
            `, [v.id_venta]);

            ventas.push({
                folio: v.id_venta,
                total: parseFloat(v.total),
                metodo_pago: v.metodo_pago,
                efectivo_recibido: parseFloat(v.efectivo_recibido || 0),
                cambio_entregado: parseFloat(v.cambio_entregado || 0),
                fecha_hora: v.fecha_hora,
                detalles: detalleRes.rows
            });
        }

        res.json(ventas);
    } catch (err) {
        console.error('Error al obtener ventas:', err);
        res.status(500).json({ error: 'Error al obtener el historial de ventas' });
    }
});

// ==========================================
// REGISTRAR VENTA, TAMAÑOS, EMPAQUES Y PROVEEDOR
// ==========================================
app.post('/api/ventas', async (req, res) => {
    const { total, metodo_pago, efectivo_recibido, cambio_entregado, detalles } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // VALIDACIÓN PREVIA: impedir que una venta deje insumos con stock negativo.
        // Se agrupa el consumo de todos los productos del carrito para detectar
        // también cuando varios productos necesitan el mismo insumo.
        const consumoPorInsumo = new Map();
        const agregarConsumo = (idInsumo, cantidad) => {
            if (!idInsumo || !Number.isFinite(Number(cantidad)) || Number(cantidad) <= 0) return;
            const id = Number(idInsumo);
            consumoPorInsumo.set(id, (consumoPorInsumo.get(id) || 0) + Number(cantidad));
        };

        for (const item of (detalles || [])) {
            const cantidad = Number(item.cantidad);
            if (!Number.isFinite(cantidad) || cantidad <= 0) {
                const error = new Error('La cantidad de los productos debe ser mayor que cero.');
                error.statusCode = 400;
                throw error;
            }

            const esReposteriaDirecta = Number(item.id_producto) >= 50 || Number(item.id_producto) === 3;
            if (esReposteriaDirecta) {
                agregarConsumo(item.id_producto, cantidad);
                continue;
            }

            let factorIngredientes = 1.0;
            let idInsumoEmpaque = null;
            if (item.customization) {
                if (item.customization.includes('Chico')) {
                    factorIngredientes = 1.0;
                    idInsumoEmpaque = 5;
                } else if (item.customization.includes('Mediano')) {
                    factorIngredientes = 1.35;
                    idInsumoEmpaque = 6;
                } else if (item.customization.includes('Grande')) {
                    factorIngredientes = 1.7;
                    idInsumoEmpaque = 7;
                }
            }

            const nombreItemLower = (item.nombre || '').toLowerCase();
            const esBebidaFria = item.es_fria === true || nombreItemLower.includes('frappe') ||
                nombreItemLower.includes('frappé') || nombreItemLower.includes('helado') ||
                nombreItemLower.includes('iced') || nombreItemLower.includes('fría') ||
                nombreItemLower.includes('fria') || nombreItemLower.includes('frio');
            const idInsumoTapa = esBebidaFria ? 9 : 8;

            const recetas = await client.query(
                `SELECT id_insumo, cantidad_usada FROM public.receta WHERE id_producto = $1`,
                [item.id_producto]
            );
            for (const receta of recetas.rows) {
                agregarConsumo(receta.id_insumo, Number(receta.cantidad_usada) * cantidad * factorIngredientes);
            }
            if (idInsumoEmpaque) {
                agregarConsumo(idInsumoEmpaque, cantidad);
                agregarConsumo(idInsumoTapa, cantidad);
            }
        }

        // Bloquea las filas hasta que termine la transacción para evitar que
        // dos ventas simultáneas consuman las mismas existencias.
        for (const [idInsumo, requerido] of consumoPorInsumo.entries()) {
            const stockRes = await client.query(
                `SELECT id_insumo, nombre, stock FROM public.insumo WHERE id_insumo = $1 FOR UPDATE`,
                [idInsumo]
            );
            if (stockRes.rows.length === 0) {
                const error = new Error(`No se encontró el insumo con ID ${idInsumo}.`);
                error.statusCode = 400;
                throw error;
            }
            const insumo = stockRes.rows[0];
            if (Number(insumo.stock) < requerido) {
                const disponible = Number(insumo.stock);
                const error = new Error(
                    `Stock insuficiente de "${insumo.nombre}". Disponible: ${disponible}; requerido para esta venta: ${requerido.toFixed(2)}.`
                );
                error.statusCode = 409;
                throw error;
            }
        }

        // 1. Insertar la venta principal
        const ventaRes = await client.query(
            `INSERT INTO public.ventas (total, metodo_pago, efectivo_recibido, cambio_entregado) 
             VALUES ($1, $2, $3, $4) RETURNING id_venta`,
            [total, metodo_pago, efectivo_recibido || 0, cambio_entregado || 0]
        );
        const id_venta = ventaRes.rows[0].id_venta;

        // 2. Registrar detalles e impactar inventarios con tamaños, empaques, tapas y repostería directa
        for (const item of detalles) {
            await client.query(
                `INSERT INTO public.detalle_ventas (id_venta, id_producto, cantidad, precio_unitario, subtotal)
                 VALUES ($1, $2, $3, $4, $5)`,
                [id_venta, item.id_producto, item.cantidad, item.precio, item.cantidad * item.precio]
            );

            // Identificar si es repostería/pastel directo de proveedor (ej. ID 3 o IDs >= 50)
            const esReposteriaDirecta = item.id_producto >= 50 || item.id_producto === 3;

            if (esReposteriaDirecta) {
                // Descuento directo de producto terminado de proveedor
                await client.query(
                    `UPDATE public.insumo 
                     SET stock = stock - $1 
                     WHERE id_insumo = $2`,
                    [item.cantidad, item.id_producto]
                );
           } else {
                // Lógica de bebidas: calcular factor de ingredientes por tamaño y empaque específico
                let factorIngredientes = 1.0;
                let idInsumoEmpaque = null;

                // Identificar si la bebida es fría (usando la bandera del frontend o buscando en el nombre)
                const nombreItemLower = (item.nombre || '').toLowerCase();
                const esBebidaFria = item.es_fria === true || 
                                     nombreItemLower.includes('frappe') || 
                                     nombreItemLower.includes('frappé') || 
                                     nombreItemLower.includes('helado') || 
                                     nombreItemLower.includes('iced') || 
                                     nombreItemLower.includes('fría') || 
                                     nombreItemLower.includes('fria') ||
                                     nombreItemLower.includes('frio');

                // ID 8: Tapa Caliente | ID 9: Tapa Fría
                const idInsumoTapa = esBebidaFria ? 9 : 8;

                if (item.customization) {
                    if (item.customization.includes('Chico')) {
                        factorIngredientes = 1.0;
                        idInsumoEmpaque = 5; // ID 5: Vasos Chicos (12 oz)
                    } else if (item.customization.includes('Mediano')) {
                        factorIngredientes = 1.35; // 35% más de ingredientes
                        idInsumoEmpaque = 6; // ID 6: Vasos Medianos (16 oz)
                    } else if (item.customization.includes('Grande')) {
                        factorIngredientes = 1.7;  // 70% más de ingredientes
                        idInsumoEmpaque = 7; // ID 7: Vasos Grandes (20 oz)
                    }
                }

                const consumoTotalReceta = item.cantidad * factorIngredientes;

                // Descontar insumos de cocina según la receta escalada
                await client.query(
                    `UPDATE public.insumo i
                     SET stock = i.stock - (r.cantidad_usada * $1)
                     FROM public.receta r
                     WHERE r.id_producto = $2 AND r.id_insumo = i.id_insumo`,
                    [consumoTotalReceta, item.id_producto]
                );

                // Descontar el vaso correspondiente al tamaño elegido
                if (idInsumoEmpaque) {
                    await client.query(
                        `UPDATE public.insumo 
                         SET stock = stock - $1 
                         WHERE id_insumo = $2`,
                        [item.cantidad, idInsumoEmpaque]
                    );

                    // Descontar automáticamente la tapa correspondiente (Fría ID 9 o Caliente ID 8)
                    await client.query(
                        `UPDATE public.insumo 
                         SET stock = stock - $1 
                         WHERE id_insumo = $2`,
                        [item.cantidad, idInsumoTapa]
                    );
                }
            }
        }

        await client.query('COMMIT');
        res.json({ status: 'ok', id_venta, message: 'Venta registrada e inventario actualizado con éxito' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error en la transacción de venta:', err);
        res.status(err.statusCode || 500).json({ error: err.statusCode ? err.message : 'Error al registrar la venta y actualizar existencias' });
    } finally {
        client.release();
    }
});

// ==========================================
// CRUD DE PROVEEDORES
// Tabla existente: public.proveedor
// ==========================================
app.get('/api/proveedores', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.id_proveedor, p.nombre, p.contacto, p.telefono,
                   COALESCE(NULLIF(p.estado, ''), 'Activo') AS estado,
                   COUNT(pi.id_insumo)::int AS total_insumos
            FROM public.proveedor p
            LEFT JOIN public.proveedor_insumo pi ON pi.id_proveedor = p.id_proveedor
            GROUP BY p.id_proveedor, p.nombre, p.contacto, p.telefono, p.estado
            ORDER BY p.id_proveedor DESC;
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener proveedores:', err);
        res.status(500).json({ error: 'Error al obtener proveedores' });
    }
});

app.post('/api/proveedores', async (req, res) => {
    const nombre = String(req.body.nombre || '').trim();
    const contacto = String(req.body.contacto || '').trim() || null;
    const telefono = String(req.body.telefono || '').trim() || null;
    const estado = String(req.body.estado || 'Activo').trim();
    if (!nombre) return res.status(400).json({ error: 'El nombre del proveedor es obligatorio' });
    if (!['Activo', 'Inactivo'].includes(estado)) return res.status(400).json({ error: 'Estado no válido' });
    try {
        const result = await pool.query(`
            INSERT INTO public.proveedor (nombre, contacto, telefono, estado)
            VALUES ($1, $2, $3, $4)
            RETURNING id_proveedor, nombre, contacto, telefono, estado;
        `, [nombre, contacto, telefono, estado]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al registrar proveedor:', err);
        res.status(500).json({ error: 'Error al registrar proveedor' });
    }
});

app.put('/api/proveedores/:id', async (req, res) => {
    const id = Number(req.params.id);
    const nombre = String(req.body.nombre || '').trim();
    const contacto = String(req.body.contacto || '').trim() || null;
    const telefono = String(req.body.telefono || '').trim() || null;
    const estado = String(req.body.estado || 'Activo').trim();
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Identificador no válido' });
    if (!nombre) return res.status(400).json({ error: 'El nombre del proveedor es obligatorio' });
    if (!['Activo', 'Inactivo'].includes(estado)) return res.status(400).json({ error: 'Estado no válido' });
    try {
        const result = await pool.query(`
            UPDATE public.proveedor
            SET nombre = $1, contacto = $2, telefono = $3, estado = $4
            WHERE id_proveedor = $5
            RETURNING id_proveedor, nombre, contacto, telefono, estado;
        `, [nombre, contacto, telefono, estado, id]);
        if (!result.rowCount) return res.status(404).json({ error: 'Proveedor no encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al actualizar proveedor:', err);
        res.status(500).json({ error: 'Error al actualizar proveedor' });
    }
});

app.patch('/api/proveedores/:id/estado', async (req, res) => {
    const id = Number(req.params.id);
    const estado = String(req.body.estado || '').trim();
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Identificador no válido' });
    if (!['Activo', 'Inactivo'].includes(estado)) return res.status(400).json({ error: 'Estado no válido' });
    try {
        const result = await pool.query(`UPDATE public.proveedor SET estado = $1 WHERE id_proveedor = $2 RETURNING id_proveedor, nombre, contacto, telefono, estado`, [estado, id]);
        if (!result.rowCount) return res.status(404).json({ error: 'Proveedor no encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al cambiar estado del proveedor:', err);
        res.status(500).json({ error: 'Error al cambiar el estado del proveedor' });
    }
});

// ==========================================
// INSUMOS Y PRECIOS POR PROVEEDOR
// Usa las tablas existentes public.insumo y public.proveedor_insumo.
// ==========================================
app.get('/api/insumos-proveedor', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id_insumo, nombre, unidad
            FROM public.insumo
            ORDER BY nombre ASC;
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener catálogo de insumos para proveedores:', err);
        res.status(500).json({ error: 'Error al obtener el catálogo de insumos' });
    }
});

app.get('/api/proveedores/:id/insumos', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Identificador de proveedor no válido' });
    try {
        const proveedor = await pool.query('SELECT id_proveedor FROM public.proveedor WHERE id_proveedor = $1', [id]);
        if (!proveedor.rowCount) return res.status(404).json({ error: 'Proveedor no encontrado' });
        const result = await pool.query(`
            SELECT i.id_insumo, i.nombre, i.unidad, pi.precio_compra
            FROM public.proveedor_insumo pi
            JOIN public.insumo i ON i.id_insumo = pi.id_insumo
            WHERE pi.id_proveedor = $1
            ORDER BY i.nombre ASC;
        `, [id]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al consultar insumos del proveedor:', err);
        res.status(500).json({ error: 'Error al consultar los insumos del proveedor' });
    }
});

app.put('/api/proveedores/:id/insumos', async (req, res) => {
    const id = Number(req.params.id);
    const insumos = req.body.insumos;
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Identificador de proveedor no válido' });
    if (!Array.isArray(insumos)) return res.status(400).json({ error: 'La lista de insumos no es válida' });
    const vistos = new Set();
    for (const item of insumos) {
        const idInsumo = Number(item.id_insumo);
        const precio = Number(item.precio_compra);
        if (!Number.isInteger(idInsumo) || idInsumo <= 0 || !Number.isFinite(precio) || precio < 0) {
            return res.status(400).json({ error: 'Cada insumo debe tener un identificador válido y un precio mayor o igual a cero' });
        }
        if (vistos.has(idInsumo)) return res.status(400).json({ error: 'Hay insumos duplicados en la solicitud' });
        vistos.add(idInsumo);
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const proveedor = await client.query('SELECT id_proveedor FROM public.proveedor WHERE id_proveedor = $1 FOR UPDATE', [id]);
        if (!proveedor.rowCount) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }
        for (const item of insumos) {
            const existe = await client.query('SELECT id_insumo FROM public.insumo WHERE id_insumo = $1', [Number(item.id_insumo)]);
            if (!existe.rowCount) throw new Error(`El insumo ${item.id_insumo} no existe`);
        }
        // El contenido enviado representa la lista completa: quitar asociaciones desmarcadas.
        await client.query('DELETE FROM public.proveedor_insumo WHERE id_proveedor = $1', [id]);
        for (const item of insumos) {
            await client.query(`
                INSERT INTO public.proveedor_insumo (id_proveedor, id_insumo, precio_compra)
                VALUES ($1, $2, $3)
                ON CONFLICT (id_proveedor, id_insumo)
                DO UPDATE SET precio_compra = EXCLUDED.precio_compra;
            `, [id, Number(item.id_insumo), Number(item.precio_compra)]);
        }
        await client.query('COMMIT');
        res.json({ success: true, total_insumos: insumos.length });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al guardar insumos del proveedor:', err);
        res.status(500).json({ error: err.message && err.message.startsWith('El insumo ') ? err.message : 'Error al guardar los insumos del proveedor' });
    } finally {
        client.release();
    }
});

// Ruta principal SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor ejecutándose en http://localhost:${PORT}`));


