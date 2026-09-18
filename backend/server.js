const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Servir la carpeta frontend completa como archivos estáticos
app.use(express.static(path.join(__dirname, '../frontend')));

// Endpoint de autenticación (Login)
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

      LEFT JOIN empleado e
        ON e.id_empleado = u.id_empleado

      LEFT JOIN rol r
        ON r.id_rol = e.id_rol

      WHERE
        u.username = $1
        AND u.password = $2
      `,
      [
        username,
        password
      ]
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

// Obtener categorías y productos desde la BD
app.get('/api/menu', async (req, res) => {
    try {

        const query = `
            SELECT
                p.id_producto,
                p.nombre,
                p.precio,
                c.nombre AS categoria,
                COALESCE(i.stock, 0) AS stock,
                COALESCE(i.stock_minimo, 0) AS stock_minimo
            FROM public.productos p
            JOIN public.categorias c
                ON p.id_categoria = c.id_categoria
            LEFT JOIN public.inventario i
                ON i.id_producto = p.id_producto
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

        res.json(
            Object.values(categoriasMap)
        );

    } catch (err) {

        console.error(
            'Error al obtener el menú:',
            err
        );

        res.status(500).json({
            error: 'Error al obtener el menú'
        });

    }
});
// Registrar venta en PostgreSQL
app.post('/api/ventas', async (req, res) => {
    const { total, metodo_pago, efectivo_recibido, cambio_entregado, detalles } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const ventaRes = await client.query(
            `INSERT INTO public.ventas (total, metodo_pago) VALUES ($1, $2) RETURNING id_venta`,
            [total, metodo_pago]
        );
        const id_venta = ventaRes.rows[0].id_venta;

        for (const item of detalles) {
            await client.query(
                `INSERT INTO public.detalle_ventas (id_venta, id_producto, cantidad, precio_unitario)
                 VALUES ($1, $2, $3, $4)`,
                [id_venta, item.id_producto, item.cantidad, item.precio]
            );
        }

        await client.query('COMMIT');
        res.json({ status: 'ok', id_venta });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Error al registrar la venta' });
    } finally {
        client.release();
    }
});

// Ruta principal para servir la aplicación SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor ejecutándose en http://localhost:${PORT}`));