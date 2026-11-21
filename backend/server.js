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
  
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Ingresa usuario y contraseña' });
  }

  try {
    const query = `
      SELECT
        u.id_usuario,
        u.username,
        e.id_empleado,
        e.nombre AS nombre_empleado,
        e.estado,
        r.id_rol,
        r.nombre AS rol
      FROM public.usuarios u
      INNER JOIN public.empleado e ON e.id_empleado = u.id_empleado
      LEFT JOIN public.rol r ON r.id_rol = e.id_rol
      WHERE u.username = $1 AND u.password = $2
    `;

    const result = await pool.query(query, [username, password]);

    // 1. Validar si el usuario y contraseña existen
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuario o contraseña incorrectos'
      });
    }

    const usuario = result.rows[0];

    // 2. Validar que el empleado esté en estado ACTIVO
    if (usuario.estado && usuario.estado.toLowerCase() !== 'activo') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado: Tu cuenta de empleado se encuentra Inactiva. Contacta al administrador.'
      });
    }

    // 3. Login exitoso
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
    console.error('Error durante el inicio de sesión:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al verificar credenciales'
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
                    WHEN p.control_stock = 'directo' THEN COALESCE(FLOOR(p.stock_actual), 0)
                    ELSE COALESCE((
                        SELECT MIN(FLOOR(i.stock / NULLIF(r.cantidad_usada, 0)))
                        FROM public.receta r
                        JOIN public.insumo i ON i.id_insumo = r.id_insumo
                        WHERE r.id_producto = p.id_producto
                    ), 0)
                END AS stock,
                COALESCE(p.stock_minimo, 5) AS stock_minimo,
                p.control_stock
            FROM public.productos p
            JOIN public.categorias c ON p.id_categoria = c.id_categoria
            WHERE p.estado = true
            ORDER BY c.id_categoria, p.id_producto;
        `;

        const result = await pool.query(query);
        // Configuración individual de tamaños y extras por producto.
        // Las tablas se crean con el archivo SQL de esta entrega.
        const [tamanosRes, extrasRes] = await Promise.all([
            pool.query(`
                SELECT pt.id_producto, t.id_tamano, t.nombre, t.modificador_precio,
                       pt.factor_ingredientes, t.id_insumo_vaso,
                       COALESCE((
                           SELECT MIN(FLOOR(i.stock / NULLIF(r.cantidad_usada * NULLIF(pt.factor_ingredientes, 0), 0)))
                           FROM public.receta r
                           JOIN public.insumo i ON i.id_insumo = r.id_insumo
                           WHERE r.id_producto = pt.id_producto
                       ), 0) AS stock
                FROM public.producto_tamano pt
                JOIN public.tamano t ON t.id_tamano = pt.id_tamano
                WHERE t.nombre ILIKE '%oz%'
                ORDER BY t.id_tamano
            `),
            pool.query(`
                SELECT pe.id_producto, pe.id_extra, p.nombre,
                       COALESCE(pe.precio_adicional, p.precio, 0) AS precio,
                       CASE
                           WHEN p.control_stock = 'directo' THEN COALESCE(FLOOR(p.stock_actual), 0)
                           ELSE COALESCE((
                               SELECT MIN(FLOOR(i.stock / NULLIF(r.cantidad_usada, 0)))
                               FROM public.receta r
                               JOIN public.insumo i ON i.id_insumo = r.id_insumo
                               WHERE r.id_producto = p.id_producto
                           ), 0)
                       END AS stock,
                       COALESCE(p.stock_minimo, 5) AS stock_minimo,
                       p.control_stock
                FROM public.producto_extra pe
                JOIN public.productos p ON p.id_producto = pe.id_extra
                WHERE p.estado = true
                ORDER BY p.nombre
            `)
        ]);
        const tamanosPorProducto = new Map();
        for (const t of tamanosRes.rows) {
            if (!tamanosPorProducto.has(Number(t.id_producto))) tamanosPorProducto.set(Number(t.id_producto), []);
            tamanosPorProducto.get(Number(t.id_producto)).push({
                id_tamano: Number(t.id_tamano), nombre: t.nombre,
                modificador_precio: Number(t.modificador_precio || 0),
                factor_ingredientes: Number(t.factor_ingredientes || 1),
                id_insumo_vaso: t.id_insumo_vaso == null ? null : Number(t.id_insumo_vaso),
                stock: Number(t.stock || 0)
            });
        }
        const extrasPorProducto = new Map();
        for (const e of extrasRes.rows) {
            if (!extrasPorProducto.has(Number(e.id_producto))) extrasPorProducto.set(Number(e.id_producto), []);
            extrasPorProducto.get(Number(e.id_producto)).push({
                id_producto: Number(e.id_extra), nombre: e.nombre, precio: Number(e.precio || 0),
                stock: Number(e.stock || 0), stock_minimo: Number(e.stock_minimo ?? 5),
                control_stock: e.control_stock
            });
        }
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
                stock_minimo: Number(row.stock_minimo ?? 5),
                control_stock: row.control_stock,
                tamanos: tamanosPorProducto.get(Number(row.id_producto)) || [],
                extras: extrasPorProducto.get(Number(row.id_producto)) || []
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
            SELECT i.id_insumo AS id_producto, i.nombre AS producto,
                   COALESCE(ci.nombre, 'General') AS categoria,
                   i.stock AS stock_actual, i.min_stock AS stock_minimo, i.unidad,
                   CASE WHEN i.stock > i.min_stock THEN 'Disponible'
                        WHEN i.stock > 0 THEN 'Stock bajo' ELSE 'Agotado' END AS estado,
                   'insumo' AS tipo
            FROM public.insumo i
            LEFT JOIN public.categoria_insumo ci ON i.id_cat_insumo = ci.id_cat_insumo
            UNION ALL
            SELECT p.id_producto, p.nombre AS producto,
                   COALESCE(c.nombre, 'General') AS categoria,
                   p.stock_actual AS stock_actual, p.stock_minimo AS stock_minimo,
                   'piezas' AS unidad,
                   CASE WHEN p.stock_actual > p.stock_minimo THEN 'Disponible'
                        WHEN p.stock_actual > 0 THEN 'Stock bajo' ELSE 'Agotado' END AS estado,
                   'producto' AS tipo
            FROM public.productos p
            LEFT JOIN public.categorias c ON p.id_categoria = c.id_categoria
            WHERE p.control_stock = 'directo'
            ORDER BY tipo, id_producto;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener el inventario:', err);
        res.status(500).json({ error: 'Error al obtener el inventario' });
    }
});

app.put('/api/inventario/productos/:id', async (req, res) => {
    return res.status(403).json({ error: 'El stock de productos se actualiza mediante compras recibidas a proveedores.' });

});

app.put('/api/inventario/:id', async (req, res) => {
    return res.status(403).json({
        error: 'La existencia y el stock mínimo de los insumos se consultan aquí y se actualizan mediante compras a proveedores.'
    });
});


app.get('/api/ventas', async (req, res) => {
    try {
        const queryVentas = `
            SELECT v.id_venta, v.total, v.metodo_pago, v.efectivo_recibido,
                   v.cambio_entregado, v.fecha_hora,
                   e.nombre AS nombre_usuario, u.username
            FROM public.ventas v
            LEFT JOIN public.usuarios u ON u.id_usuario = v.id_usuario
            LEFT JOIN public.empleado e ON e.id_empleado = u.id_empleado
            ORDER BY v.fecha_hora DESC;
        `;
        const ventasRes = await pool.query(queryVentas);
        const ventas = [];

        for (let v of ventasRes.rows) {
            const detalleRes = await pool.query(`
                SELECT dv.cantidad, p.nombre, dv.precio_unitario AS precio, dv.subtotal,
                       dv.personalizacion, dv.id_producto_padre
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
                nombre_usuario: v.nombre_usuario || null,
                username: v.username || null,
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
    const { id_usuario, total, metodo_pago, efectivo_recibido, cambio_entregado, detalles } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        if (!Number.isInteger(Number(id_usuario)) || Number(id_usuario) <= 0) {
            const error = new Error('No se pudo identificar al usuario que realiza la venta. Cierra sesión e inicia nuevamente.');
            error.statusCode = 400;
            throw error;
        }
        const usuarioVenta = await client.query(
            'SELECT id_usuario FROM public.usuarios WHERE id_usuario = $1',
            [Number(id_usuario)]
        );
        if (!usuarioVenta.rowCount) {
            const error = new Error('El usuario que realiza la venta no existe.');
            error.statusCode = 400;
            throw error;
        }

        // VALIDACIÓN PREVIA: impedir que una venta deje insumos con stock negativo.
        // Se agrupa el consumo de todos los productos del carrito para detectar
        // también cuando varios productos necesitan el mismo insumo.
        const consumoPorInsumo = new Map();
        const consumoPorProducto = new Map();
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

            const productoTipoRes = await client.query(
                `SELECT control_stock FROM public.productos WHERE id_producto = $1 FOR UPDATE`,
                [Number(item.id_producto)]
            );
            if (!productoTipoRes.rowCount) {
                const error = new Error(`No se encontró el producto con ID ${item.id_producto}.`);
                error.statusCode = 400; throw error;
            }
            if (productoTipoRes.rows[0].control_stock === 'directo') {
                const idProducto = Number(item.id_producto);
                consumoPorProducto.set(idProducto, (consumoPorProducto.get(idProducto) || 0) + cantidad);
                continue;
            }

            let factorIngredientes = 1.0;
            let idInsumoEmpaque = null;
            if (item.id_tamano != null && item.id_tamano !== '') {
                const tamanoRes = await client.query(
                    `SELECT pt.factor_ingredientes, t.id_insumo_vaso
                     FROM public.producto_tamano pt
                     JOIN public.tamano t ON t.id_tamano = pt.id_tamano
                     WHERE pt.id_producto = $1 AND pt.id_tamano = $2`,
                    [Number(item.id_producto), Number(item.id_tamano)]
                );
                if (!tamanoRes.rowCount) {
                    const error = new Error(`El tamaño seleccionado no está permitido para el producto ${item.nombre || item.id_producto}.`);
                    error.statusCode = 400; throw error;
                }
                factorIngredientes = Number(tamanoRes.rows[0].factor_ingredientes || 1);
                idInsumoEmpaque = tamanoRes.rows[0].id_insumo_vaso == null ? null : Number(tamanoRes.rows[0].id_insumo_vaso);
            } else if (item.customization) {
                // Compatibilidad temporal con el frontend anterior.
                if (item.customization.includes('Chico')) { factorIngredientes = 1.0; idInsumoEmpaque = 5; }
                else if (item.customization.includes('Mediano')) { factorIngredientes = 1.35; idInsumoEmpaque = 6; }
                else if (item.customization.includes('Grande')) { factorIngredientes = 1.7; idInsumoEmpaque = 7; }
            }

            const nombreItemLower = (item.nombre || '').toLowerCase();
            const esBebidaFria = item.es_fria === true || nombreItemLower.includes('frappe') ||
                nombreItemLower.includes('frappé') || nombreItemLower.includes('helado') ||
                nombreItemLower.includes('iced') || nombreItemLower.includes('fría') ||
                nombreItemLower.includes('fria') || nombreItemLower.includes('frio');
            const idInsumoTapa = esBebidaFria ? 9 : 8;

            const recetas = await client.query(
                `SELECT id_insumo, cantidad_usada FROM public.receta WHERE id_producto = $1`,
                [Number(item.id_producto)]
            );
            if (recetas.rowCount === 0) {
                const error = new Error(`El producto ${item.nombre || item.id_producto} está configurado por receta, pero no tiene ingredientes registrados. Completa su receta antes de venderlo.`);
                error.statusCode = 409;
                throw error;
            }
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

        for (const [idProducto, requerido] of consumoPorProducto.entries()) {
            const stockRes = await client.query(
                `SELECT id_producto, nombre, stock_actual FROM public.productos WHERE id_producto = $1 FOR UPDATE`,
                [idProducto]
            );
            if (!stockRes.rowCount || Number(stockRes.rows[0].stock_actual) < requerido) {
                const nombre = stockRes.rows[0]?.nombre || `producto ${idProducto}`;
                const disponible = stockRes.rowCount ? Number(stockRes.rows[0].stock_actual) : 0;
                const error = new Error(`Stock insuficiente de "${nombre}". Disponible: ${disponible}; requerido: ${requerido}.`);
                error.statusCode = 409; throw error;
            }
        }

        // 1. Insertar la venta principal
        const ventaRes = await client.query(
            `INSERT INTO public.ventas (total, metodo_pago, efectivo_recibido, cambio_entregado, id_usuario)
             VALUES ($1, $2, $3, $4, $5) RETURNING id_venta`,
            [total, metodo_pago, efectivo_recibido || 0, cambio_entregado || 0, Number(id_usuario)]
        );
        const id_venta = ventaRes.rows[0].id_venta;

        // 2. Registrar detalles e impactar inventarios con tamaños, empaques, tapas y repostería directa
        for (const item of detalles) {
            await client.query(
                `INSERT INTO public.detalle_ventas
                    (id_venta, id_producto, cantidad, precio_unitario, id_tamano, subtotal, personalizacion, id_producto_padre)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    id_venta, item.id_producto, item.cantidad, item.precio,
                    item.id_tamano ?? null, item.cantidad * item.precio,
                    String(item.customization || '').trim() || null,
                    item.id_producto_padre == null ? null : Number(item.id_producto_padre)
                ]
            );

            // El tipo de inventario se determina por la configuración del producto,
            // no por rangos o valores específicos de id_producto.
            const tipoProductoRes = await client.query(
                `SELECT control_stock FROM public.productos WHERE id_producto = $1`,
                [Number(item.id_producto)]
            );
            const esProductoDirecto = tipoProductoRes.rows[0]?.control_stock === 'directo';

            if (esProductoDirecto) {
                await client.query(
                    `UPDATE public.productos SET stock_actual = stock_actual - $1
                     WHERE id_producto = $2 AND control_stock = 'directo'`,
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

                if (item.id_tamano != null && item.id_tamano !== '') {
                    const tamanoRes = await client.query(
                        `SELECT pt.factor_ingredientes, t.id_insumo_vaso
                         FROM public.producto_tamano pt
                         JOIN public.tamano t ON t.id_tamano = pt.id_tamano
                         WHERE pt.id_producto = $1 AND pt.id_tamano = $2`,
                        [Number(item.id_producto), Number(item.id_tamano)]
                    );
                    if (!tamanoRes.rowCount) throw new Error(`El tamaño seleccionado no está permitido para el producto ${item.nombre || item.id_producto}.`);
                    factorIngredientes = Number(tamanoRes.rows[0].factor_ingredientes || 1);
                    idInsumoEmpaque = tamanoRes.rows[0].id_insumo_vaso == null ? null : Number(tamanoRes.rows[0].id_insumo_vaso);
                } else if (item.customization) {
                    // Compatibilidad temporal con el frontend anterior.
                    if (item.customization.includes('Chico')) { factorIngredientes = 1.0; idInsumoEmpaque = 5; }
                    else if (item.customization.includes('Mediano')) { factorIngredientes = 1.35; idInsumoEmpaque = 6; }
                    else if (item.customization.includes('Grande')) { factorIngredientes = 1.7; idInsumoEmpaque = 7; }
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
// COMPRAS A PROVEEDORES
// La recepción actualiza inventario y genera un egreso contable
// dentro de una sola transacción PostgreSQL.
// ==========================================
app.get('/api/catalogo-compras', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 'insumo'::text AS tipo, i.id_insumo AS id_articulo,
                   i.nombre, i.unidad, COALESCE(ci.nombre, 'General') AS categoria,
                   COALESCE((SELECT MIN(pi.precio_compra) FROM public.proveedor_insumo pi WHERE pi.id_insumo = i.id_insumo), 0)::numeric AS precio_sugerido
            FROM public.insumo i
            LEFT JOIN public.categoria_insumo ci ON i.id_cat_insumo = ci.id_cat_insumo
            UNION ALL
            SELECT 'producto'::text AS tipo, p.id_producto AS id_articulo,
                   p.nombre, 'piezas'::text AS unidad, COALESCE(c.nombre, 'General') AS categoria, 0::numeric AS precio_sugerido
            FROM public.productos p
            LEFT JOIN public.categorias c ON p.id_categoria = c.id_categoria
            WHERE LOWER(COALESCE(p.control_stock, '')) = 'directo'
              AND p.estado = true
            ORDER BY tipo, nombre;
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al cargar catálogo de compras:', err);
        res.status(500).json({ error: 'No se pudo cargar el catálogo de compras.' });
    }
});

app.get('/api/compras', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.id_compra, c.fecha_compra, c.total, c.metodo_pago, c.estado,
                   p.nombre AS proveedor,
                   e.nombre AS nombre_usuario, u.username, r.nombre AS rol_usuario,
                   COUNT(d.id_detalle_compra)::int AS articulos
            FROM public.compra_proveedor c
            JOIN public.proveedor p ON p.id_proveedor = c.id_proveedor
            LEFT JOIN public.usuarios u ON u.id_usuario = c.id_usuario
            LEFT JOIN public.empleado e ON e.id_empleado = u.id_empleado
            LEFT JOIN public.rol r ON r.id_rol = e.id_rol
            LEFT JOIN public.detalle_compra_proveedor d ON d.id_compra = c.id_compra
            GROUP BY c.id_compra, p.nombre, e.nombre, u.username, r.nombre
            ORDER BY c.id_compra DESC
            LIMIT 100;
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al consultar compras:', err);
        res.status(500).json({ error: 'No se pudo consultar el historial de compras.' });
    }
});

app.post('/api/compras', async (req, res) => {
    const idProveedor = Number(req.body.id_proveedor);
    const idUsuario = Number(req.body.id_usuario);
    const fechaCompra = req.body.fecha_compra || new Date().toISOString().slice(0, 10);
    const metodoPago = String(req.body.metodo_pago || 'Efectivo').trim();
    const observaciones = String(req.body.observaciones || '').trim() || null;
    const items = req.body.items;

    if (!Number.isInteger(idProveedor) || idProveedor <= 0 || !Number.isInteger(idUsuario) || idUsuario <= 0 ||
        !Array.isArray(items) || !items.length) {
        return res.status(400).json({ error: 'No se pudo identificar al usuario o faltan el proveedor y los artículos de la compra.' });
    }
    const fechaTexto = String(fechaCompra).trim();
    const partesFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fechaTexto);
    const fechaValida = partesFecha && (() => {
        const anio = Number(partesFecha[1]);
        const mes = Number(partesFecha[2]);
        const dia = Number(partesFecha[3]);
        const fecha = new Date(Date.UTC(anio, mes - 1, dia));
        return fecha.getUTCFullYear() === anio &&
               fecha.getUTCMonth() === mes - 1 &&
               fecha.getUTCDate() === dia;
    })();
    if (!fechaValida) {
        return res.status(400).json({ error: 'La fecha de compra no es válida. Selecciona una fecha válida en el calendario.' });
    }
    const hoyLocal = new Date();
    const fechaHoyLocal = `${hoyLocal.getFullYear()}-${String(hoyLocal.getMonth() + 1).padStart(2, '0')}-${String(hoyLocal.getDate()).padStart(2, '0')}`;
    if (fechaTexto > fechaHoyLocal) {
        return res.status(400).json({ error: 'La fecha de compra no puede ser posterior al día de hoy.' });
    }
    const permitidos = new Set(['Efectivo', 'Tarjeta', 'Transferencia', 'Crédito']);
    if (!permitidos.has(metodoPago)) return res.status(400).json({ error: 'Método de pago no válido.' });

    const ids = new Set();
    for (const item of items) {
        const tipo = String(item.tipo || '');
        const id = Number(item.id_articulo);
        const cantidad = Number(item.cantidad);
        const precio = Number(item.precio_unitario);
        if (!['insumo', 'producto'].includes(tipo) || !Number.isInteger(id) || id <= 0 ||
            !Number.isInteger(cantidad) || cantidad <= 0 || !Number.isFinite(precio) || precio <= 0) {
            return res.status(400).json({ error: 'Cada artículo debe tener cantidad mayor a cero y precio unitario mayor a cero.' });
        }
        const clave = `${tipo}:${id}`;
        if (ids.has(clave)) return res.status(400).json({ error: 'No repitas el mismo artículo; modifica su cantidad.' });
        ids.add(clave);
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const usuarioCompra = await client.query(
            `SELECT u.id_usuario
             FROM public.usuarios u
             JOIN public.empleado e ON e.id_empleado = u.id_empleado
             WHERE u.id_usuario = $1 AND LOWER(COALESCE(e.estado, 'Activo')) = 'activo'`,
            [idUsuario]
        );
        if (!usuarioCompra.rowCount) {
            const e = new Error('El usuario que registra la compra no existe o está inactivo. Inicia sesión nuevamente.');
            e.statusCode = 401; throw e;
        }
        const proveedor = await client.query(
            `SELECT id_proveedor FROM public.proveedor WHERE id_proveedor = $1 AND COALESCE(estado,'Activo') = 'Activo' FOR UPDATE`,
            [idProveedor]
        );
        if (!proveedor.rowCount) {
            const e = new Error('El proveedor no existe o está inactivo.');
            e.statusCode = 404; throw e;
        }

        let total = 0;
        const articulosValidados = [];
        for (const item of items) {
            const cantidad = Number(item.cantidad);
            const precio = Number(item.precio_unitario);
            let articulo;
            if (item.tipo === 'insumo') {
                const r = await client.query(
                    `SELECT id_insumo AS id, nombre, unidad FROM public.insumo WHERE id_insumo = $1 FOR UPDATE`,
                    [Number(item.id_articulo)]
                );
                if (!r.rowCount) { const e = new Error('Uno de los insumos ya no existe.'); e.statusCode=400; throw e; }
                articulo = r.rows[0];
            } else {
                const r = await client.query(
                    `SELECT id_producto AS id, nombre, 'piezas'::text AS unidad FROM public.productos
                     WHERE id_producto = $1 AND estado = true AND LOWER(COALESCE(control_stock,'')) = 'directo' FOR UPDATE`,
                    [Number(item.id_articulo)]
                );
                if (!r.rowCount) { const e = new Error('El producto no existe o no utiliza control de stock directo.'); e.statusCode=400; throw e; }
                articulo = r.rows[0];
            }
            const subtotal = Math.round(cantidad * precio * 100) / 100;
            total += subtotal;
            articulosValidados.push({ ...item, ...articulo, cantidad, precio, subtotal });
        }
        total = Math.round(total * 100) / 100;
        if (total <= 0) { const e = new Error('El total de la compra debe ser mayor a cero.'); e.statusCode=400; throw e; }

        const compraRes = await client.query(`
            INSERT INTO public.compra_proveedor
              (id_proveedor, fecha_compra, total, metodo_pago, observaciones, estado, id_usuario)
            VALUES ($1,$2,$3,$4,$5,'Recibida',$6)
            RETURNING id_compra;
        `, [idProveedor, fechaTexto, total, metodoPago, observaciones, idUsuario]);
        const idCompra = compraRes.rows[0].id_compra;

        for (const item of articulosValidados) {
            await client.query(`
                INSERT INTO public.detalle_compra_proveedor
                  (id_compra, tipo_articulo, id_articulo, nombre_articulo, unidad, cantidad, precio_unitario, subtotal)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
            `, [idCompra, item.tipo, item.id, item.nombre, item.tipo === 'insumo' && ['gramo','gramos','g','gr'].includes(String(item.unidad || '').trim().toLowerCase()) ? 'unidad de 1 kg' : item.tipo === 'insumo' && ['mililitro','mililitros','ml','cc'].includes(String(item.unidad || '').trim().toLowerCase()) ? 'unidad de 1 L' : item.unidad, item.cantidad, item.precio, item.subtotal]);

            if (item.tipo === 'insumo') {
                // Las compras se capturan en unidades enteras de presentación.
                // Si el inventario está en gramos o mililitros, cada unidad comprada equivale a 1 kg o 1 L.
                const unidadNormalizada = String(item.unidad || '').trim().toLowerCase();
                const factorConversion = ['gramo', 'gramos', 'g', 'gr', 'mililitro', 'mililitros', 'ml', 'cc'].includes(unidadNormalizada) ? 1000 : 1;
                const cantidadInventario = item.cantidad * factorConversion;
                await client.query(
                    `UPDATE public.insumo SET stock = stock + $1 WHERE id_insumo = $2`,
                    [cantidadInventario, item.id]
                );
            } else {
                await client.query(
                    `UPDATE public.productos SET stock_actual = stock_actual + $1 WHERE id_producto = $2 AND control_stock = 'directo'`,
                    [item.cantidad, item.id]
                );
            }
        }

        const gastoRes = await client.query(`
            INSERT INTO public.gasto
              (concepto, categoria, monto, fecha_gasto, metodo_pago, observaciones, id_compra)
            VALUES ($1, 'Compras a proveedores', $2, $3, $4, $5, $6)
            RETURNING id_gasto;
        `, [`Compra a proveedor #${idCompra}`, total, fechaCompra, metodoPago, observaciones, idCompra]);

        await client.query('COMMIT');
        res.status(201).json({ success: true, id_compra: idCompra, id_gasto: gastoRes.rows[0].id_gasto, folio: `CP-${idCompra}`, total });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al registrar compra:', err);
        res.status(err.statusCode || 500).json({ error: err.statusCode ? err.message : 'No se pudo registrar la compra.' });
    } finally {
        client.release();
    }
});

