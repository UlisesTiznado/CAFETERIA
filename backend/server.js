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
                COALESCE(MIN(FLOOR(i.stock / r.cantidad_usada)), 0) AS stock,
                0 AS stock_minimo
            FROM public.productos p
            JOIN public.categorias c ON p.id_categoria = c.id_categoria
            LEFT JOIN public.receta r ON p.id_producto = r.id_producto
            LEFT JOIN public.insumo i ON r.id_insumo = i.id_insumo
            WHERE p.estado = true
            GROUP BY p.id_producto, p.nombre, p.precio, c.nombre, c.id_categoria
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
                stock: parseInt(row.stock),
                stock_minimo: parseInt(row.stock_minimo)
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
        res.status(500).json({ error: 'Error al registrar la venta y actualizar existencias' });
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