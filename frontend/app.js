const { useState, useEffect } = React;

function App() {

  /* ==================================================
     ESTADOS
  ================================================== */

  const [usuario, setUsuario] = useState(() => {
    const usuarioGuardado = localStorage.getItem('usuario');
    return usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  });

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [menu, setMenu] = useState([]);
  const [inventarioData, setInventarioData] = useState([]);

  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  const [filtroInventario, setFiltroInventario] = useState('todos');
  const [ordenInventario, setOrdenInventario] = useState('predeterminado');
  const [valorFiltroInventario, setValorFiltroInventario] = useState('todos');

  const [carrito, setCarrito] = useState([]);
  const [metodoPago, setMetodoPago] = useState('Efectivo');

  const [menuGerenciaAbierto, setMenuGerenciaAbierto] = useState(false);
  const [vistaActual, setVistaActual] = useState('pos');

  const [mostrarPagoEfectivo, setMostrarPagoEfectivo] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [mostrarConfirmarSalida, setMostrarConfirmarSalida] = useState(false);

  const [efectivoRecibido, setEfectivoRecibido] = useState('');
  const [mostrarVentaExitosa, setMostrarVentaExitosa] = useState(false);
  const [notificacionStock, setNotificacionStock] = useState(null);
  const [ultimaVenta, setUltimaVenta] = useState(null);
  const [ventasGerencia, setVentasGerencia] = useState([]);
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null);

  // Estados para Personalización
  const [productoPersonalizando, setProductoPersonalizando] = useState(null);
  const [tamanioSeleccionado, setTamanioSeleccionado] = useState(null);
  const [saborSeleccionado, setSaborSeleccionado] = useState('');


  /* ==================================================
     USUARIO / ROL
  ================================================== */

  const esAdministrador =
    usuario?.id_rol === 2 ||
    usuario?.rol === 'Administrador';


  /* ==================================================
     CARGAR MENÚ E INVENTARIO
  ================================================== */

  useEffect(() => {
    if (usuario) {
      cargarMenu();
      cargarInventario();
    }
  }, [usuario]);


  const cargarMenu = async () => {
    try {
      const response = await fetch('/api/menu', { cache: 'no-store' });
      const data = await response.json();
      setMenu(data);
      if (data.length > 0) {
        const primeraCategoria = data[0].id_categoria ?? data[0].categoria;
        setCategoriaSeleccionada(primeraCategoria);
      }
    } catch (error) {
      console.error('Error al cargar el menú:', error);
    }
  };

  const cargarInventario = async () => {
    try {
      const response = await fetch('/api/inventario', { cache: 'no-store' });
      const data = await response.json();
      setInventarioData(data);
    } catch (error) {
      console.error('Error al cargar el inventario:', error);
    }
  };

  const cargarVentasGerencia = async () => {
    try {
      const response = await fetch('/api/ventas', { cache: 'no-store' });
      const data = await response.json();
      setVentasGerencia(data);
    } catch (error) {
      console.error('Error al cargar ventas:', error);
    }
  };


  /* ==================================================
     ACTUALIZAR INVENTARIO (CRUD / EDITAR)
  ================================================== */
  const actualizarInsumoInventario = async (id_insumo, nuevoStock, nuevoMinStock) => {
    try {
      const response = await fetch(`/api/inventario/${id_insumo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stock: Number(nuevoStock),
          min_stock: Number(nuevoMinStock)
        })
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Error al actualizar el insumo');
        return;
      }
      cargarInventario();
      cargarMenu();
    } catch (err) {
      console.error('Error de conexión al actualizar inventario:', err);
      alert('Error de conexión con el servidor');
    }
  };


  /* ==================================================
     LOGIN
  ================================================== */

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Usuario o contraseña incorrectos');
        return;
      }
      setUsuario(data.user);
      localStorage.setItem('usuario', JSON.stringify(data.user));
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      setError('No se pudo conectar con el servidor');
    }
  };


  /* ==================================================
     CARRITO Y PERSONALIZACIÓN
  ================================================== */

  const mostrarNotificacionStock = (producto, stock) => {
    setNotificacionStock({
      producto: producto.nombre,
      stock: stock
    });
    setTimeout(() => {
      setNotificacionStock(null);
    }, 3000);
  };

 const abrirPersonalizacion = (producto) => {
    setProductoPersonalizando(producto);
    const nombreLower = (producto.nombre || '').toLowerCase();
    const categoriaLower = (producto.categoria || '').toLowerCase();

    // Detectar si es cualquier bebida, café, frappé o bebida fría
    const esBebida = categoriaLower.includes('bebida') || 
                     categoriaLower.includes('café') || 
                     categoriaLower.includes('cafe') || 
                     nombreLower.includes('té') || 
                     nombreLower.includes('te') || 
                     nombreLower.includes('latte') || 
                     nombreLower.includes('americano') || 
                     nombreLower.includes('frappe') || 
                     nombreLower.includes('cappuccino') ||
                     nombreLower.includes('frio') ||
                     nombreLower.includes('helado') ||
                     nombreLower.includes('frappé');

    if (esBebida) {
      setSaborSeleccionado('Regular');
      setTamanioSeleccionado({ nombre: 'Chico (12 oz)', precio: Number(producto.precio) });
    } else {
      setSaborSeleccionado('Chocolate');
      setTamanioSeleccionado({ nombre: 'Porción Individual', precio: Number(producto.precio) });
    }
  };
 const confirmarAgregarPersonalizado = () => {
    if (!productoPersonalizando) return;

    const nombreLower = (productoPersonalizando.nombre || '').toLowerCase();
    const esPastel = nombreLower.includes('pastel') || nombreLower.includes('rebanada') || nombreLower.includes('pay');

    const customizationText = esPastel
      ? `Sabor: ${saborSeleccionado}`
      : `${saborSeleccionado} - ${tamanioSeleccionado?.nombre || 'Chico (12 oz)'}`;

    // Bandera explícita de bebida fría
    const esFria = nombreLower.includes('frappe') || 
                   nombreLower.includes('frappé') || 
                   nombreLower.includes('helado') || 
                   nombreLower.includes('iced') || 
                   nombreLower.includes('fría') || 
                   nombreLower.includes('fria') || 
                   nombreLower.includes('frio');

    const itemConPersonalizacion = {
      ...productoPersonalizando,
      precio: tamanioSeleccionado ? tamanioSeleccionado.precio : productoPersonalizando.precio,
      customization: customizationText,
      es_fria: esFria // <--- Propiedad enviada
    };

    agregarAlCarritoPersonalizado(itemConPersonalizacion);
    setProductoPersonalizando(null);
  };

  const agregarAlCarritoPersonalizado = (productoPersonalizado) => {
    const stockDisponible = Number(productoPersonalizado.stock || 0);
    if (stockDisponible <= 0) {
      mostrarNotificacionStock(productoPersonalizado, 0);
      return;
    }

    setCarrito(prev => {
      const existe = prev.find(
        item => item.id_producto === productoPersonalizado.id_producto && item.customization === productoPersonalizado.customization
      );

      if (existe) {
        if (existe.cantidad >= stockDisponible) {
          mostrarNotificacionStock(productoPersonalizado, stockDisponible);
          return prev;
        }
        return prev.map(item =>
          item.id_producto === productoPersonalizado.id_producto && item.customization === productoPersonalizado.customization
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }

      return [...prev, { ...productoPersonalizado, cantidad: 1 }];
    });
  };

  const cambiarCantidad = (id_producto, delta, customization) => {
    setCarrito(prev =>
      prev
        .map(item => {
          if (item.id_producto === id_producto && item.customization === customization) {
            const nuevaCantidad = item.cantidad + delta;
            const stockDisponible = Number(item.stock || 0);

            if (delta > 0 && nuevaCantidad > stockDisponible) {
              mostrarNotificacionStock(item, stockDisponible);
              return item;
            }
            return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const eliminarProducto = (id_producto, customization) => {
    setCarrito(prev => prev.filter(item => !(item.id_producto === id_producto && item.customization === customization)));
  };


  /* ==================================================
     TOTALES
  ================================================== */

  const total = carrito.reduce((sum, item) => sum + Number(item.precio) * item.cantidad, 0);
  const subtotal = total / 1.16;
  const iva = total - subtotal;
  const cantidadArticulos = carrito.reduce((sum, item) => sum + item.cantidad, 0);

  const efectivoNumero = Number(efectivoRecibido || 0);
  const cambio = Math.max(efectivoNumero - total, 0);
  const efectivoSuficiente = efectivoNumero >= total;

  const money = (valor) => {
    return Number(valor || 0).toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN'
    });
  };


  /* ==================================================
     CATEGORÍA Y FILTROS
  ================================================== */

  const categoriaActual = menu.find(cat => {
    const idCategoria = cat.id_categoria ?? cat.categoria;
    return idCategoria === categoriaSeleccionada;
  }) || menu[0];

  const productosFiltrados = (() => {
    const textoBusqueda = busqueda.trim().toLowerCase();
    const productosCategoria = categoriaActual?.productos || [];
    if (!textoBusqueda) return productosCategoria;
    return productosCategoria.filter(producto => producto.nombre.toLowerCase().includes(textoBusqueda));
  })();

  const productosInventario = (() => {
    const textoBusqueda = busqueda.trim().toLowerCase();
    let insumos = [...inventarioData];
    if (textoBusqueda) {
      insumos = insumos.filter(item => {
        const nombre = item.producto.toLowerCase();
        const categoria = item.categoria.toLowerCase();
        return nombre.includes(textoBusqueda) || categoria.includes(textoBusqueda);
      });
    }
    return insumos;
  })();


  /* ==================================================
     REGISTRAR VENTA
  ================================================== */

  const procesarVenta = async () => {
    if (carrito.length === 0) {
      alert('El carrito está vacío');
      return false;
    }

    const ventaData = {
      total,
      metodo_pago: metodoPago,
      efectivo_recibido: metodoPago === 'Efectivo' ? efectivoNumero : 0,
      cambio_entregado: metodoPago === 'Efectivo' ? cambio : 0,
      detalles: carrito.map(item => ({
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio: Number(item.precio),
        customization: item.customization || '',
        es_fria: item.es_fria || false // 
      }))
    };

    try {
      const response = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ventaData)
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.message || 'Error al registrar la venta');
        return false;
      }

      setUltimaVenta({
        total: total,
        metodo_pago: metodoPago,
        efectivo_recibido: metodoPago === 'Efectivo' ? efectivoNumero : null,
        cambio: metodoPago === 'Efectivo' ? cambio : null
      });

      setMostrarVentaExitosa(true);
      setCarrito([]);
      setEfectivoRecibido('');
      setMostrarPagoEfectivo(false);
      setMostrarConfirmacion(false);

      cargarInventario();
      cargarMenu();
      return true;
    } catch (err) {
      console.error(err);
      alert('Error de conexión con el servidor');
      return false;
    }
  };


  /* ==================================================
     LOGIN VIEW
  ================================================== */

  if (!usuario) {
    return (
      <div className="simple-login-page">
        <div className="simple-login-card">
          <div className="simple-login-brand">CAFETERÍA ORIGEN</div>
          <div className="simple-login-header">
            <h1>Iniciar sesión</h1>
            <p>Ingresa tus credenciales para acceder al punto de venta.</p>
          </div>
          <form className="simple-login-form" onSubmit={handleLogin}>
            <div className="simple-login-field">
              <label htmlFor="username">Usuario</label>
              <input
                id="username"
                type="text"
                placeholder="Ingresa tu usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div className="simple-login-field">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            {error && <div className="simple-login-error">{error}</div>}
            <button type="submit" className="simple-login-button">Iniciar sesión</button>
          </form>
          <div className="simple-login-footer">Acceso exclusivo para personal autorizado</div>
        </div>
      </div>
    );
  }


  /* ==================================================
     POS / INVENTARIO / GERENCIA VIEW
  ================================================== */

  return (
    <>
      <div className="app-container">

        {/* BARRA SUPERIOR */}
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark">CO</div>
            <div>
              <div className="brand-name">Cafetería Origen</div>
              <div className="brand-sub">Sucursal Centro · Caja 1</div>
            </div>
          </div>

          <input
            className="search"
            type="text"
            placeholder="Buscar producto o insumo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <div className="top-right">
            <div className="user-badge">Bienvenido {usuario.username}</div>

            <button
              type="button"
              className="management-btn"
              onClick={() => {
                setVistaActual(vistaActual === 'inventario' ? 'pos' : 'inventario');
                setMenuGerenciaAbierto(false);
              }}
            >
              {vistaActual === 'inventario' ? 'Punto de venta' : 'Inventario'}
            </button>

            {esAdministrador && (
              <div className="management-wrapper">
                <button
                  type="button"
                  className="management-btn"
                  onClick={() => setMenuGerenciaAbierto(!menuGerenciaAbierto)}
                >
                  Gerencia <span className="management-arrow">▾</span>
                </button>

                {menuGerenciaAbierto && (
                  <div className="management-menu">
                    <button type="button" className="management-item">
                      <span>Proveedores</span> <span className="management-status soon">próximamente</span>
                    </button>
                    <button type="button" className="management-item">
                      <span>Cuentas</span> <span className="management-status soon">próximamente</span>
                    </button>
                    <button
                      type="button"
                      className="management-item"
                      onClick={() => {
                        setVistaActual('gerencia-ventas');
                        setMenuGerenciaAbierto(false);
                        cargarVentasGerencia();
                      }}
                    >
                      <span>Ventas</span> <span className="management-status">activo</span>
                    </button>
                    <button type="button" className="management-item">
                      <span>Empleados</span> <span className="management-status soon">próximamente</span>
                    </button>
                    <button type="button" className="management-item">
                      <span>Reportes</span> <span className="management-status soon">próximamente</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              className="logout-btn"
              onClick={() => setMostrarConfirmarSalida(true)}
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        {/* VISTA POS */}
        {vistaActual === 'pos' && (
          <div className="pos-body">
            <aside className="sidebar">
              <div className="side-label">Categorías</div>
              <div className="category-list">
                {menu.map((cat, index) => {
                  const idCategoria = cat.id_categoria ?? cat.categoria;
                  const activa = categoriaSeleccionada === idCategoria;
                  return (
                    <button
                      key={idCategoria || index}
                      type="button"
                      className={activa ? 'cat-btn active' : 'cat-btn'}
                      onClick={() => {
                        setCategoriaSeleccionada(idCategoria);
                        setBusqueda('');
                      }}
                    >
                      {cat.categoria}
                    </button>
                  );
                })}
              </div>
            </aside>

            <main className="main">
              <div className="header-row">
                <div>
                  <h2 className="title">Punto de venta</h2>
                  <div className="subtitle">Venta rápida · productos, carrito y cobro</div>
                </div>
                <span className="product-count">{productosFiltrados.length} productos</span>
              </div>

              <div className="products-grid">
                {productosFiltrados.map(producto => {
                  const stock = Number(producto.stock || 0);
                  const stockMinimo = Number(producto.stock_minimo || 0);
                  const agotado = stock === 0;
                  const stockBajo = stock > 0 && stock <= stockMinimo;

                  return (
                    <button
                      key={producto.id_producto}
                      type="button"
                      className={agotado ? 'product-card agotado' : 'product-card'}
                      disabled={agotado}
                      onClick={() => abrirPersonalizacion(producto)}
                    >
                      <div className="product-thumb">
                        {producto.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="product-name">{producto.nombre}</div>
                      <div className="product-price">{money(producto.precio)}</div>
                      <div className={agotado ? 'product-stock agotado' : stockBajo ? 'product-stock bajo' : 'product-stock disponible'}>
                        {agotado ? 'Agotado' : stockBajo ? `Stock bajo · ${stock}` : `Disponible · ${stock}`}
                      </div>
                    </button>
                  );
                })}
              </div>

              {productosFiltrados.length === 0 && (
                <div className="empty-products">No se encontraron productos.</div>
              )}
            </main>

            <aside className="receipt-wrap">
              <div className="receipt">
                <div className="receipt-title">Ticket actual</div>
                <div className="receipt-sub">
                  {cantidadArticulos} {cantidadArticulos === 1 ? 'artículo' : 'artículos'}
                </div>
                <div className="dash"></div>

                <div className="receipt-items">
                  {carrito.length === 0 ? (
                    <div className="empty-cart">
                      Selecciona productos para<br />comenzar la venta.
                    </div>
                  ) : (
                    carrito.map((item, idx) => (
                      <div key={idx} className="cart-item">
                        <div className="cart-item-top">
                          <span className="cart-item-name">
                            {item.nombre} <br />
                            <small style={{ color: '#666', fontSize: '11px' }}>{item.customization}</small>
                          </span>
                          <button
                            type="button"
                            className="trash-btn"
                            onClick={() => eliminarProducto(item.id_producto, item.customization)}
                          >
                            ×
                          </button>
                        </div>
                        <div className="cart-item-bottom">
                          <div className="qty-control">
                            <button
                              type="button"
                              onClick={() => cambiarCantidad(item.id_producto, -1, item.customization)}
                            >
                              −
                            </button>
                            <strong>{item.cantidad}</strong>
                            <button
                              type="button"
                              onClick={() => cambiarCantidad(item.id_producto, 1, item.customization)}
                            >
                              +
                            </button>
                          </div>
                          <strong>{money(Number(item.precio) * item.cantidad)}</strong>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="dash"></div>
                <div className="total-row">
                  <span>Subtotal sin IVA</span>
                  <span>{money(subtotal)}</span>
                </div>
                <div className="total-row">
                  <span>IVA incluido (16%)</span>
                  <span>{money(iva)}</span>
                </div>
                <div className="total-final">
                  <span>TOTAL</span>
                  <span>{money(total)}</span>
                </div>

                <div className="payment-buttons">
                  <button
                    type="button"
                    className={metodoPago === 'Efectivo' ? 'active' : ''}
                    onClick={() => setMetodoPago('Efectivo')}
                  >
                    Efectivo
                  </button>
                  <button
                    type="button"
                    className={metodoPago === 'Tarjeta' ? 'active' : ''}
                    onClick={() => setMetodoPago('Tarjeta')}
                  >
                    Tarjeta
                  </button>
                </div>

                <button
                  type="button"
                  className="charge-btn"
                  disabled={carrito.length === 0}
                  onClick={() => {
                    if (metodoPago === 'Efectivo') {
                      setEfectivoRecibido('');
                      setMostrarPagoEfectivo(true);
                      return;
                    }
                    setMostrarConfirmacion(true);
                  }}
                >
                  Cobrar {money(total)}
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* VISTA INVENTARIO */}
        {vistaActual === 'inventario' && (
          <div className="inventory-view">
            <div className="inventory-header">
              <div>
                <h2 className="title">Inventario e Insumos</h2>
                <div className="subtitle">Control de existencias y materias primas (Modificable)</div>
              </div>
              <div className="inventory-summary">{productosInventario.length} insumos</div>
            </div>

            <div className="inventory-controls">
              <div className="inventory-filter-group">
                <label>Filtrar por</label>
                <select
                  value={filtroInventario}
                  onChange={(e) => {
                    setFiltroInventario(e.target.value);
                    setValorFiltroInventario('todos');
                    setBusqueda('');
                  }}
                >
                  <option value="todos">Todos los campos</option>
                  <option value="producto">Producto / Insumo</option>
                  <option value="categoria">Categoría</option>
                </select>
              </div>
            </div>

            <div className="inventory-table-wrapper">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Insumo</th>
                    <th>Categoría</th>
                    <th>Stock Actual</th>
                    <th>Stock Mínimo</th>
                    <th>Unidad</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productosInventario.map(item => {
                    let claseEstado = 'available';
                    if (item.estado === 'Agotado') claseEstado = 'out';
                    else if (item.estado === 'Stock bajo') claseEstado = 'low';

                    return (
                      <tr key={item.id_producto}>
                        <td><strong>{item.producto}</strong></td>
                        <td>{item.categoria}</td>
                        <td>
                          <input
                            type="number"
                            step="0.001"
                            defaultValue={item.stock_actual}
                            style={{ width: '90px', padding: '4px' }}
                            onBlur={(e) => {
                              const nuevoStock = e.target.value;
                              if (nuevoStock !== String(item.stock_actual)) {
                                actualizarInsumoInventario(item.id_producto, nuevoStock, item.stock_minimo);
                              }
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.001"
                            defaultValue={item.stock_minimo}
                            style={{ width: '90px', padding: '4px' }}
                            onBlur={(e) => {
                              const nuevoMin = e.target.value;
                              if (nuevoMin !== String(item.stock_minimo)) {
                                actualizarInsumoInventario(item.id_producto, item.stock_actual, nuevoMin);
                              }
                            }}
                          />
                        </td>
                        <td>{item.unidad}</td>
                        <td><span className={`stock-status ${claseEstado}`}>{item.estado}</span></td>
                        <td><small style={{ color: '#666' }}>Edición automática</small></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VISTA GERENCIA VENTAS */}
        {vistaActual === 'gerencia-ventas' && (
          <div className="inventory-view">
            <div className="inventory-header">
              <div>
                <h2 className="title">Historial de Ventas y Arqueo de Caja</h2>
                <div className="subtitle">Detalle de cobros, recibidos y devoluciones</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', margin: '20px 0' }}>
              <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>Ingresos Totales</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>
                  {money(ventasGerencia.reduce((sum, v) => sum + v.total, 0))}
                </div>
              </div>
              <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>Efectivo Recibido</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>
                  {money(ventasGerencia.filter(v => v.metodo_pago.toLowerCase() === 'efectivo').reduce((sum, v) => sum + (v.efectivo_recibido || v.total), 0))}
                </div>
              </div>
              <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>Cambio Entregado</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d97706' }}>
                  {money(ventasGerencia.reduce((sum, v) => sum + (v.cambio_entregado || 0), 0))}
                </div>
              </div>
              <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>Total Tarjetas</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>
                  {money(ventasGerencia.filter(v => v.metodo_pago.toLowerCase() === 'tarjeta').reduce((sum, v) => sum + v.total, 0))}
                </div>
              </div>
            </div>

            <div className="inventory-table-wrapper" style={{ marginTop: '20px' }}>
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>FOLIO TICKET</th>
                    <th>FECHA</th>
                    <th>MÉTODO</th>
                    <th>MONTO PAGADO</th>
                    <th>CAMBIO</th>
                    <th>TOTAL VENTA</th>
                    <th>DETALLE</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasGerencia.map(v => (
                    <tr key={v.folio}>
                      <td><strong>#TK-{v.folio}</strong></td>
                      <td>{new Date(v.fecha_hora).toLocaleString('es-MX')}</td>
                      <td>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          background: v.metodo_pago.toLowerCase() === 'efectivo' ? '#d1fae5' : '#dbeafe',
                          color: v.metodo_pago.toLowerCase() === 'efectivo' ? '#065f46' : '#1e40af'
                        }}>
                          {v.metodo_pago.toUpperCase()}
                        </span>
                      </td>
                      <td>{money(v.efectivo_recibido || v.total)}</td>
                      <td>{money(v.cambio_entregado || 0)}</td>
                      <td><strong>{money(v.total)}</strong></td>
                      <td>
                        <button
                          type="button"
                          onClick={() => setTicketSeleccionado(v)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                          title="Ver detalle"
                        >
                          📄
                        </button>
                      </td>
                    </tr>
                  ))}
                  {ventasGerencia.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                        No hay ventas registradas en el sistema.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {ticketSeleccionado && (
              <div style={{ marginTop: '25px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Ticket #{ticketSeleccionado.folio}</h3>
                  <button
                    type="button"
                    onClick={() => setTicketSeleccionado(null)}
                    style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Cerrar
                  </button>
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '15px' }}>
                  Fecha: {new Date(ticketSeleccionado.fecha_hora).toLocaleString('es-MX')} | Pago: {ticketSeleccionado.metodo_pago.toUpperCase()} | Recibido: {money(ticketSeleccionado.efectivo_recibido || ticketSeleccionado.total)} | Cambio: {money(ticketSeleccionado.cambio_entregado || 0)}
                </div>

                <table className="inventory-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>PRODUCTO</th>
                      <th>PRECIO UNIT.</th>
                      <th>CANT.</th>
                      <th>SUBTOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ticketSeleccionado.detalles.map((d, idx) => (
                      <tr key={idx}>
                        <td>{d.nombre}</td>
                        <td>{money(d.precio)}</td>
                        <td>{d.cantidad}</td>
                        <td>{money(d.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* MODALES FLOTANTES */}
      {mostrarPagoEfectivo && (
        <div className="modal-overlay">
          <div className="payment-modal">
            <div className="modal-header">
              <div>
                <h3>Pago en efectivo</h3>
                <p>Ingresa la cantidad recibida del cliente.</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setMostrarPagoEfectivo(false)}>×</button>
            </div>
            <div className="payment-summary">
              <div className="payment-row">
                <span>Total de la venta</span>
                <strong>{money(total)}</strong>
              </div>
            </div>
            <div className="cash-field">
              <label>Efectivo recibido</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={efectivoRecibido}
                onChange={(e) => setEfectivoRecibido(e.target.value)}
                autoFocus
              />
            </div>
            <div className="change-box">
              <span>Cambio</span>
              <strong>{money(cambio)}</strong>
            </div>
            {efectivoRecibido !== '' && !efectivoSuficiente && (
              <div className="cash-warning">El efectivo recibido es menor al total.</div>
            )}
            <div className="modal-actions">
              <button type="button" className="modal-secondary" onClick={() => setMostrarPagoEfectivo(false)}>Cancelar</button>
              <button
                type="button"
                className="modal-primary"
                disabled={!efectivoSuficiente}
                onClick={() => {
                  setMostrarPagoEfectivo(false);
                  setMostrarConfirmacion(true);
                }}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PERSONALIZAR PRODUCTO */}
      {productoPersonalizando && (() => {
        const nombreLower = (productoPersonalizando.nombre || '').toLowerCase();
        const categoriaLower = (productoPersonalizando.categoria || '').toLowerCase();
        
        const esBebida = categoriaLower.includes('bebida') || 
                         categoriaLower.includes('café') || 
                         categoriaLower.includes('cafe') || 
                         nombreLower.includes('té') || 
                         nombreLower.includes('te') || 
                         nombreLower.includes('latte') || 
                         nombreLower.includes('americano') || 
                         nombreLower.includes('frappe') || 
                         nombreLower.includes('cappuccino') ||
                         nombreLower.includes('capuchino') ||
                         nombreLower.includes('frio') ||
                         nombreLower.includes('helado') ||
                         nombreLower.includes('frappé');

        const esPastel = nombreLower.includes('pastel') || nombreLower.includes('rebanada') || nombreLower.includes('pay');

        return (
          <div className="modal-overlay">
            <div className="payment-modal" style={{ maxWidth: '450px' }}>
              <div className="modal-header">
                <div>
                  <h3>{productoPersonalizando.nombre}</h3>
                  <p>Personaliza tu selección</p>
                </div>
                <button type="button" className="modal-close" onClick={() => setProductoPersonalizando(null)}>×</button>
              </div>

              {esBebida && !esPastel && (
                <>
                  <div style={{ margin: '15px 0' }}>
                    <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px', fontWeight: 'bold' }}>Sabor / Variedad:</label>
                    <select
                      value={saborSeleccionado}
                      onChange={(e) => setSaborSeleccionado(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                    >
                      <option value="Regular">Regular / Estándar</option>
                      <option value="Descafeinado">Descafeinado</option>
                      <option value="Vainilla">Sabor Vainilla</option>
                      <option value="Caramelo">Sabor Caramelo</option>
                      <option value="Moka">Sabor Moka</option>
                    </select>
                  </div>

                  <div style={{ margin: '15px 0' }}>
                    <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', fontWeight: 'bold' }}>Tamaño:</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[
                        { nombre: 'Chico (12 oz)', precio: Number(productoPersonalizando.precio) },
                        { nombre: 'Mediano (16 oz)', precio: Number(productoPersonalizando.precio) + 10 },
                        { nombre: 'Grande (20 oz)', precio: Number(productoPersonalizando.precio) + 15 }
                      ].map((tam, idx) => {
                        const seleccionado = tamanioSeleccionado?.nombre === tam.nombre;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setTamanioSeleccionado(tam)}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              padding: '12px 15px',
                              borderRadius: '6px',
                              border: '1px solid #d1d5db',
                              background: seleccionado ? '#3b82f6' : '#fef3c7',
                              color: seleccionado ? '#fff' : '#1f2937',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                          >
                            <span>{tam.nombre}</span>
                            <span>${tam.precio.toFixed(2)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {esPastel && (
                <div style={{ margin: '15px 0' }}>
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px', fontWeight: 'bold' }}>Sabor de Rebanada:</label>
                  <select
                    value={saborSeleccionado}
                    onChange={(e) => setSaborSeleccionado(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                  >
                    <option value="Chocolate">Chocolate</option>
                    <option value="Zanahoria">Zanahoria</option>
                    <option value="Tres Leches">Tres Leches</option>
                    <option value="Queso con Zarzamora">Queso con Zarzamora</option>
                  </select>
                  <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                  </p>
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: '20px' }}>
                <button type="button" className="modal-secondary" onClick={() => setProductoPersonalizando(null)}>Cancelar</button>
                <button type="button" className="modal-primary" onClick={confirmarAgregarPersonalizado}>Agregar a Orden</button>
              </div>
            </div>
          </div>
        );
      })()}
      {mostrarConfirmacion && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <div className="modal-header">
              <div>
                <h3>Confirmar venta</h3>
                <p>Revisa los datos antes de registrar la venta.</p>
              </div>
            </div>
            <div className="confirm-details">
              <div className="confirm-row">
                <span>Método de pago</span>
                <strong>{metodoPago}</strong>
              </div>
              <div className="confirm-row">
                <span>Total</span>
                <strong>{money(total)}</strong>
              </div>
              {metodoPago === 'Efectivo' && (
                <>
                  <div className="confirm-row">
                    <span>Efectivo recibido</span>
                    <strong>{money(efectivoNumero)}</strong>
                  </div>
                  <div className="confirm-row">
                    <span>Cambio</span>
                    <strong>{money(cambio)}</strong>
                  </div>
                </>
              )}
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="modal-secondary"
                onClick={() => {
                  setMostrarConfirmacion(false);
                  if (metodoPago === 'Efectivo') setMostrarPagoEfectivo(true);
                }}
              >
                Regresar
              </button>
              <button type="button" className="modal-primary" onClick={async () => { await procesarVenta(); }}>
                Confirmar venta
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarVentaExitosa && ultimaVenta && (
        <div className="modal-overlay">
          <div className="success-modal">
            <div className="success-icon">✓</div>
            <h3>Venta completada</h3>
            <p className="success-message">La venta se registró correctamente y el inventario fue descontado</p>
            <div className="success-details">
              <div className="confirm-row">
                <span>Total</span>
                <strong>{money(ultimaVenta.total)}</strong>
              </div>
              <div className="confirm-row">
                <span>Método de pago</span>
                <strong>{ultimaVenta.metodo_pago}</strong>
              </div>
              {ultimaVenta.metodo_pago === 'Efectivo' && (
                <>
                  <div className="confirm-row">
                    <span>Efectivo recibido</span>
                    <strong>{money(ultimaVenta.efectivo_recibido)}</strong>
                  </div>
                  <div className="confirm-row success-change">
                    <span>Cambio</span>
                    <strong>{money(ultimaVenta.cambio)}</strong>
                  </div>
                </>
              )}
            </div>
            <button
              type="button"
              className="success-button"
              onClick={() => {
                setMostrarVentaExitosa(false);
                setUltimaVenta(null);
              }}
            >
              Finalizar
            </button>
          </div>
        </div>
      )}

      {mostrarConfirmarSalida && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <div className="modal-header">
              <div>
                <h3>Cerrar sesión</h3>
                <p>¿Estás seguro de que deseas cerrar sesión?</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setMostrarConfirmarSalida(false)}>×</button>
            </div>
            <div className="confirm-details">
              <div className="confirm-row">
                <span>Usuario actual</span>
                <strong>{usuario.username}</strong>
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="modal-secondary" onClick={() => setMostrarConfirmarSalida(false)}>Cancelar</button>
              <button
                type="button"
                className="modal-primary"
                onClick={() => {
                  setMostrarConfirmarSalida(false);
                  localStorage.removeItem('usuario');
                  setUsuario(null);
                  setCarrito([]);
                  setMenuGerenciaAbierto(false);
                  setMostrarPagoEfectivo(false);
                  setMostrarConfirmacion(false);
                  setEfectivoRecibido('');
                  setUsername('');
                  setPassword('');
                }}
              >
                Sí, cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {notificacionStock && (
        <div className="stock-notification">
          <div className="stock-notification-icon">!</div>
          <div className="stock-notification-content">
            <strong>Stock insuficiente</strong>
            <span>
              {notificacionStock.stock === 0
                ? `${notificacionStock.producto} está agotado.`
                : `Solo hay ${notificacionStock.stock} unidades disponibles de ${notificacionStock.producto}.`
              }
            </span>
          </div>
          <button type="button" className="stock-notification-close" onClick={() => setNotificacionStock(null)}>×</button>
        </div>
      )}
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);