// Resumen, egresos e historial detallado de compras para Contabilidad.
app.get('/api/contabilidad', async (req, res) => {
    try {
        const [movimientosRes, resumenRes, comprasRes] = await Promise.all([
            pool.query(`
                SELECT id_gasto, concepto, categoria, monto, fecha_gasto,
                       metodo_pago, observaciones, id_compra
                FROM public.gasto
                ORDER BY fecha_gasto DESC, id_gasto DESC;
            `),
            pool.query(`
                SELECT COALESCE((SELECT SUM(total) FROM public.ventas),0)::numeric AS ingresos,
                       COALESCE((SELECT SUM(monto) FROM public.gasto),0)::numeric AS egresos;
            `),
            pool.query(`
                SELECT
                    c.id_compra,
                    c.fecha_compra,
                    c.total,
                    c.metodo_pago,
                    c.estado,
                    c.observaciones,
                    p.nombre AS proveedor,
                    e.nombre AS nombre_usuario,
                    u.username,
                    r.nombre AS rol_usuario,
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'id_detalle_compra', d.id_detalle_compra,
                                'tipo_articulo', d.tipo_articulo,
                                'nombre_articulo', d.nombre_articulo,
                                'unidad', d.unidad,
                                'cantidad', d.cantidad,
                                'precio_unitario', d.precio_unitario,
                                'subtotal', d.subtotal
                            ) ORDER BY d.id_detalle_compra
                        ) FILTER (WHERE d.id_detalle_compra IS NOT NULL),
                        '[]'::json
                    ) AS detalles
                FROM public.compra_proveedor c
                INNER JOIN public.proveedor p ON p.id_proveedor = c.id_proveedor
                LEFT JOIN public.usuarios u ON u.id_usuario = c.id_usuario
                LEFT JOIN public.empleado e ON e.id_empleado = u.id_empleado
                LEFT JOIN public.rol r ON r.id_rol = e.id_rol
                LEFT JOIN public.detalle_compra_proveedor d ON d.id_compra = c.id_compra
                GROUP BY c.id_compra, p.nombre, e.nombre, u.username, r.nombre
                ORDER BY c.fecha_compra DESC, c.id_compra DESC;
            `)
        ]);

        res.json({
            movimientos: movimientosRes.rows,
            resumen: resumenRes.rows[0],
            compras: comprasRes.rows
        });
    } catch (err) {
        console.error('Error al cargar contabilidad:', err);
        res.status(500).json({ error: 'No se pudo cargar la información contable.' });
    }
});

