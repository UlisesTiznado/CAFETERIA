const { useState, useEffect } = React;


/* ==================================================
   DECORACIÓN VISUAL (iconos) - no afecta la lógica
================================================== */

function CupIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path className="steam" d="M7.5 4.2c-.9.9.9 1.8 0 2.7" />
      <path className="steam" d="M11 3.4c-1 1 1 2 0 3.1" />
      <path className="steam" d="M14.5 4.2c-.9.9.9 1.8 0 2.7" />
      <path d="M4.5 10h11v4.2a4.6 4.6 0 0 1-4.6 4.6H9.1a4.6 4.6 0 0 1-4.6-4.6V10z" />
      <path d="M15.5 11h1.4a2.4 2.4 0 0 1 0 4.8h-1.8" />
      <path d="M3.5 21h13" />
    </svg>
  );
}

const REGLAS_ICONOS = [
  [/frappe|frio|fria|cold|iced|helad|smoothie/, '🧋'],
  [/limonada|soda|jugo|refresco|agua/, '🥤'],
  [/\bte\b|chai|matcha|infus|herbal/, '🍵'],
  [/galleta|cookie/, '🍪'],
  [/cafe|espresso|americano|capuch|latte|moka|mocha|cortado|macchiato|flat white|affogato|chocolate caliente/, '☕'],
  [/brownie|chocolate/, '🍫'],
  [/pastel|cheesecake|rebanada|\bpay\b|postre|dona|dulce|tarta/, '🍰'],
  [/bagel/, '🥯'],
  [/croissant|\bpan\b|concha|cuerno/, '🥐'],
  [/sandwich|panini|torta|baguette|aliment|snack|ensalada/, '🥪'],
  [/extra|shot|leche|crema|jarabe|complemento/, '✨']
];

