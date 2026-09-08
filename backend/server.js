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
        const query = `SELECT id_usuario, username FROM public.usuarios WHERE username = $1 AND password = $2`;
        const result = await pool.query(query, [username, password]);

        if (result.rows.length > 0) {
            res.json({ success: true, user: result.rows[0] });
        } else {
            res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error en el servidor al intentar iniciar sesión' });
    }
});

// Obtener categorías y productos desde la BD
app.get('/api/menu', async (req, res) => {
    try {
        const query = `
            SELECT p.id_producto, p.nombre, p.precio, c.nombre AS categoria
            FROM public.productos p
            JOIN public.categorias c ON p.id_categoria = c.id_categoria
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
                precio: parseFloat(row.precio)
            });
        });

        res.json(Object.values(categoriasMap));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener el menú' });
    }
});

// Registrar venta en PostgreSQL
app.post('/api/ventas', async (req, res) => {
    const { total, metodo_pago, detalles } = req.body;
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