// ==========================================
// Gastos adicionales administrados desde Contabilidad.
app.post('/api/contabilidad/gastos', async (req, res) => {
    const concepto = String(req.body.concepto || '').trim();
    const categoria = String(req.body.categoria || 'Otros').trim();
    const monto = Number(req.body.monto);
    const fecha = String(req.body.fecha_gasto || '').slice(0, 10);
    const metodo = String(req.body.metodo_pago || 'Efectivo').trim();
    const observaciones = String(req.body.observaciones || '').trim() || null;
    if (!concepto || !Number.isFinite(monto) || monto <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(fecha))
        return res.status(400).json({ error: 'Concepto, importe positivo y fecha válida son obligatorios.' });
    try {
        const result = await pool.query(`
            INSERT INTO public.gasto (concepto, categoria, monto, fecha_gasto, metodo_pago, observaciones)
            VALUES ($1,$2,$3,$4,$5,$6) RETURNING *;
        `, [concepto, categoria, monto, fecha, metodo, observaciones]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al registrar gasto extra:', err);
        res.status(500).json({ error: 'No se pudo registrar el gasto adicional.' });
    }
});

// Configuración de nóminas y registro explícito de pagos semanales.
app.get('/api/nominas', async (req, res) => {
    try {
        const [nominas, pagos] = await Promise.all([
            pool.query(`SELECT n.id_nomina, n.id_empleado, e.nombre, n.sueldo_mensual,
                               ROUND((n.sueldo_mensual * 12 / 52)::numeric, 2) AS pago_semanal, n.activa
                        FROM public.nomina n JOIN public.empleado e ON e.id_empleado=n.id_empleado
                        WHERE n.activa=true ORDER BY e.nombre;`),
            pool.query(`SELECT p.id_pago_nomina, p.id_nomina, n.id_empleado, e.nombre,
                               p.semana_inicio, p.monto, p.fecha_pago, p.metodo_pago
                        FROM public.nomina_pago p JOIN public.nomina n ON n.id_nomina=p.id_nomina
                        JOIN public.empleado e ON e.id_empleado=n.id_empleado
                        ORDER BY p.fecha_pago DESC, p.semana_inicio DESC, p.id_pago_nomina DESC;`)
        ]);
        res.json({ nominas: nominas.rows, pagos: pagos.rows });
    } catch (err) {
        console.error('Error al consultar nóminas:', err);
        res.status(500).json({ error: 'No se pudieron consultar las nóminas. Verifica que ejecutaste la migración SQL.' });
    }
});

app.post('/api/nominas', async (req, res) => {
    const idEmpleado = Number(req.body.id_empleado);
    const sueldo = Number(req.body.sueldo_mensual);
    if (!Number.isInteger(idEmpleado) || idEmpleado <= 0 || !Number.isFinite(sueldo) || sueldo <= 0)
        return res.status(400).json({ error: 'Selecciona un empleado y captura un sueldo mensual mayor a cero.' });
    try {
        const empleado = await pool.query(`SELECT id_empleado FROM public.empleado WHERE id_empleado=$1 AND LOWER(COALESCE(estado,'activo'))='activo'`, [idEmpleado]);
        if (!empleado.rowCount) return res.status(404).json({ error: 'El empleado no existe o está inactivo.' });
        const result = await pool.query(`INSERT INTO public.nomina (id_empleado,sueldo_mensual,activa)
            VALUES ($1,$2,true) ON CONFLICT (id_empleado) DO UPDATE SET sueldo_mensual=EXCLUDED.sueldo_mensual, activa=true
            RETURNING id_nomina,id_empleado,sueldo_mensual,ROUND((sueldo_mensual*12/52)::numeric,2) AS pago_semanal;`, [idEmpleado,sueldo]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al configurar nómina:', err);
        res.status(500).json({ error: 'No se pudo configurar la nómina.' });
    }
});

app.post('/api/nominas/:id/pagos', async (req, res) => {
    const idNomina = Number(req.params.id);
    const semanaSolicitada = String(req.body.semana_inicio || '').slice(0,10);
    const semana = /^\d{4}-\d{2}-\d{2}$/.test(semanaSolicitada)
        ? (() => { const d = new Date(`${semanaSolicitada}T00:00:00Z`); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0,10); })()
        : '';
    const metodo = String(req.body.metodo_pago || 'Transferencia').trim();
    if (!Number.isInteger(idNomina) || idNomina <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(semana))
        return res.status(400).json({ error: 'Nómina o fecha de semana no válida.' });
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const n = await client.query(`SELECT n.id_nomina,n.id_empleado,e.nombre,
                ROUND((n.sueldo_mensual*12/52)::numeric,2) AS pago_semanal
            FROM public.nomina n JOIN public.empleado e ON e.id_empleado=n.id_empleado
            WHERE n.id_nomina=$1 AND n.activa=true FOR UPDATE OF n`, [idNomina]);
        if (!n.rowCount) { const er=new Error('No se encontró una nómina activa.'); er.statusCode=404; throw er; }
        const monto = Number(n.rows[0].pago_semanal);
        const gasto = await client.query(`INSERT INTO public.gasto (concepto,categoria,monto,fecha_gasto,metodo_pago,observaciones)
            VALUES ($1,'Nómina',$2,CURRENT_DATE,$3,$4) RETURNING id_gasto`,
            [`Pago semanal - ${n.rows[0].nombre}`,monto,metodo,`Semana iniciada el ${semana}`]);
        const pago = await client.query(`INSERT INTO public.nomina_pago (id_nomina,semana_inicio,monto,id_gasto,metodo_pago)
            VALUES ($1,$2,$3,$4,$5) RETURNING id_pago_nomina,semana_inicio,monto`, [idNomina,semana,monto,gasto.rows[0].id_gasto,metodo]);
        await client.query('COMMIT');
        res.status(201).json(pago.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        if (err.code === '23505') return res.status(409).json({ error: 'Ese pago ya fue registrado para el empleado en esa semana.' });
        console.error('Error al registrar pago de nómina:', err);
        res.status(err.statusCode || 500).json({ error: err.statusCode ? err.message : 'No se pudo registrar el pago semanal.' });
    } finally { client.release(); }
});

// CRUD DE PROVEEDORES
// La fecha de inactivación permite aplicar la depuración automática a los 6 meses.
const prepararProveedores = async () => {
    await pool.query(`ALTER TABLE public.proveedor ADD COLUMN IF NOT EXISTS fecha_inactivacion TIMESTAMPTZ`);
    await pool.query(`
        UPDATE public.proveedor
        SET fecha_inactivacion = NOW()
        WHERE LOWER(COALESCE(estado, 'activo')) = 'inactivo'
          AND fecha_inactivacion IS NULL
    `);
};
const limpiarProveedoresInactivosVencidos = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const vencidos = await client.query(`
            SELECT p.id_proveedor
            FROM public.proveedor p
            WHERE LOWER(COALESCE(p.estado, 'activo')) = 'inactivo'
              AND p.fecha_inactivacion IS NOT NULL
              AND p.fecha_inactivacion <= NOW() - INTERVAL '6 months'
              AND NOT EXISTS (
                SELECT 1 FROM public.compra_proveedor c WHERE c.id_proveedor = p.id_proveedor
              )
            FOR UPDATE
        `);
        const ids = vencidos.rows.map(row => row.id_proveedor);
        if (ids.length) {
            await client.query('DELETE FROM public.proveedor_insumo WHERE id_proveedor = ANY($1::int[])', [ids]);
            await client.query('DELETE FROM public.proveedor WHERE id_proveedor = ANY($1::int[])', [ids]);
            console.log(`[Limpieza de proveedores] Se eliminaron ${ids.length} proveedor(es) inactivos por más de 6 meses.`);
        }
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('No se pudo ejecutar la limpieza de proveedores:', err.message);
    } finally {
        client.release();
    }
};
app.get('/api/proveedores', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.id_proveedor, p.nombre, p.contacto, p.telefono, p.fecha_inactivacion,
                   COALESCE(NULLIF(p.estado, ''), 'Activo') AS estado,
                   CASE
                     WHEN LOWER(COALESCE(p.estado, 'activo')) <> 'inactivo' OR p.fecha_inactivacion IS NULL THEN NULL
                     ELSE CONCAT(
                       GREATEST(EXTRACT(YEAR FROM age(NOW(), p.fecha_inactivacion))::int, 0), ' año(s), ',
                       GREATEST(EXTRACT(MONTH FROM age(NOW(), p.fecha_inactivacion))::int, 0), ' mes(es), ',
                       GREATEST(EXTRACT(DAY FROM age(NOW(), p.fecha_inactivacion))::int, 0), ' día(s)'
                     )
                   END AS tiempo_inactivo,
                   COUNT(pi.id_insumo)::int AS total_insumos
            FROM public.proveedor p
            LEFT JOIN public.proveedor_insumo pi ON pi.id_proveedor = p.id_proveedor
            GROUP BY p.id_proveedor, p.nombre, p.contacto, p.telefono, p.estado, p.fecha_inactivacion
            ORDER BY p.id_proveedor DESC;
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener proveedores:', err);
        res.status(500).json({ error: 'Error al obtener proveedores' });
    }
});