function buscarIcono(texto) {
  const t = (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const regla = REGLAS_ICONOS.find(([patron]) => patron.test(t));
  return regla ? regla[1] : null;
}

function iconoCategoria(nombre) {
  return buscarIcono(nombre) || '🍴';
}

function iconoProducto(nombre) {
  return buscarIcono(nombre) || (nombre || '?').charAt(0).toUpperCase();
}

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
  const [paginaProductos, setPaginaProductos] = useState(1);
  const [paginaInventario, setPaginaInventario] = useState(1);
  const PRODUCTOS_POR_PAGINA = 12;

  const [tipoInventario, setTipoInventario] = useState('insumos');
  const [categoriaFiltroInventario, setCategoriaFiltroInventario] = useState('todos');
  const [busquedaInsumo, setBusquedaInsumo] = useState('');

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
const [extrasSeleccionados, setExtrasSeleccionados] = useState([]); 
const [mostrarExtras, setMostrarExtras] = useState(false); 


  /* ==================================================
     USUARIO / ROL
  ================================================== */

  const esAdministrador =
    usuario?.id_rol === 2 ||
    usuario?.rol === 'Administrador';
    useEffect(() => {
  if (!usuario) return;

  if (!esAdministrador && vistaActual !== 'pos' && vistaActual !== 'inventario') {
    setVistaActual('pos');
    setMenuGerenciaAbierto(false);
  }
}, [usuario, esAdministrador, vistaActual]);


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
      
      // Aseguramos que data sea un arreglo válido
      const menuData = data || [];
      setMenu(menuData);
      
      if (menuData.length > 0) {
        // Filtrar las categorías visibles para seleccionar la primera que NO sea un extra
        const categoriasVisibles = menuData.filter(cat => {
          const nombreCat = cat.categoria ? cat.categoria.toLowerCase() : '';
          return !nombreCat.includes('extra');
        });
        
        if (categoriasVisibles.length > 0) {
          const primeraCategoria = categoriasVisibles[0].id_categoria ?? categoriasVisibles[0].categoria;
          setCategoriaSeleccionada(primeraCategoria);
        }
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
     NAVEGACIÓN DE GERENCIA
  ================================================== */

  const abrirSeccionGerencia = (seccion) => {
    setVistaActual(seccion);
    setMenuGerenciaAbierto(false);
    setBusqueda('');
  };

  const seccionesGerencia = {
    proveedores: {
      titulo: 'Proveedores',
      descripcion: 'Administración de proveedores y abastecimiento.',
      icono: '▤',
      mensaje: 'Aquí podrás administrar los proveedores.',
      detalle: 'El registro y la consulta de proveedores estarán disponibles próximamente.'
    },
    cuentas: {
      titulo: 'Cuentas',
      descripcion: 'Administración de cuentas y accesos del sistema.',
      icono: '◎',
      mensaje: 'Aquí podrás administrar las cuentas.',
      detalle: 'La gestión de cuentas estará disponible próximamente.'
    },
    empleados: {
      titulo: 'Empleados',
      descripcion: 'Administración del personal de la cafetería.',
      icono: '♙',
      mensaje: 'Aquí podrás administrar los empleados.',
      detalle: 'El registro y la consulta de empleados estarán disponibles próximamente.'
    },
    reportes: {
      titulo: 'Reportes',
      descripcion: 'Resumen de ventas, inventario y actividad de la cafetería.',
      icono: '▥',
      mensaje: 'Aquí aparecerán los reportes del sistema.',
      detalle: 'Los reportes y sus indicadores estarán disponibles próximamente.'
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
      // Cada inicio de sesión comienza en el POS
setVistaActual('pos');
setMenuGerenciaAbierto(false);

// Limpiar datos que pudieran pertenecer a la sesión anterior
setCarrito([]);
setBusqueda('');
setMetodoPago('Efectivo');
setEfectivoRecibido('');
setVentasGerencia([]);
setTicketSeleccionado(null);

// Guardar el usuario autenticado
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
    setExtrasSeleccionados([]); 
    setMostrarExtras(false);

    const nombreLower = (producto.nombre || '').toLowerCase();
    const categoriaLower = (producto.categoria || '').toLowerCase();

    const categoriasBebidas = ['café', 'cafe', 'bebida', 'frappé', 'frappe', 'té', 'te', 'infusion', 'infusiones', 'otras bebidas'];
    const esCategoriaBebida = categoriasBebidas.some(cat => categoriaLower.includes(cat));

    const palabrasBebida = [
      'latte', 'espresso', 'moka', 'mocha', 'americano', 'cold brew', 'iced', 
      'frappé', 'frappe', 'cappuccino', 'capuchino', 'chai', 'matcha', 
      'chocolate', 'limonada', 'soda', 'té', 'te', 'café', 'cafe', 'macchiato'
    ];
    const esNombreBebida = palabrasBebida.some(p => nombreLower.includes(p));
    const esAguaSimple = nombreLower.includes('agua natural') || nombreLower.includes('agua mineral');

    const esBebida = (esCategoriaBebida || esNombreBebida) && !esAguaSimple;
    const esPastel = nombreLower.includes('pastel') || nombreLower.includes('rebanada') || nombreLower.includes('pay') || nombreLower.includes('cheesecake');
    // Detectar si es cualquier bebida, café, frappé o bebida fría
    

    if (esBebida) {
      setProductoPersonalizando(producto);
      setExtrasSeleccionados([]);
      setMostrarExtras(false);
      setSaborSeleccionado('Regular');
      setTamanioSeleccionado({ nombre: 'Chico (12 oz)', precio: Number(producto.precio) });
    } else if (esPastel) {
      setProductoPersonalizando(producto);
      setExtrasSeleccionados([]);
      setMostrarExtras(false);
      setSaborSeleccionado('Chocolate');
      setTamanioSeleccionado({ nombre: 'Porción Individual', precio: Number(producto.precio) });
    } else {
      // Alimentos, Panadería, Donas, Galletas y Embotellados pasan directo al carrito con 1 clic
      agregarAlCarritoPersonalizado({
        ...producto,
        precio: Number(producto.precio),
        customization: ''
      });
    }
  };
 const confirmarAgregarPersonalizado = () => {
    if (!productoPersonalizando) return;

    const nombreLower = (productoPersonalizando.nombre || '').toLowerCase();
const esPastel = nombreLower.includes('pastel') || nombreLower.includes('rebanada') || nombreLower.includes('pay') || nombreLower.includes('cheesecake');

    const customizationText = esPastel
      ? `Sabor: ${saborSeleccionado}`
      : `${tamanioSeleccionado?.nombre || 'Chico (12 oz)'}`;

    // Bandera explícita de bebida fría
    const esFria = nombreLower.includes('frappe') || 
                   nombreLower.includes('frappé') || 
                   nombreLower.includes('helado') || 
                   nombreLower.includes('iced') || 
                   nombreLower.includes('fría') || 
                   nombreLower.includes('fria') || 
                   nombreLower.includes('frio') ||
                   nombreLower.includes('cold brew') ||
                   nombreLower.includes('tonic') ||
                   nombreLower.includes('limonada') ||
                   nombreLower.includes('soda');

    const itemConPersonalizacion = {
      ...productoPersonalizando,
      precio: tamanioSeleccionado ? tamanioSeleccionado.precio : productoPersonalizando.precio,
      customization: customizationText,
      es_fria: esFria // <--- Propiedad enviada
    };

    agregarAlCarritoPersonalizado(itemConPersonalizacion);
    extrasSeleccionados.forEach(extra => {
      agregarAlCarritoPersonalizado({
        ...extra,
        precio: extra.precio,
        customization: `(Extra en ${productoPersonalizando.nombre})`
      });
    });

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
  const totalPaginasProductos = Math.max(1, Math.ceil(productosFiltrados.length / PRODUCTOS_POR_PAGINA));
  const productosPagina = productosFiltrados.slice(
    (paginaProductos - 1) * PRODUCTOS_POR_PAGINA,
    paginaProductos * PRODUCTOS_POR_PAGINA
  );

  // Normalizamos los productos del menú para poder filtrarlos junto con los insumos.
  const productosMenuInventario = menu.flatMap(categoria =>
    (categoria.productos || []).map(producto => ({
      ...producto,
      categoria: categoria.categoria || 'Sin categoría',
      nombreInventario: producto.nombre || 'Producto sin nombre',
      tipo: 'producto'
    }))
  );

  const datosInventarioActual = tipoInventario === 'insumos'
    ? inventarioData.map(item => ({
        ...item,
        nombreInventario: item.producto || item.nombre || 'Insumo sin nombre',
        tipo: 'insumo'
      }))
    : productosMenuInventario;

  const categoriasInventario = [
    ...new Set(datosInventarioActual.map(item => item.categoria).filter(Boolean))
  ].sort((a, b) => a.localeCompare(b, 'es'));

  const productosInventario = (() => {
    const texto = busquedaInsumo.trim().toLocaleLowerCase('es');

    return datosInventarioActual.filter(item => {
      const coincideCategoria = categoriaFiltroInventario === 'todos' ||
        item.categoria === categoriaFiltroInventario;
      const nombre = (item.nombreInventario || item.nombre || '').toLocaleLowerCase('es');
      const coincideNombre = texto === '' || nombre.includes(texto);
      return coincideCategoria && coincideNombre;
    });
  })();
  const totalPaginasInventario = Math.max(1, Math.ceil(productosInventario.length / PRODUCTOS_POR_PAGINA));
  const inventarioPagina = productosInventario.slice(
    (paginaInventario - 1) * PRODUCTOS_POR_PAGINA,
    paginaInventario * PRODUCTOS_POR_PAGINA
  );


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
          <div className="login-mark"><CupIcon /></div>
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
            <div className="brand-mark"><CupIcon /></div>
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
            onChange={(e) => { setBusqueda(e.target.value); setPaginaProductos(1); }}
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
                    <button
                      type="button"
                      className="management-item"
                      onClick={() => abrirSeccionGerencia('proveedores')}
                    >
                      <span>Proveedores</span>
                      <span className="management-status soon">vista previa</span>
                    </button>
                    <button
                      type="button"
                      className="management-item"
                      onClick={() => abrirSeccionGerencia('cuentas')}
                    >
                      <span>Cuentas</span>
                      <span className="management-status soon">vista previa</span>
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
                    <button
                      type="button"
                      className="management-item"
                      onClick={() => abrirSeccionGerencia('empleados')}
                    >
                      <span>Empleados</span>
                      <span className="management-status soon">vista previa</span>
                    </button>
                    <button
                      type="button"
                      className="management-item"
                      onClick={() => abrirSeccionGerencia('reportes')}
                    >
                      <span>Reportes</span>
                      <span className="management-status soon">vista previa</span>
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
                {(menu || [])
                  .filter(cat => {
                    const nombreCat = cat.categoria ? cat.categoria.toLowerCase() : '';
                    return !nombreCat.includes('extra');
                  })
                  .map((cat, index) => {
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
                          setPaginaProductos(1);
                        }}
                      >
                        <span className="category-icon">{iconoCategoria(cat.categoria)}</span>
                        <span>{cat.categoria}</span>
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
                {productosPagina.map(producto => {
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
                        {iconoProducto(producto.nombre)}
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
              {productosFiltrados.length > PRODUCTOS_POR_PAGINA && (
                <div className="pagination-controls">
                  <button type="button" disabled={paginaProductos === 1} onClick={() => setPaginaProductos(p => Math.max(1, p - 1))}>Anterior</button>
                  <span>Página {paginaProductos} de {totalPaginasProductos} · mostrando {productosPagina.length} de {productosFiltrados.length} productos</span>
                  <button type="button" disabled={paginaProductos >= totalPaginasProductos} onClick={() => setPaginaProductos(p => Math.min(totalPaginasProductos, p + 1))}>Siguiente</button>
                </div>
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
                            <small className="cart-item-note">{item.customization}</small>
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
                <div className="subtitle">
                  {tipoInventario === 'insumos'
                    ? (esAdministrador
                        ? 'Control y edición de existencias y materias primas'
                        : 'Consulta de existencias y materias primas (solo lectura)')
                    : 'Consulta de productos disponibles en el menú de la cafetería'}
                </div>
              </div>
              <div className="inventory-summary">
                {productosInventario.length} {tipoInventario === 'insumos' ? 'insumos' : 'productos'}
              </div>
            </div>

            <div className="inventory-controls">
              <div className="inventory-filter-group">
                <label htmlFor="tipoInventario">Tipo</label>
                <select
                  id="tipoInventario"
                  value={tipoInventario}
                  onChange={e => {
                    setTipoInventario(e.target.value);
                    setCategoriaFiltroInventario('todos');
                    setBusquedaInsumo('');
                    setPaginaInventario(1);
                  }}
                >
                  <option value="insumos">Insumos</option>
                  <option value="productos">Productos de la cafetería</option>
                </select>
              </div>

              <div className="inventory-filter-group">
                <label htmlFor="categoriaFiltroInventario">Categoría</label>
                <select
                  id="categoriaFiltroInventario"
                  value={categoriaFiltroInventario}
                  onChange={e => { setCategoriaFiltroInventario(e.target.value); setPaginaInventario(1); }}
                >
                  <option value="todos">Todas las categorías</option>
                  {categoriasInventario.map(categoria => (
                    <option key={categoria} value={categoria}>{categoria}</option>
                  ))}
                </select>
              </div>

              <div className="inventory-filter-group">
                <label htmlFor="busquedaInsumo">
                  {tipoInventario === 'insumos' ? 'Insumo' : 'Producto'}
                </label>
                <input
                  id="busquedaInsumo"
                  type="text"
                  placeholder={tipoInventario === 'insumos'
                    ? 'Buscar por nombre del insumo...'
                    : 'Buscar por nombre del producto...'}
                  value={busquedaInsumo}
                  onChange={e => { setBusquedaInsumo(e.target.value); setPaginaInventario(1); }}
                />
              </div>

              <button
                type="button"
                className="inventory-clear-filters"
                onClick={() => {
                  setCategoriaFiltroInventario('todos');
                  setBusquedaInsumo('');
                  setPaginaInventario(1);
                }}
              >Limpiar filtros</button>
            </div>

            <div className="inventory-table-wrapper">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>{tipoInventario === 'insumos' ? 'Insumo' : 'Producto'}</th>
                    <th>Categoría</th>
                    {tipoInventario === 'insumos' ? (
                      <>
                        <th>Stock Actual</th>
                        <th>Stock Mínimo</th>
                        <th>Unidad</th>
                      </>
                    ) : (
                      <>
                        <th>Precio</th>
                        <th>Stock Actual</th>
                        <th>Stock Mínimo</th>
                      </>
                    )}
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productosInventario.length === 0 ? (
                    <tr>
                      <td colSpan={tipoInventario === 'insumos' ? 7 : 7} className="table-empty">
                        No se encontraron {tipoInventario === 'insumos' ? 'insumos' : 'productos'} con esos filtros.
                      </td>
                    </tr>
                  ) : inventarioPagina.map(item => {
                    const stockProducto = Number(item.stock ?? 0);
                    const stockMinimoProducto = Number(item.stock_minimo ?? 5);
                    const estadoProducto = stockProducto <= 0
                      ? 'Agotado'
                      : stockProducto <= stockMinimoProducto
                        ? 'Stock bajo'
                        : 'Disponible';
                    const claseEstado = tipoInventario === 'insumos'
                      ? (item.estado === 'Agotado' ? 'out' : item.estado === 'Stock bajo' ? 'low' : 'available')
                      : (estadoProducto === 'Agotado' ? 'out' : estadoProducto === 'Stock bajo' ? 'low' : 'available');

                    return (
                      <tr key={`${tipoInventario}-${item.id_producto ?? item.id ?? item.nombreInventario}`}>
                        <td><strong>{item.nombreInventario}</strong></td>
                        <td>{item.categoria}</td>

                        {tipoInventario === 'insumos' ? (
                          <>
                            <td>
                              {esAdministrador ? (
                                <input
                                  type="number"
                                  min="0"
                                  step="0.001"
                                  defaultValue={item.stock_actual}
                                  className="stock-input"
                                  onBlur={e => {
                                    const nuevoStock = e.target.value;
                                    if (nuevoStock !== String(item.stock_actual)) {
                                      actualizarInsumoInventario(item.id_producto ?? item.id_insumo, nuevoStock, item.stock_minimo);
                                    }
                                  }}
                                />
                              ) : <span>{item.stock_actual}</span>}
                            </td>
                            <td>
                              {esAdministrador ? (
                                <input
                                  type="number"
                                  min="0"
                                  step="0.001"
                                  defaultValue={item.stock_minimo}
                                  className="stock-input"
                                  onBlur={e => {
                                    const nuevoMin = e.target.value;
                                    if (nuevoMin !== String(item.stock_minimo)) {
                                      actualizarInsumoInventario(item.id_producto ?? item.id_insumo, item.stock_actual, nuevoMin);
                                    }
                                  }}
                                />
                              ) : <span>{item.stock_minimo}</span>}
                            </td>
                            <td>{item.unidad || '—'}</td>
                          </>
                        ) : (
                          <>
                            <td>{money(item.precio)}</td>
                            <td>{stockProducto}</td>
                            <td>{stockMinimoProducto}</td>
                          </>
                        )}

                        <td>
                          <span className={`stock-status ${claseEstado}`}>
                            {tipoInventario === 'insumos' ? (item.estado || 'Disponible') : estadoProducto}
                          </span>
                        </td>
                        <td>
                          <small className="muted-note">
                            {tipoInventario === 'insumos'
                              ? (esAdministrador ? 'Edición habilitada' : 'Solo lectura')
                              : 'Solo lectura'}
                          </small>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {productosInventario.length > PRODUCTOS_POR_PAGINA && (
              <div className="pagination-controls">
                <button type="button" disabled={paginaInventario === 1} onClick={() => setPaginaInventario(p => Math.max(1, p - 1))}>Anterior</button>
                <span>Página {paginaInventario} de {totalPaginasInventario} · mostrando {inventarioPagina.length} de {productosInventario.length} {tipoInventario === 'insumos' ? 'insumos' : 'productos'}</span>
                <button type="button" disabled={paginaInventario >= totalPaginasInventario} onClick={() => setPaginaInventario(p => Math.min(totalPaginasInventario, p + 1))}>Siguiente</button>
              </div>
            )}
          </div>
        )}

        {/* VISTAS DE GERENCIA EN PREPARACIÓN */}
        {seccionesGerencia[vistaActual] && (
          <main className="management-page">
            <div className="management-page-header">
              <div>
                <h2 className="title">{seccionesGerencia[vistaActual].titulo}</h2>
                <div className="subtitle">{seccionesGerencia[vistaActual].descripcion}</div>
              </div>
              <span className="management-preview-badge">Boceto</span>
            </div>

            <section className="management-empty-state">
              <div className="management-empty-icon">
                {seccionesGerencia[vistaActual].icono}
              </div>
              <h3>{seccionesGerencia[vistaActual].mensaje}</h3>
              <p>{seccionesGerencia[vistaActual].detalle}</p>

              <div className="management-placeholder-panel" aria-hidden="true">
                <div className="management-placeholder-line"></div>
                <div className="management-placeholder-line short"></div>
                <div className="management-placeholder-line"></div>
              </div>

              <button
                type="button"
                className="management-back-btn"
                onClick={() => setVistaActual('pos')}
              >
                Volver al punto de venta
              </button>
            </section>
          </main>
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

            <div className="kpi-grid">
              <div className="kpi-card brown">
                <div className="kpi-label">Ingresos Totales</div>
                <div className="kpi-value">
                  {money(ventasGerencia.reduce((sum, v) => sum + v.total, 0))}
                </div>
              </div>
              <div className="kpi-card green">
                <div className="kpi-label">Efectivo Recibido</div>
                <div className="kpi-value">
                  {money(ventasGerencia.filter(v => v.metodo_pago.toLowerCase() === 'efectivo').reduce((sum, v) => sum + (v.efectivo_recibido || v.total), 0))}
                </div>
              </div>
              <div className="kpi-card amber">
                <div className="kpi-label">Cambio Entregado</div>
                <div className="kpi-value">
                  {money(ventasGerencia.reduce((sum, v) => sum + (v.cambio_entregado || 0), 0))}
                </div>
              </div>
              <div className="kpi-card blue">
                <div className="kpi-label">Total Tarjetas</div>
                <div className="kpi-value">
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
                        <span className={`pay-badge ${v.metodo_pago.toLowerCase() === 'efectivo' ? 'efectivo' : 'tarjeta'}`}>
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
                          className="icon-btn"
                          title="Ver detalle"
                        >
                          📄
                        </button>
                      </td>
                    </tr>
                  ))}
                  {ventasGerencia.length === 0 && (
                    <tr>
                      <td colSpan="7" className="table-empty">
                        No hay ventas registradas en el sistema.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {ticketSeleccionado && (
              <div
                className="ticket-modal-overlay"
                role="presentation"
                onMouseDown={(e) => {
                  if (e.target === e.currentTarget) setTicketSeleccionado(null);
                }}
              >
                <section
                  className="ticket-detail ticket-detail-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="ticket-detail-title"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <div className="ticket-detail-head">
                    <div>
                      <div className="ticket-modal-eyebrow">DETALLE DE VENTA</div>
                      <h3 id="ticket-detail-title">Ticket #{ticketSeleccionado.folio}</h3>
                      <p className="ticket-modal-description">Resumen de los productos y el pago registrado.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTicketSeleccionado(null)}
                      className="ticket-modal-x"
                      aria-label="Cerrar detalle de venta"
                      title="Cerrar"
                    >×</button>
                  </div>

                  <div className="ticket-detail-meta ticket-detail-meta-grid">
                    <div><span>Fecha</span><strong>{new Date(ticketSeleccionado.fecha_hora).toLocaleString('es-MX')}</strong></div>
                    <div><span>Método de pago</span><strong>{ticketSeleccionado.metodo_pago.toUpperCase()}</strong></div>
                    <div><span>Recibido</span><strong>{money(ticketSeleccionado.efectivo_recibido || ticketSeleccionado.total)}</strong></div>
                    <div><span>Cambio</span><strong>{money(ticketSeleccionado.cambio_entregado || 0)}</strong></div>
                  </div>

                  <div className="ticket-modal-table-wrap">
                    <table className="inventory-table">
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

                  <div className="ticket-modal-total">
                    <span>Total de la venta</span>
                    <strong>{money(ticketSeleccionado.total)}</strong>
                  </div>
                  <div className="ticket-modal-footer">
                    <button type="button" onClick={() => setTicketSeleccionado(null)} className="btn-outline">Cerrar</button>
                  </div>
                </section>
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
        
        const categoriasBebidas = ['café', 'cafe', 'bebida', 'frappé', 'frappe', 'té', 'te', 'infusion', 'infusiones', 'otras bebidas'];
        const esCategoriaBebida = categoriasBebidas.some(cat => categoriaLower.includes(cat));

        const palabrasBebida = [
          'latte', 'espresso', 'moka', 'mocha', 'americano', 'cold brew', 'iced', 
          'frappé', 'frappe', 'cappuccino', 'capuchino', 'chai', 'matcha', 
          'chocolate', 'limonada', 'soda', 'té', 'te', 'café', 'cafe', 'macchiato'
        ];
        const esNombreBebida = palabrasBebida.some(p => nombreLower.includes(p));
        const esAguaSimple = nombreLower.includes('agua natural') || nombreLower.includes('agua mineral');

        const esBebida = (esCategoriaBebida || esNombreBebida) && !esAguaSimple;
        const esPastel = nombreLower.includes('pastel') || nombreLower.includes('rebanada') || nombreLower.includes('pay') || nombreLower.includes('cheesecake');
  


        // Busca cualquier categoría que contenga la palabra "extra" sin importar mayúsculas
const categoriaExtras = menu.find(cat => (cat.categoria || '').toLowerCase().includes('extra'));
        const listaExtras = categoriaExtras ? categoriaExtras.productos : [];
        const toggleExtra = (extra) => {
          setExtrasSeleccionados(prev => {
            const existe = prev.find(e => e.id_producto === extra.id_producto);
            if (existe) return prev.filter(e => e.id_producto !== extra.id_producto);
            return [...prev, extra];
          });
        };

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
                  {/* SE ELIMINÓ EL SELECT DE SABORES. SOLO QUEDAN LOS TAMAÑOS */}
                  <div className="modal-section">
                    <label className="modal-label">Tamaño</label>
                    <div className="option-list">
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
                            className={`option-card${seleccionado ? ' selected' : ''}`}
                          >
                            <span className="option-name">{tam.nombre}</span>
                            <span className="option-price">${tam.precio.toFixed(2)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                 {/* NUEVA SECCIÓN DE EXTRAS Y COMPLEMENTOS OCULTABLE */}
                  {listaExtras.length > 0 && (
                    <div className="extras-block">
                      
                      {/* BOTÓN DESPLEGABLE */}
                      <button 
                        type="button" 
                        onClick={() => setMostrarExtras(!mostrarExtras)}
                        className="extras-toggle"
                      >
                        <span>
                          Extras (Opcional) 
                          {extrasSeleccionados.length > 0 && <span className="extras-count"> · {extrasSeleccionados.length} seleccionados</span>}
                        </span>
                        <span>{mostrarExtras ? '▲' : '▼'}</span>
                      </button>
                      
                      {/* CUADRÍCULA DE EXTRAS (SOLO SE MUESTRA SI mostrarExtras ES TRUE) */}
                      {mostrarExtras && (
                        <div className="extras-grid">
                          {listaExtras.map(extra => {
                            const seleccionado = extrasSeleccionados.some(e => e.id_producto === extra.id_producto);
                            const agotado = Number(extra.stock || 0) <= 0;
                            return (
                              <button
                                key={extra.id_producto}
                                type="button"
                                disabled={agotado}
                                onClick={() => toggleExtra(extra)}
                                className={`extra-chip${seleccionado ? ' selected' : ''}`}
                              >
                                <span>{extra.nombre}</span>
                                <small>
                                  {agotado ? 'Agotado' : `+$${Number(extra.precio).toFixed(2)}`}
                                </small>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {esPastel && (
                <div className="modal-section">
                  <label className="modal-label">Sabor de rebanada</label>
                  <select
                    value={saborSeleccionado}
                    onChange={(e) => setSaborSeleccionado(e.target.value)}
                    className="field-select"
                  >
                    <option value="Chocolate">Chocolate</option>
                    <option value="Zanahoria">Zanahoria</option>
                    <option value="Tres Leches">Tres Leches</option>
                    <option value="Queso con Zarzamora">Queso con Zarzamora</option>
                  </select>
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
  // Cerrar la sesión actual
  setMostrarConfirmarSalida(false);
  localStorage.removeItem('usuario');
  setUsuario(null);

  // Restablecer navegación
  setVistaActual('pos');
  setMenuGerenciaAbierto(false);

  // Limpiar carrito y datos de la venta
  setCarrito([]);
  setMetodoPago('Efectivo');
  setEfectivoRecibido('');
  setUltimaVenta(null);
  setMostrarVentaExitosa(false);
  setTicketSeleccionado(null);
  setVentasGerencia([]);

  // Cerrar todos los modales
  setMostrarPagoEfectivo(false);
  setMostrarConfirmacion(false);
  setProductoPersonalizando(null);
  setMostrarConfirmarSalida(false);

  // Limpiar credenciales y errores
  setUsername('');
  setPassword('');
  setError('');

  // Limpiar búsqueda
  setBusqueda('');
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


