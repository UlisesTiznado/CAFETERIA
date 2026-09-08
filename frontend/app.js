const { useState, useEffect } = React;

function App() {
  const [usuario, setUsuario] = useState(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [menu, setMenu] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [errorLogin, setErrorLogin] = useState('');

  useEffect(() => {
    if (usuario) {
      cargarMenu();
    }
  }, [usuario]);

  const cargarMenu = () => {
    fetch('/api/menu')
      .then(res => res.json())
      .then(data => setMenu(data))
      .catch(err => console.error('Error al cargar el menú:', err));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorLogin('');
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setUsuario(data.user);
      } else {
        setErrorLogin(data.message || 'Error de inicio de sesión');
      }
    } catch (err) {
      console.error(err);
      setErrorLogin('No se pudo conectar con el servidor');
    }
  };

  const agregarAlCarrito = (producto) => {
    setCarrito(prev => {
      const existe = prev.find(item => item.id_producto === producto.id_producto);
      if (existe) {
        return prev.map(item =>
          item.id_producto === producto.id_producto
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const cambiarCantidad = (id_producto, delta) => {
    setCarrito(prev => prev.map(item => {
      if (item.id_producto === id_producto) {
        const nuevaCant = item.cantidad + delta;
        return nuevaCant > 0 ? { ...item, cantidad: nuevaCant } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

  const procesarVenta = async () => {
    if (carrito.length === 0) return alert('El carrito está vacío');

    const ventaData = {
      total: total,
      metodo_pago: metodoPago,
      detalles: carrito.map(item => ({
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio: item.precio
      }))
    };

    try {
      const response = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ventaData)
      });

      if (response.ok) {
        alert('Venta registrada con éxito');
        setCarrito([]);
      } else {
        alert('Error al registrar la venta');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión con el servidor');
    }
  };

  if (!usuario) {
    return (
      <div style={{ maxWidth: '360px', margin: '80px auto', padding: '24px', background: '#fff', border: '1px solid #d8cfc2', borderRadius: '12px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '800' }}>Cafetería Origen</h2>
        <p style={{ color: '#8a8176', marginBottom: '20px' }}>Inicia sesión para continuar</p>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Usuario"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #d8cfc2' }}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #d8cfc2' }}
          />
          {errorLogin && <p style={{ color: 'red', fontSize: '13px' }}>{errorLogin}</p>}
          <button type="submit" className="charge-btn" style={{ marginTop: '10px' }}>Entrar</button>
        </form>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="topbar">
        <div>
          <h1 className="brand-title">Cafetería Origen</h1>
          <span className="brand-sub">Punto de Venta</span>
        </div>
        <div>
          <span className="user-badge">{usuario.username}</span>
          <button className="logout-btn" onClick={() => setUsuario(null)}>Cerrar Sesión</button>
        </div>
      </header>

      <div className="pos-layout">
        <main className="menu-section">
          {menu.map((cat, idx) => (
            <div key={idx}>
              <h2 className="category-title">{cat.categoria}</h2>
              <div className="products-grid">
                {cat.productos.map(p => (
                  <div key={p.id_producto} className="product-card" onClick={() => agregarAlCarrito(p)}>
                    <strong>{p.nombre}</strong>
                    <span className="product-price">${p.precio.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </main>

        <aside className="order-sidebar">
          <div className="order-card">
            <h2 className="order-title">Orden Actual</h2>
            <div className="cart-items">
              {carrito.length === 0 ? (
                <p style={{ color: '#8a8176', fontSize: '13px', textAlign: 'center', marginTop: '40px' }}>
                  Selecciona productos del menú
                </p>
              ) : (
                carrito.map(item => (
                  <div key={item.id_producto} className="cart-item">
                    <div className="cart-item-info">
                      <strong>{item.nombre}</strong>
                      <small>${item.precio.toFixed(2)} x {item.cantidad}</small>
                    </div>
                    <div>
                      <button className="qty-btn" onClick={() => cambiarCantidad(item.id_producto, -1)}>-</button>
                      <span style={{ margin: '0 8px', fontWeight: 'bold' }}>{item.cantidad}</span>
                      <button className="qty-btn" onClick={() => cambiarCantidad(item.id_producto, 1)}>+</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {carrito.length > 0 && (
              <div className="cart-summary">
                <div className="total-text">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <select className="select-pago" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta">Tarjeta</option>
                </select>
                <button className="charge-btn" onClick={procesarVenta}>
                  Cobrar (${total.toFixed(2)})
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);