const validarNombreProveedor = (valor) => {
    const nombre = String(valor || '').normalize('NFC').trim().replace(/\s+/g, ' ');
    const letras = (nombre.match(/\p{L}/gu) || []).length;
    if (!nombre) return { valido: false, nombre, error: 'El nombre del proveedor es obligatorio.' };
    if (nombre.length > 150 || letras < 4) return { valido: false, nombre, error: 'El nombre debe contener al menos 4 letras (sin contar espacios) y no superar 150 caracteres.' };
    if (/[\p{C}<>={}\[\]\\]/u.test(nombre) || /[^\p{L}\p{N}\s]{3,}/u.test(nombre)) {
        return { valido: false, nombre, error: 'El nombre contiene caracteres o secuencias no permitidas. Evita usar símbolos repetidos como "...".' };
    }
    return { valido: true, nombre, error: '' };
};

const validarCorreoProveedor = (valor) => {
    const correo = String(valor || '');
    const formato = /^[A-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)*\.[A-Z]{2,63}$/i;
    const [local] = correo.split('@');
    const valido = correo.length <= 254 && !/\s/.test(correo) && formato.test(correo) &&
        !!local && !local.startsWith('.') && !local.endsWith('.') && !local.includes('..');
    return { valido, correo, error: 'Ingresa un correo electrónico válido, sin espacios (ejemplo: contacto@empresa.com).' };
};

const validarTelefonoProveedor = (valor) => {
    if (valor == null || String(valor).trim() === '') return { valido: false, telefono: null };
    const original = String(valor).trim();
    const digitos = original.replace(/\D/g, '');
    const valido = /^\+?\d{11,14}$/.test(original.replace(/[\s().-]/g, ''));
    return { valido, telefono: valido ? `+${digitos}` : null };
};

app.post('/api/proveedores', async (req, res) => {
    const nombreValidado = validarNombreProveedor(req.body.nombre);
    const correoValidado = validarCorreoProveedor(req.body.contacto);
    const telefonoValidado = validarTelefonoProveedor(req.body.telefono);
    const estado = String(req.body.estado || 'Activo').trim();
    if (!nombreValidado.valido) return res.status(400).json({ error: nombreValidado.error });
    if (!correoValidado.valido) return res.status(400).json({ error: correoValidado.error });
    if (!telefonoValidado.valido) return res.status(400).json({ error: 'El teléfono es obligatorio: incluye una lada de 1 a 4 dígitos y un número nacional de exactamente 10 dígitos.' });
    if (!['Activo', 'Inactivo'].includes(estado)) return res.status(400).json({ error: 'Estado no válido' });
    try {
        const result = await pool.query(`
            INSERT INTO public.proveedor (nombre, contacto, telefono, estado)
            VALUES ($1, $2, $3, $4)
            RETURNING id_proveedor, nombre, contacto, telefono, estado;
        `, [nombreValidado.nombre, correoValidado.correo, telefonoValidado.telefono, estado]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al registrar proveedor:', err);
        res.status(500).json({ error: 'Error al registrar proveedor' });
    }
});

app.put('/api/proveedores/:id', async (req, res) => {
    const id = Number(req.params.id);
    const nombreValidado = validarNombreProveedor(req.body.nombre);
    const correoValidado = validarCorreoProveedor(req.body.contacto);
    const telefonoValidado = validarTelefonoProveedor(req.body.telefono);
    const estado = String(req.body.estado || 'Activo').trim();
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Identificador no válido' });
    if (!nombreValidado.valido) return res.status(400).json({ error: nombreValidado.error });
    if (!correoValidado.valido) return res.status(400).json({ error: correoValidado.error });
    if (!telefonoValidado.valido) return res.status(400).json({ error: 'El teléfono es obligatorio: incluye una lada de 1 a 4 dígitos y un número nacional de exactamente 10 dígitos.' });
    if (!['Activo', 'Inactivo'].includes(estado)) return res.status(400).json({ error: 'Estado no válido' });
    try {
        const result = await pool.query(`
            UPDATE public.proveedor
            SET nombre = $1,
                contacto = $2,
                telefono = $3,
                fecha_inactivacion = CASE
                  WHEN $4 = 'Activo' THEN NULL
                  WHEN LOWER(COALESCE(estado, 'activo')) <> 'inactivo' THEN NOW()
                  ELSE COALESCE(fecha_inactivacion, NOW())
                END,
                estado = $4
            WHERE id_proveedor = $5
            RETURNING id_proveedor, nombre, contacto, telefono, estado, fecha_inactivacion;
        `, [nombreValidado.nombre, correoValidado.correo, telefonoValidado.telefono, estado, id]);
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
    const solicitanteIdUsuario = Number(req.body.solicitanteIdUsuario);
    const passwordActual = String(req.body.passwordActual || '');

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Identificador no válido.' });
    }
    if (!['Activo', 'Inactivo'].includes(estado)) {
        return res.status(400).json({ error: 'Estado no válido.' });
    }

    // Para desactivar se exige validar la sesión actual de un administrador activo.
    if (estado === 'Inactivo') {
        if (!Number.isInteger(solicitanteIdUsuario) || solicitanteIdUsuario <= 0) {
            return res.status(401).json({ error: 'No se pudo identificar tu sesión. Cierra sesión e inicia nuevamente.' });
        }
        if (!passwordActual) {
            return res.status(400).json({ error: 'Debes ingresar la contraseña de tu sesión actual.' });
        }

        try {
            const solicitanteRes = await pool.query(
                `SELECT u.password, e.id_rol, e.estado
                 FROM public.usuarios u
                 INNER JOIN public.empleado e ON e.id_empleado = u.id_empleado
                 WHERE u.id_usuario = $1`,
                [solicitanteIdUsuario]
            );

            if (!solicitanteRes.rowCount) {
                return res.status(401).json({ error: 'La sesión ya no es válida. Inicia sesión nuevamente.' });
            }

            const solicitante = solicitanteRes.rows[0];
            if (Number(solicitante.id_rol) !== 2 || String(solicitante.estado || '').trim().toLowerCase() !== 'activo') {
                return res.status(403).json({ error: 'Solo un administrador activo puede desactivar proveedores.' });
            }
            if (String(solicitante.password) !== passwordActual) {
                return res.status(401).json({ error: 'La contraseña de tu sesión actual es incorrecta.' });
            }
        } catch (err) {
            console.error('Error al validar la sesión para desactivar proveedor:', err);
            return res.status(500).json({ error: 'No se pudo validar tu sesión. Inténtalo nuevamente.' });
        }
    }

    try {
        // Se usa un booleano separado para evitar inferencias ambiguas de tipos en PostgreSQL.
        const result = await pool.query(`
            UPDATE public.proveedor
            SET fecha_inactivacion = CASE
                    WHEN $3::boolean THEN
                      CASE
                        WHEN LOWER(COALESCE(estado, 'activo')) = 'inactivo'
                          THEN COALESCE(fecha_inactivacion, NOW())
                        ELSE NOW()
                      END
                    ELSE NULL
                END,
                estado = $1
            WHERE id_proveedor = $2
            RETURNING id_proveedor, nombre, contacto, telefono, estado, fecha_inactivacion
        `, [estado, id, estado === 'Inactivo']);

        if (!result.rowCount) {
            return res.status(404).json({ error: 'No se encontró el proveedor.' });
        }
        return res.json({ success: true, ...result.rows[0] });
    } catch (err) {
        console.error('Error al cambiar estado del proveedor:', err);
        return res.status(500).json({
            error: 'No se pudo cambiar el estado del proveedor. Verifica la conexión con la base de datos e inténtalo de nuevo.'
        });
    }
});

// ==========================================
app.delete('/api/proveedores/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Identificador no válido.' });
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const compras = await client.query('SELECT 1 FROM public.compra_proveedor WHERE id_proveedor = $1 LIMIT 1', [id]);
        if (compras.rowCount) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'Este proveedor tiene compras registradas. No se puede eliminar sin afectar el historial; puedes mantenerlo inactivo.' });
        }
        const proveedor = await client.query('SELECT id_proveedor FROM public.proveedor WHERE id_proveedor = $1 FOR UPDATE', [id]);
        if (!proveedor.rowCount) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Proveedor no encontrado.' });
        }
        await client.query('DELETE FROM public.proveedor_insumo WHERE id_proveedor = $1', [id]);
        await client.query('DELETE FROM public.proveedor WHERE id_proveedor = $1', [id]);
        await client.query('COMMIT');
        res.json({ success: true, message: 'El proveedor se eliminó correctamente.' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al eliminar proveedor:', err);
        res.status(500).json({ error: 'No se pudo eliminar el proveedor.' });
    } finally {
        client.release();
    }
});

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

// Elimina únicamente las credenciales de cuentas inactivas durante 6 meses.
// Se conserva el registro del empleado para no romper el historial administrativo.
const eliminarAccesosInactivosVencidos = async () => {
    try {
        const result = await pool.query(`
            DELETE FROM public.usuarios u
            USING public.empleado e
            WHERE u.id_empleado = e.id_empleado
              AND LOWER(COALESCE(e.estado, 'activo')) = 'inactivo'
              AND e.fecha_inactivacion IS NOT NULL
              AND e.fecha_inactivacion <= NOW() - INTERVAL '6 months'
            RETURNING u.id_usuario, u.username, u.id_empleado
        `);
        if (result.rowCount > 0) {
            console.log(`[Limpieza de empleados] Se eliminaron ${result.rowCount} cuenta(s) de acceso por inactividad de 6 meses.`);
        }
    } catch (err) {
        // Si aún no se ha aplicado la migración SQL, el servidor sigue funcionando.
        console.error('No se pudo ejecutar la limpieza de cuentas inactivas:', err.message);
    }
};

// ==========================================
// CRUD DE EMPLEADOS Y USUARIOS (GERENCIA)
// ==========================================

// Teléfono internacional: guarda el código de país y el número en formato +<lada><número>.
// La lada es configurable; no se fuerza +52 ni una longitud nacional fija.
const validarTelefonoEmpleado = (valor, lada, numero) => {
    const ladaLimpia = String(lada ?? '').replace(/\D/g, '');
    const numeroLimpio = String(numero ?? '').replace(/\D/g, '');

    if (lada !== undefined || numero !== undefined) {
        const telefonoCapturado = Boolean(numeroLimpio || (valor && String(valor).trim()));
        if (!telefonoCapturado) return { valido: true, telefono: null };
        const valido = /^\d{1,4}$/.test(ladaLimpia) && /^\d{10}$/.test(numeroLimpio);
        return { valido, telefono: valido ? `+${ladaLimpia} ${numeroLimpio}` : null };
    }

    if (valor == null || String(valor).trim() === '') return { valido: true, telefono: null };
    const original = String(valor).trim();
    const partes = original.match(/^\+(\d{1,4})[\s-]+(\d{10})$/);
    if (partes) return { valido: true, telefono: `+${partes[1]} ${partes[2]}` };
    const digitos = original.replace(/\D/g, '');
    return { valido: false, telefono: null };
};

const validarPasswordEmpleadoServidor = (valor) => {
    const clave = String(valor ?? '');

    if (!clave) return 'La contraseña es obligatoria.';
    if (/\\s/.test(clave)) return 'La contraseña no puede contener espacios.';
    if (clave.length < 4 || clave.length > 8) {
        return 'La contraseña debe tener entre 4 y 8 caracteres.';
    }
    if ((clave.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g) || []).length < 4) {
        return 'La contraseña debe contener al menos 4 letras.';
    }

    const normalizada = clave.toLowerCase();

    if (/^(.)\\1{3,}$/.test(normalizada)) {
        return 'No uses el mismo carácter repetido.';
    }
    if (/^(password|contraseña|contrasena|admin|qwerty|usuario|abcdef|abcd|1234|1111|0000)$/i.test(normalizada)) {
        return 'Elige una contraseña menos predecible.';
    }

    for (let i = 0; i <= normalizada.length - 4; i++) {
        const a = normalizada.charCodeAt(i);
        const b = normalizada.charCodeAt(i + 1);
        const c = normalizada.charCodeAt(i + 2);
        const d = normalizada.charCodeAt(i + 3);

        if (
            (b === a + 1 && c === b + 1 && d === c + 1) ||
            (b === a - 1 && c === b - 1 && d === c - 1)
        ) {
            return 'No uses secuencias consecutivas como abcd o 1234.';
        }
    }

    return '';
};

const validarCredencialesEmpleado = (username, password) => {
    const usuario = String(username ?? '');
    const clave = String(password ?? '');
    if (!usuario) return 'El nombre de usuario es obligatorio.';
    if (/\s/.test(usuario)) return 'El usuario no puede contener espacios.';
    if (!/^[A-Za-z0-9._-]+$/.test(usuario)) return 'El usuario solo puede contener letras, números, punto, guion o guion bajo.';
    if ((usuario.match(/[A-Za-z]/g) || []).length < 6) return 'El nombre de usuario debe contener al menos 6 letras.';

    if (!clave) return 'La contraseña es obligatoria.';
    if (/\s/.test(clave)) return 'La contraseña no puede contener espacios.';
    if (clave.length < 4 || clave.length > 8) return 'La contraseña debe tener entre 4 y 8 caracteres.';
    if ((clave.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g) || []).length < 4) return 'La contraseña debe contener al menos 4 letras.';
    const normalizada = clave.toLowerCase();
    if (/^(.)\1{3,}$/.test(normalizada)) return 'No uses el mismo carácter repetido.';
    if (/^(password|contraseña|contrasena|admin|qwerty|usuario|abcdef|abcd|1234|1111|0000)$/i.test(normalizada)) return 'Elige una contraseña menos predecible.';
    for (let i = 0; i <= normalizada.length - 4; i++) {
        const a = normalizada.charCodeAt(i);
        const b = normalizada.charCodeAt(i + 1);
        const c = normalizada.charCodeAt(i + 2);
        const d = normalizada.charCodeAt(i + 3);
        if ((b === a + 1 && c === b + 1 && d === c + 1) ||
            (b === a - 1 && c === b - 1 && d === c - 1)) {
            return 'No uses secuencias consecutivas como abcd o 1234.';
        }
    }
    return '';
};


// Obtener lista de empleados con su rol y usuario asociado
app.get('/api/empleados', async (req, res) => {
    try {
        const query = `
            SELECT 
                e.id_empleado,
                e.nombre,
                e.telefono,
                e.estado,
                e.fecha_inactivacion,
                CASE
                  WHEN LOWER(COALESCE(e.estado, 'activo')) = 'inactivo' AND e.fecha_inactivacion IS NOT NULL THEN
                    CASE
                      WHEN EXTRACT(YEAR FROM age(NOW(), e.fecha_inactivacion)) >= 1 THEN
                        CONCAT(EXTRACT(YEAR FROM age(NOW(), e.fecha_inactivacion))::int, ' año(s), ', EXTRACT(MONTH FROM age(NOW(), e.fecha_inactivacion))::int, ' mes(es)')
                      WHEN EXTRACT(MONTH FROM age(NOW(), e.fecha_inactivacion)) >= 1 THEN
                        CONCAT(EXTRACT(MONTH FROM age(NOW(), e.fecha_inactivacion))::int, ' mes(es), ', EXTRACT(DAY FROM age(NOW(), e.fecha_inactivacion))::int, ' día(s)')
                      ELSE CONCAT(GREATEST(EXTRACT(DAY FROM age(NOW(), e.fecha_inactivacion))::int, 0), ' día(s)')
                    END
                  ELSE NULL
                END AS tiempo_inactivo,
                COALESCE(r.id_rol, 1) AS id_rol,
                COALESCE(r.nombre, 'Empleado') AS rol,
                u.id_usuario,
                u.username
            FROM public.empleado e
            LEFT JOIN public.rol r ON r.id_rol = e.id_rol
            LEFT JOIN public.usuarios u ON u.id_empleado = e.id_empleado
            ORDER BY e.id_empleado DESC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener empleados:', err);
        res.status(500).json({ error: 'Error al obtener empleados' });
    }
});

// Registrar un nuevo empleado
app.post('/api/empleados', async (req, res) => {
    const { nombre, telefono, id_rol, lada, telefonoNumero } = req.body;
    const nombreLimpio = String(nombre || '').trim();
    
    if (!nombreLimpio) {
        return res.status(400).json({ error: 'El nombre del empleado es obligatorio' });
    }
    const telefonoValidado = validarTelefonoEmpleado(telefono, lada, telefonoNumero);
    if (!telefonoValidado.valido) return res.status(400).json({ error: 'La lada debe tener de 1 a 4 dígitos y el número telefónico exactamente 10 dígitos.' });

    try {
        const result = await pool.query(
            `INSERT INTO public.empleado (nombre, telefono, id_rol, estado)
             VALUES ($1, $2, $3, 'Activo')
             RETURNING id_empleado, nombre, telefono, id_rol, estado`,
            [nombreLimpio, telefonoValidado.telefono, id_rol || 1]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al registrar empleado:', err);
        res.status(500).json({ error: 'Error al registrar el empleado' });
    }
});

// Actualizar datos del empleado y, opcionalmente, su contraseña de acceso.
app.put('/api/empleados/:id', async (req, res) => {
    const idEmpleado = Number(req.params.id);
    const nombre = String(req.body.nombre || '').trim();
    const telefonoRaw = req.body.telefono == null ? null : String(req.body.telefono).trim() || null;
    const telefonoValidado = validarTelefonoEmpleado(telefonoRaw, req.body.lada, req.body.telefonoNumero);
    const telefono = telefonoValidado.telefono;
    const idRol = Number(req.body.id_rol || 1);
    const nuevaPassword = req.body.password == null ? '' : String(req.body.password);

    if (!Number.isInteger(idEmpleado) || idEmpleado <= 0) {
        return res.status(400).json({ error: 'ID de empleado no válido.' });
    }
    if (!nombre) return res.status(400).json({ error: 'El nombre del empleado es obligatorio.' });
    if (!telefonoValidado.valido) return res.status(400).json({ error: 'La lada debe tener de 1 a 4 dígitos y el número telefónico exactamente 10 dígitos.' });
    if (!Number.isInteger(idRol) || idRol <= 0) return res.status(400).json({ error: 'Selecciona un rol válido.' });
    if (nuevaPassword) {
        const errorPassword = validarPasswordEmpleadoServidor(nuevaPassword);
        if (errorPassword) return res.status(400).json({ error: errorPassword });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const actual = await client.query(
            'SELECT id_empleado FROM public.empleado WHERE id_empleado = $1 FOR UPDATE',
            [idEmpleado]
        );
        if (!actual.rowCount) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Empleado no encontrado.' });
        }

        await client.query(
            'UPDATE public.empleado SET nombre = $1, telefono = $2, id_rol = $3 WHERE id_empleado = $4',
            [nombre, telefono, idRol, idEmpleado]
        );

        if (nuevaPassword) {
            const usuario = await client.query(
                'SELECT id_usuario FROM public.usuarios WHERE id_empleado = $1 FOR UPDATE',
                [idEmpleado]
            );
            if (!usuario.rowCount) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Este empleado todavía no tiene una cuenta de acceso. Primero crea su usuario.' });
            }
            // Se conserva el formato de contraseña que utiliza actualmente el inicio de sesión del proyecto.
            await client.query(
                'UPDATE public.usuarios SET password = $1 WHERE id_empleado = $2',
                [nuevaPassword, idEmpleado]
            );
        }

        await client.query('COMMIT');
        res.json({ success: true, message: 'Empleado actualizado correctamente.' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al actualizar empleado:', err);
        res.status(500).json({ error: 'Error al actualizar el empleado.' });
    } finally {
        client.release();
    }
});

// Eliminar empleado y sus credenciales. Si existen registros históricos relacionados
// que impiden borrar al empleado, la transacción se revierte y se conserva todo.
app.delete('/api/empleados/:id', async (req, res) => {
    const idEmpleado = Number(req.params.id);
    const solicitanteIdUsuario = Number(req.body?.solicitanteIdUsuario);

    if (!Number.isInteger(idEmpleado) || idEmpleado <= 0) {
        return res.status(400).json({ error: 'ID de empleado no válido.' });
    }
    if (!Number.isInteger(solicitanteIdUsuario) || solicitanteIdUsuario <= 0) {
        return res.status(401).json({ error: 'No se pudo identificar al administrador que solicita la eliminación.' });
    }

    const client = await pool.connect();
    let transaccionAbierta = false;
    try {
        await client.query('BEGIN');
        transaccionAbierta = true;

        // Serializa las eliminaciones de administradores para evitar que dos
        // solicitudes simultáneas dejen al sistema con menos de dos.
        await client.query('SELECT pg_advisory_xact_lock(72190418)');

        const solicitante = await client.query(`
            SELECT e.id_empleado
            FROM public.usuarios u
            INNER JOIN public.empleado e ON e.id_empleado = u.id_empleado
            LEFT JOIN public.rol r ON r.id_rol = e.id_rol
            WHERE u.id_usuario = $1
              AND LOWER(COALESCE(e.estado, 'activo')) = 'activo'
              AND (e.id_rol = 2 OR LOWER(COALESCE(r.nombre, '')) = 'administrador')
            FOR UPDATE OF e
        `, [solicitanteIdUsuario]);

        if (!solicitante.rowCount) {
            await client.query('ROLLBACK');
            transaccionAbierta = false;
            return res.status(403).json({ error: 'Solo un administrador activo puede eliminar empleados.' });
        }

        const objetivo = await client.query(`
            SELECT e.id_empleado, e.id_rol, r.nombre AS rol
            FROM public.empleado e
            LEFT JOIN public.rol r ON r.id_rol = e.id_rol
            WHERE e.id_empleado = $1
            FOR UPDATE OF e
        `, [idEmpleado]);

        if (!objetivo.rowCount) {
            await client.query('ROLLBACK');
            transaccionAbierta = false;
            return res.status(404).json({ error: 'Empleado no encontrado.' });
        }

        if (Number(objetivo.rows[0].id_empleado) === Number(solicitante.rows[0].id_empleado)) {
            await client.query('ROLLBACK');
            transaccionAbierta = false;
            return res.status(403).json({ error: 'No puedes eliminar tu propia cuenta de administrador.' });
        }

        const esAdministradorObjetivo = Number(objetivo.rows[0].id_rol) === 2
            || String(objetivo.rows[0].rol || '').trim().toLowerCase() === 'administrador';

        if (esAdministradorObjetivo) {
            const conteo = await client.query(`
                SELECT COUNT(DISTINCT e.id_empleado)::int AS total
                FROM public.empleado e
                LEFT JOIN public.rol r ON r.id_rol = e.id_rol
                WHERE LOWER(COALESCE(e.estado, 'activo')) = 'activo'
                  AND (e.id_rol = 2 OR LOWER(COALESCE(r.nombre, '')) = 'administrador')
            `);

            if (Number(conteo.rows[0].total) <= 2) {
                await client.query('ROLLBACK');
                transaccionAbierta = false;
                return res.status(409).json({
                    error: 'No se puede eliminar este administrador porque deben permanecer al menos 2 administradores activos en el sistema.'
                });
            }
        }

        await client.query('DELETE FROM public.usuarios WHERE id_empleado = $1', [idEmpleado]);
        await client.query('DELETE FROM public.empleado WHERE id_empleado = $1', [idEmpleado]);
        await client.query('COMMIT');
        transaccionAbierta = false;
        res.json({ success: true, message: 'Empleado y credenciales eliminados.' });
    } catch (err) {
        if (transaccionAbierta) await client.query('ROLLBACK');
        console.error('Error al eliminar empleado:', err);
        res.status(409).json({ error: 'No se puede eliminar porque el empleado tiene registros relacionados (por ejemplo, nómina o movimientos). Se conservaron sus datos.' });
    } finally {
        client.release();
    }
});

// Crear usuario y contraseña para un empleado existente
app.post('/api/empleados/:id/usuario', async (req, res) => {
    const id_empleado = Number(req.params.id);
    const username = String(req.body.username ?? '');
    const password = String(req.body.password ?? '');

    if (!Number.isInteger(id_empleado) || id_empleado <= 0) {
        return res.status(400).json({ error: 'ID de empleado no válido' });
    }
    const errorCredenciales = validarCredencialesEmpleado(username, password);
    if (errorCredenciales) return res.status(400).json({ error: errorCredenciales });

    try {
        const existe = await pool.query(
            'SELECT id_usuario FROM public.usuarios WHERE username = $1',
            [username]
        );
        if (existe.rows.length > 0) {
            return res.status(400).json({ error: 'El nombre de usuario ya está registrado' });
        }

        const result = await pool.query(
            `INSERT INTO public.usuarios (username, password, id_empleado)
             VALUES ($1, $2, $3)
             RETURNING id_usuario, username, id_empleado`,
            [username, password, id_empleado]
        );

        res.status(201).json({ success: true, usuario: result.rows[0] });
    } catch (err) {
        console.error('Error al crear usuario:', err);
        res.status(500).json({ error: 'Error al crear el acceso de usuario' });
    }
});

app.patch('/api/empleados/:id/estado', async (req, res) => {
  const id_empleado = Number(req.params.id);
  const estado = String(req.body.estado || '');
  const solicitanteIdUsuario = Number(req.body.solicitanteIdUsuario);
  const passwordActual = String(req.body.passwordActual || '');

  if (!Number.isInteger(id_empleado) || id_empleado <= 0) return res.status(400).json({ error: 'ID de empleado no válido.' });
  if (!['Activo', 'Inactivo'].includes(estado)) return res.status(400).json({ error: 'Estado no válido.' });
  if (!Number.isInteger(solicitanteIdUsuario) || solicitanteIdUsuario <= 0) return res.status(401).json({ error: 'No se pudo identificar tu sesión. Cierra sesión e inicia nuevamente.' });
  if (estado === 'Inactivo' && !passwordActual) return res.status(400).json({ error: 'Debes ingresar la contraseña de tu sesión actual.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Bloquea primero las filas de administradores en un orden fijo.
    // Así las operaciones simultáneas no pueden desactivar dos administradores a la vez.
    await client.query(`SELECT id_empleado FROM public.empleado WHERE id_rol = 2 ORDER BY id_empleado FOR UPDATE`);

    const solicitanteRes = await client.query(
      `SELECT u.id_usuario, u.password, e.id_empleado, e.estado, e.id_rol
       FROM public.usuarios u
       JOIN public.empleado e ON e.id_empleado = u.id_empleado
       WHERE u.id_usuario = $1`,
      [solicitanteIdUsuario]
    );
    if (!solicitanteRes.rowCount) {
      await client.query('ROLLBACK');
      return res.status(401).json({ error: 'La sesión ya no es válida. Inicia sesión nuevamente.' });
    }
    const solicitante = solicitanteRes.rows[0];
    if (Number(solicitante.id_rol) !== 2 || String(solicitante.estado || '').toLowerCase() !== 'activo') {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Solo un administrador activo puede cambiar estados de empleados.' });
    }
    if (estado === 'Inactivo' && solicitante.password !== passwordActual) {
      await client.query('ROLLBACK');
      return res.status(401).json({ error: 'La contraseña de tu sesión actual es incorrecta.' });
    }

    const objetivoRes = await client.query(
      `SELECT id_empleado, nombre, estado, id_rol FROM public.empleado WHERE id_empleado = $1 FOR UPDATE`,
      [id_empleado]
    );
    if (!objetivoRes.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Empleado no encontrado.' });
    }
    const objetivo = objetivoRes.rows[0];

    if (estado === 'Inactivo') {
      if (Number(objetivo.id_rol) === 2 && Number(objetivo.id_empleado) === Number(solicitante.id_empleado)) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'No puedes desactivar tu propio acceso de administrador.' });
      }
      if (Number(objetivo.id_rol) === 2 && String(objetivo.estado || '').toLowerCase() === 'activo') {
        const countRes = await client.query(
          `SELECT COUNT(*)::int AS total FROM public.empleado
           WHERE id_rol = 2 AND LOWER(COALESCE(estado, 'activo')) = 'activo'`
        );
        const total = Number(countRes.rows[0].total || 0);
        if (total <= 2) {
          await client.query('ROLLBACK');
          return res.status(409).json({ error: `No puedes desactivar a este administrador. Deben permanecer al menos 2 administradores activos y actualmente hay ${total}.` });
        }
      }
    }

    const result = await client.query(
      `UPDATE public.empleado
       SET estado = $1,
           fecha_inactivacion = CASE
             WHEN $3::boolean THEN COALESCE(fecha_inactivacion, NOW())
             ELSE NULL
           END
       WHERE id_empleado = $2
       RETURNING id_empleado, nombre, estado, fecha_inactivacion, id_rol`,
      [estado, id_empleado, estado === 'Inactivo']
    );
    await client.query('COMMIT');
    return res.json({ success: true, empleado: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Error al cambiar el estado del empleado:', err);
    return res.status(500).json({ error: 'Error al cambiar el estado del empleado.' });
  } finally {
    client.release();
  }
});

// ==========================================
// OBTENER PANEL DE REPORTES Y ESTADÍSTICAS (GERENCIA)
// ==========================================
app.get('/api/reportes', async (req, res) => {
    try {
        const { fechaInicio = '', fechaFin = '' } = req.query;
        const formatoFechaValido = valor => !valor || /^\d{4}-\d{2}-\d{2}$/.test(String(valor));

        if (!formatoFechaValido(fechaInicio) || !formatoFechaValido(fechaFin)) {
            return res.status(400).json({ error: 'Formato de fecha no válido. Utiliza AAAA-MM-DD.' });
        }
        if (fechaInicio && Number.isNaN(Date.parse(`${fechaInicio}T00:00:00`))) {
            return res.status(400).json({ error: 'La fecha inicial no es válida.' });
        }
        if (fechaFin && Number.isNaN(Date.parse(`${fechaFin}T00:00:00`))) {
            return res.status(400).json({ error: 'La fecha final no es válida.' });
        }
        if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
            return res.status(400).json({ error: 'La fecha inicial no puede ser posterior a la fecha final.' });
        }

        const hoyResult = await pool.query("SELECT CURRENT_DATE::text AS hoy");
        const hoy = hoyResult.rows[0].hoy;
        if ((fechaInicio && fechaInicio > hoy) || (fechaFin && fechaFin > hoy)) {
            return res.status(400).json({ error: 'No se permiten fechas futuras.' });
        }

        const parametros = [fechaInicio || null, fechaFin || null];

        // 1. Resumen financiero del periodo solicitado.
        const resumenQuery = `
            SELECT
                COALESCE(SUM(total), 0) AS total_ingresos,
                COUNT(id_venta) AS total_ventas,
                COALESCE(AVG(total), 0) AS ticket_promedio,
                COALESCE(SUM(CASE WHEN lower(metodo_pago) = 'efectivo' THEN total ELSE 0 END), 0) AS ingresos_efectivo,
                COALESCE(SUM(CASE WHEN lower(metodo_pago) = 'tarjeta' THEN total ELSE 0 END), 0) AS ingresos_tarjeta
            FROM public.ventas
            WHERE ($1::date IS NULL OR fecha_hora::date >= $1::date)
              AND ($2::date IS NULL OR fecha_hora::date <= $2::date);
        `;
        const resumenRes = await pool.query(resumenQuery, parametros);

        // 2. Top 5 productos vendidos dentro del mismo periodo.
        const topProductosQuery = `
            SELECT
                p.nombre,
                COALESCE(c.nombre, 'Sin categoría') AS categoria,
                SUM(dv.cantidad) AS total_unidades,
                SUM(dv.cantidad * dv.precio_unitario) AS total_recaudado
            FROM public.detalle_ventas dv
            JOIN public.ventas v ON v.id_venta = dv.id_venta
            JOIN public.productos p ON dv.id_producto = p.id_producto
            LEFT JOIN public.categorias c ON p.id_categoria = c.id_categoria
            WHERE ($1::date IS NULL OR v.fecha_hora::date >= $1::date)
              AND ($2::date IS NULL OR v.fecha_hora::date <= $2::date)
            GROUP BY p.id_producto, p.nombre, c.nombre
            ORDER BY total_unidades DESC
            LIMIT 5;
        `;
        const topProductosRes = await pool.query(topProductosQuery, parametros);

        // 3. Ventas por categoría dentro del mismo periodo.
        const porCategoriaQuery = `
            SELECT
                COALESCE(c.nombre, 'General') AS categoria,
                SUM(dv.cantidad) AS unidades,
                SUM(dv.cantidad * dv.precio_unitario) AS total
            FROM public.detalle_ventas dv
            JOIN public.ventas v ON v.id_venta = dv.id_venta
            JOIN public.productos p ON dv.id_producto = p.id_producto
            LEFT JOIN public.categorias c ON p.id_categoria = c.id_categoria
            WHERE ($1::date IS NULL OR v.fecha_hora::date >= $1::date)
              AND ($2::date IS NULL OR v.fecha_hora::date <= $2::date)
            GROUP BY c.id_categoria, c.nombre
            ORDER BY total DESC;
        `;
        const porCategoriaRes = await pool.query(porCategoriaQuery, parametros);

        const resumen = resumenRes.rows[0];
        res.json({
            resumen: {
                total_ingresos: parseFloat(resumen.total_ingresos),
                total_ventas: parseInt(resumen.total_ventas, 10),
                ticket_promedio: parseFloat(resumen.ticket_promedio),
                ingresos_efectivo: parseFloat(resumen.ingresos_efectivo),
                ingresos_tarjeta: parseFloat(resumen.ingresos_tarjeta)
            },
            top_productos: topProductosRes.rows.map(r => ({
                nombre: r.nombre,
                categoria: r.categoria,
                total_unidades: parseInt(r.total_unidades, 10),
                total_recaudado: parseFloat(r.total_recaudado)
            })),
            ventas_categoria: porCategoriaRes.rows.map(r => ({
                categoria: r.categoria,
                unidades: parseInt(r.unidades, 10),
                total: parseFloat(r.total)
            }))
        });
    } catch (err) {
        console.error('Error al generar reportes:', err);
        res.status(500).json({ error: 'Error al generar el panel de reportes' });
    }
});

// Ruta principal SPA: debe ir después de todas las rutas /api para no interceptarlas.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    try {
        await pool.query(`
            ALTER TABLE public.ventas
            ADD COLUMN IF NOT EXISTS id_usuario INTEGER
            REFERENCES public.usuarios(id_usuario);
        `);
        await prepararProveedores();
        await limpiarProveedoresInactivosVencidos();
    } catch (err) {
        console.error('No se pudo preparar la fecha de inactivación de proveedores:', err.message);
    }
    eliminarAccesosInactivosVencidos();
    setInterval(eliminarAccesosInactivosVencidos, 60 * 60 * 1000);
    setInterval(limpiarProveedoresInactivosVencidos, 60 * 60 * 1000);
});
