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

function ReceiptIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  );
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
  const [paginaVentas, setPaginaVentas] = useState(1);
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null);

  // Administración de proveedores
  const [proveedores, setProveedores] = useState([]);
  const [cargandoProveedores, setCargandoProveedores] = useState(false);
  const [busquedaProveedor, setBusquedaProveedor] = useState('');
  const [paginaProveedores, setPaginaProveedores] = useState(1);
  const [modalProveedorAbierto, setModalProveedorAbierto] = useState(false);
  const [proveedorEditando, setProveedorEditando] = useState(null);
  const [guardandoProveedor, setGuardandoProveedor] = useState(false);
  const [formProveedor, setFormProveedor] = useState({ nombre: '', contacto: '', telefono: '', estado: 'Activo' });
  const [modalInsumosProveedor, setModalInsumosProveedor] = useState(false);
  const [proveedorInsumosActual, setProveedorInsumosActual] = useState(null);
  const [catalogoInsumosProveedor, setCatalogoInsumosProveedor] = useState([]);
  const [insumosProveedorSeleccionados, setInsumosProveedorSeleccionados] = useState({});
  const [cargandoInsumosProveedor, setCargandoInsumosProveedor] = useState(false);
  const [guardandoInsumosProveedor, setGuardandoInsumosProveedor] = useState(false);
  const PROVEEDORES_POR_PAGINA = 12;
  const VENTAS_POR_PAGINA = 12;

  // Estados para Personalización
  const [productoPersonalizando, setProductoPersonalizando] = useState(null);
  const [tamanioSeleccionado, setTamanioSeleccionado] = useState(null);
  const [saborSeleccionado, setSaborSeleccionado] = useState('');
  const [extrasSeleccionados, setExtrasSeleccionados] = useState([]); 
  const [mostrarExtras, setMostrarExtras] = useState(false); 

  const [errorVenta, setErrorVenta] = useState({
  visible: false,
  mensaje: ''
});

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
    Contabilidad: {
      titulo: 'Contabilidad',
      descripcion: 'Administración de Contabilidad de la empresa.',
      icono: '◎',
      mensaje: 'Aquí podrás administrar las finanzas.',
      detalle: 'La gestión de contabilidad estará disponible próximamente.'
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
     CRUD DE PROVEEDORES
  ================================================== */
  const cargarProveedores = async () => {
    setCargandoProveedores(true);
    try {
      const response = await fetch('/api/proveedores', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron cargar los proveedores');
      setProveedores(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
      alert(err.message || 'Error de conexión al cargar proveedores');
    } finally {
      setCargandoProveedores(false);
    }
  };

  const abrirNuevoProveedor = () => {
    setProveedorEditando(null);
    setFormProveedor({ nombre: '', contacto: '', telefono: '', estado: 'Activo' });
    setModalProveedorAbierto(true);
  };

  const abrirEditarProveedor = (proveedor) => {
    setProveedorEditando(proveedor);
    setFormProveedor({
      nombre: proveedor.nombre || '', contacto: proveedor.contacto || '',
      telefono: proveedor.telefono || '', estado: proveedor.estado || 'Activo'
    });
    setModalProveedorAbierto(true);
  };

  const guardarProveedor = async (e) => {
    e.preventDefault();
    if (!formProveedor.nombre.trim()) return alert('Escribe el nombre del proveedor.');
    setGuardandoProveedor(true);
    try {
      const response = await fetch(proveedorEditando ? `/api/proveedores/${proveedorEditando.id_proveedor}` : '/api/proveedores', {
        method: proveedorEditando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formProveedor, nombre: formProveedor.nombre.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo guardar el proveedor');
      setModalProveedorAbierto(false);
      await cargarProveedores();
    } catch (err) {
      console.error('Error al guardar proveedor:', err);
      alert(err.message || 'Error de conexión al guardar proveedor');
    } finally {
      setGuardandoProveedor(false);
    }
  };

  const abrirInsumosProveedor = async (proveedor) => {
    setProveedorInsumosActual(proveedor);
    setModalInsumosProveedor(true);
    setCargandoInsumosProveedor(true);
    try {
      const [catalogoRes, asignadosRes] = await Promise.all([
        fetch('/api/insumos-proveedor', { cache: 'no-store' }),
        fetch(`/api/proveedores/${proveedor.id_proveedor}/insumos`, { cache: 'no-store' })
      ]);
      const catalogoData = await catalogoRes.json();
      const asignadosData = await asignadosRes.json();
      if (!catalogoRes.ok) throw new Error(catalogoData.error || 'No se pudo cargar el catálogo de insumos');
      if (!asignadosRes.ok) throw new Error(asignadosData.error || 'No se pudieron cargar los insumos del proveedor');
      setCatalogoInsumosProveedor(Array.isArray(catalogoData) ? catalogoData : []);
      const seleccion = {};
      (Array.isArray(asignadosData) ? asignadosData : []).forEach(item => {
        seleccion[item.id_insumo] = { seleccionado: true, precio_compra: String(item.precio_compra ?? '') };
      });
      setInsumosProveedorSeleccionados(seleccion);
    } catch (err) {
      console.error('Error al cargar insumos del proveedor:', err);
      alert(err.message || 'Error de conexión al consultar insumos');
      setModalInsumosProveedor(false);
    } finally {
      setCargandoInsumosProveedor(false);
    }
  };

  const guardarInsumosProveedor = async (e) => {
    e.preventDefault();
    if (!proveedorInsumosActual) return;
    const insumos = Object.entries(insumosProveedorSeleccionados)
      .filter(([, valor]) => valor.seleccionado)
      .map(([id, valor]) => ({ id_insumo: Number(id), precio_compra: Number(valor.precio_compra) }));
    if (insumos.some(i => !Number.isFinite(i.precio_compra) || i.precio_compra < 0)) {
      alert('Indica un precio de compra válido y mayor o igual a cero para cada insumo seleccionado.');
      return;
    }
    setGuardandoInsumosProveedor(true);
    try {
      const response = await fetch(`/api/proveedores/${proveedorInsumosActual.id_proveedor}/insumos`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ insumos })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron guardar los insumos');
      setModalInsumosProveedor(false);
      await cargarProveedores();
      alert('Insumos y precios guardados correctamente.');
    } catch (err) {
      console.error('Error al guardar insumos del proveedor:', err);
      alert(err.message || 'Error de conexión al guardar insumos');
    } finally {
      setGuardandoInsumosProveedor(false);
    }
  };

  const cambiarEstadoProveedor = async (proveedor) => {
    const estadoNuevo = (proveedor.estado || 'Activo') === 'Activo' ? 'Inactivo' : 'Activo';
    if (!window.confirm(`¿Deseas marcar a ${proveedor.nombre} como ${estadoNuevo.toLowerCase()}?`)) return;
    try {
      const response = await fetch(`/api/proveedores/${proveedor.id_proveedor}/estado`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: estadoNuevo })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo cambiar el estado');
      await cargarProveedores();
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      alert(err.message || 'Error de conexión al cambiar estado');
    }
  };

  useEffect(() => {
    if (usuario && vistaActual === 'proveedores') cargarProveedores();
  }, [usuario, vistaActual]);

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
    console.error('Error al registrar la venta:', data);

    setErrorVenta({
        visible: true,
        mensaje: data.message || data.error || 'No se pudo registrar la venta. Inténtalo nuevamente.'
    });

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
          <div className="simple-login-brand">Cafetería Origen</div>
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


  // Paginación del historial: mostrar 12 ventas por página sin alterar los totales generales.
  const totalPaginasVentas = Math.max(1, Math.ceil(ventasGerencia.length / VENTAS_POR_PAGINA));
  const paginaVentasSegura = Math.min(paginaVentas, totalPaginasVentas);
  const ventasPaginaActual = ventasGerencia.slice(
    (paginaVentasSegura - 1) * VENTAS_POR_PAGINA,
    paginaVentasSegura * VENTAS_POR_PAGINA
  );

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
            aria-label="Buscar producto o insumo"
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
                      <span className="management-status active">activo</span>
                    </button>
                    <button
                      type="button"
                      className="management-item"
                      onClick={() => abrirSeccionGerencia('Contabilidad')}
                    >
                      <span>Contabilidad</span>
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
                      <span>Ventas</span> <span className="management-status active">activo</span>
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
                        <span className="category-name">{cat.categoria}</span>
                        <span className="category-count">{(cat.productos || []).length}</span>
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
                      <ReceiptIcon />
                      <span>Selecciona productos para<br />comenzar la venta.</span>
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
                            aria-label="Quitar producto"
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
                              aria-label="Disminuir cantidad"
                            >
                              −
                            </button>
                            <strong>{item.cantidad}</strong>
                            <button
                              type="button"
                              onClick={() => cambiarCantidad(item.id_producto, 1, item.customization)}
                              aria-label="Aumentar cantidad"
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
                  <span>Total</span>
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

        {/* MÓDULO DE PROVEEDORES */}
        {vistaActual === 'proveedores' && (
          <main className="management-page" style={{ width: '100%', maxWidth: 'none', boxSizing: 'border-box', padding: '26px 28px' }}>
            <div className="management-page-header" style={{ width: '100%', boxSizing: 'border-box' }}>
              <div>
                <h2 className="title">Proveedores</h2>
                <div className="subtitle">Administra los datos de contacto y el estado de tus proveedores.</div>
              </div>
              <button type="button" className="management-back-btn" onClick={abrirNuevoProveedor}>+ Nuevo proveedor</button>
            </div>

            <section className="management-placeholder-panel" style={{ width: '100%', maxWidth: 'none', minWidth: 0, boxSizing: 'border-box', padding: 24, background: '#fff', borderRadius: 14, border: '1px solid #e8dfd3', marginTop: 18, boxShadow: '0 3px 12px rgba(54, 43, 29, 0.04)' }}>
              <div style={{ display: 'flex', gap: 18, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 22 }}>
                <div><strong style={{ fontSize: 22 }}>{proveedores.length}</strong><div className="subtitle">Proveedores registrados</div></div>
                <input type="search" value={busquedaProveedor} onChange={e => { setBusquedaProveedor(e.target.value); setPaginaProveedores(1); }} placeholder="Buscar por nombre, contacto o teléfono..." aria-label="Buscar proveedores" style={{ width: 360, minWidth: 260, maxWidth: '100%', boxSizing: 'border-box', padding: '12px 14px', border: '1px solid #d5d9e0', borderRadius: 9, background: '#fff', fontSize: 14 }} />
              </div>
              {cargandoProveedores ? <p>Cargando proveedores...</p> : (() => {
                const filtrados = proveedores.filter(p => [p.nombre, p.contacto, p.telefono, p.estado].some(v => String(v || '').toLowerCase().includes(busquedaProveedor.toLowerCase().trim())));
                const paginas = Math.max(1, Math.ceil(filtrados.length / PROVEEDORES_POR_PAGINA));
                const pagina = Math.min(paginaProveedores, paginas);
                const visibles = filtrados.slice((pagina - 1) * PROVEEDORES_POR_PAGINA, pagina * PROVEEDORES_POR_PAGINA);
                return <>
                  <div style={{ width: '100%', overflowX: 'auto', border: '1px solid #ece7e0', borderRadius: 10 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820, tableLayout: 'auto' }}>
                      <thead><tr style={{ textAlign: 'left', background: '#f7f8fa' }}>{['Proveedor', 'Contacto', 'Teléfono', 'Estado', 'Insumos', 'Acciones'].map(t => <th key={t} style={{ padding: '14px 16px', borderBottom: '1px solid #e6e8ec', whiteSpace: 'nowrap', fontSize: 13, color: '#34413b' }}>{t}</th>)}</tr></thead>
                      <tbody>
                        {visibles.map(p => <tr key={p.id_proveedor}>
                          <td style={{ padding: '15px 16px', borderBottom: '1px solid #edf0f3', minWidth: 180 }}><strong style={{ overflowWrap: 'anywhere' }}>{p.nombre}</strong><div style={{ color: '#7b8492', fontSize: 12 }}>ID: {p.id_proveedor}</div></td>
                          <td style={{ padding: '15px 16px', borderBottom: '1px solid #edf0f3', minWidth: 220, overflowWrap: 'anywhere' }}>{p.contacto || '—'}</td>
                          <td style={{ padding: '15px 16px', borderBottom: '1px solid #edf0f3', minWidth: 150, whiteSpace: 'nowrap' }}>{p.telefono || '—'}</td>
                          <td style={{ padding: '15px 16px', borderBottom: '1px solid #edf0f3' }}><span style={{ display: 'inline-block', padding: '5px 9px', borderRadius: 20, fontSize: 12, background: (p.estado || 'Activo') === 'Activo' ? '#e4f7ec' : '#f0f1f3', color: (p.estado || 'Activo') === 'Activo' ? '#197443' : '#5f6670' }}>{p.estado || 'Activo'}</span></td>
                          <td style={{ padding: '15px 16px', borderBottom: '1px solid #edf0f3', whiteSpace: 'nowrap' }}><button type="button" onClick={() => abrirInsumosProveedor(p)} style={{ marginRight: 8 }}>Ver insumos ({p.total_insumos || 0})</button></td><td style={{ padding: '15px 16px', borderBottom: '1px solid #edf0f3', whiteSpace: 'nowrap' }}><button type="button" onClick={() => abrirEditarProveedor(p)} style={{ marginRight: 8 }}>Editar</button><button type="button" onClick={() => cambiarEstadoProveedor(p)}>{(p.estado || 'Activo') === 'Activo' ? 'Desactivar' : 'Activar'}</button></td>
                        </tr>)}
                        {visibles.length === 0 && <tr><td colSpan="6" style={{ padding: 24, textAlign: 'center', color: '#697386' }}>{filtrados.length === 0 ? 'No hay proveedores que coincidan con la búsqueda.' : 'No hay registros en esta página.'}</td></tr>}
                      </tbody>
                    </table>
                  </div>
                  <div className="pagination-controls" style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <button type="button" disabled={pagina <= 1} onClick={() => setPaginaProveedores(p => Math.max(1, p - 1))}>Anterior</button>
                    <span>Página {pagina} de {paginas} · {filtrados.length} proveedores</span>
                    <button type="button" disabled={pagina >= paginas} onClick={() => setPaginaProveedores(p => Math.min(paginas, p + 1))}>Siguiente</button>
                  </div>
                </>;
              })()}
            </section>

            {modalInsumosProveedor && <div role="presentation" onClick={e => { if (e.target === e.currentTarget && !guardandoInsumosProveedor) setModalInsumosProveedor(false); }} style={{ position: 'fixed', inset: 0, zIndex: 1001, background: 'rgba(15,23,42,.52)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
              <section role="dialog" aria-modal="true" aria-labelledby="titulo-insumos-proveedor" style={{ width: '100%', maxWidth: 820, maxHeight: '88vh', overflowY: 'auto', background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,.22)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 8 }}>
                  <div><h2 id="titulo-insumos-proveedor" style={{ margin: '0 0 6px' }}>Insumos del proveedor</h2><p className="subtitle" style={{ margin: 0 }}>{proveedorInsumosActual?.nombre} · Selecciona los insumos que suministra e indica su precio de compra.</p></div>
                  <button type="button" onClick={() => setModalInsumosProveedor(false)} disabled={guardandoInsumosProveedor}>Cerrar</button>
                </div>
                {cargandoInsumosProveedor ? <p style={{ padding: 24, textAlign: 'center' }}>Cargando catálogo de insumos...</p> : <form onSubmit={guardarInsumosProveedor}>
                  {catalogoInsumosProveedor.length === 0 ? <p>No hay insumos registrados en el inventario.</p> : <div style={{ overflowX: 'auto', border: '1px solid #ece7e0', borderRadius: 10, marginTop: 18 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                      <thead><tr style={{ background: '#faf8f5', textAlign: 'left' }}>{['Incluir', 'Insumo', 'Unidad', 'Precio de compra'].map(t => <th key={t} style={{ padding: 12, borderBottom: '1px solid #e8e1d8', whiteSpace: 'nowrap' }}>{t}</th>)}</tr></thead>
                      <tbody>{catalogoInsumosProveedor.map(insumo => {
                        const valor = insumosProveedorSeleccionados[insumo.id_insumo] || { seleccionado: false, precio_compra: '' };
                        return <tr key={insumo.id_insumo}>
                          <td style={{ padding: 12, borderBottom: '1px solid #f0ece6' }}><input type="checkbox" checked={Boolean(valor.seleccionado)} onChange={e => setInsumosProveedorSeleccionados(prev => ({ ...prev, [insumo.id_insumo]: { ... (prev[insumo.id_insumo] || { precio_compra: '' }), seleccionado: e.target.checked } }))} aria-label={`Incluir ${insumo.nombre}`} /></td>
                          <td style={{ padding: 12, borderBottom: '1px solid #f0ece6' }}><strong>{insumo.nombre}</strong><div style={{ color: '#7b8492', fontSize: 12 }}>ID: {insumo.id_insumo}</div></td>
                          <td style={{ padding: 12, borderBottom: '1px solid #f0ece6' }}>{insumo.unidad || '—'}</td>
                          <td style={{ padding: 12, borderBottom: '1px solid #f0ece6', minWidth: 160 }}><input type="number" min="0" step="0.01" value={valor.precio_compra} disabled={!valor.seleccionado} onChange={e => setInsumosProveedorSeleccionados(prev => ({ ...prev, [insumo.id_insumo]: { ... (prev[insumo.id_insumo] || { seleccionado: false }), precio_compra: e.target.value } }))} placeholder="0.00" style={{ width: '100%', boxSizing: 'border-box', padding: '9px 10px', border: '1px solid #d8d1c8', borderRadius: 8 }} required={Boolean(valor.seleccionado)} /></td>
                        </tr>;
                      })}</tbody>
                    </table>
                  </div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 20 }}><span className="subtitle">Los cambios se guardarán en proveedor_insumo.</span><div style={{ display: 'flex', gap: 10 }}><button type="button" onClick={() => setModalInsumosProveedor(false)} disabled={guardandoInsumosProveedor}>Cancelar</button><button type="submit" disabled={guardandoInsumosProveedor || cargandoInsumosProveedor}>{guardandoInsumosProveedor ? 'Guardando...' : 'Guardar insumos'}</button></div></div>
                </form>}
              </section>
            </div>}

            {modalProveedorAbierto && <div role="presentation" onClick={e => { if (e.target === e.currentTarget) setModalProveedorAbierto(false); }} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,.48)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
              <section role="dialog" aria-modal="true" aria-labelledby="titulo-modal-proveedor" style={{ width: '100%', maxWidth: 520, background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
                <h2 id="titulo-modal-proveedor" style={{ marginTop: 0 }}>{proveedorEditando ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
                <form onSubmit={guardarProveedor}>
                  <label style={{ display: 'block', marginBottom: 14 }}>Nombre *<input required maxLength="150" value={formProveedor.nombre} onChange={e => setFormProveedor(f => ({ ...f, nombre: e.target.value }))} style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: 11, marginTop: 6, border: '1px solid #d5d9e0', borderRadius: 8 }} /></label>
                  <label style={{ display: 'block', marginBottom: 14 }}>Contacto<input maxLength="150" value={formProveedor.contacto} onChange={e => setFormProveedor(f => ({ ...f, contacto: e.target.value }))} style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: 11, marginTop: 6, border: '1px solid #d5d9e0', borderRadius: 8 }} /></label>
                  <label style={{ display: 'block', marginBottom: 14 }}>Teléfono<input maxLength="40" value={formProveedor.telefono} onChange={e => setFormProveedor(f => ({ ...f, telefono: e.target.value }))} style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: 11, marginTop: 6, border: '1px solid #d5d9e0', borderRadius: 8 }} /></label>
                  <label style={{ display: 'block', marginBottom: 20 }}>Estado<select value={formProveedor.estado} onChange={e => setFormProveedor(f => ({ ...f, estado: e.target.value }))} style={{ display: 'block', width: '100%', padding: 11, marginTop: 6, border: '1px solid #d5d9e0', borderRadius: 8 }}><option value="Activo">Activo</option><option value="Inactivo">Inactivo</option></select></label>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}><button type="button" onClick={() => setModalProveedorAbierto(false)} disabled={guardandoProveedor}>Cancelar</button><button type="submit" disabled={guardandoProveedor}>{guardandoProveedor ? 'Guardando...' : 'Guardar proveedor'}</button></div>
                </form>
              </section>
            </div>}
          </main>
        )}

        {/* OTRAS VISTAS DE GERENCIA EN PREPARACIÓN */}
        {seccionesGerencia[vistaActual] && vistaActual !== 'proveedores' && (
          <main className="management-page">
            <div className="management-page-header"><div><h2 className="title">{seccionesGerencia[vistaActual].titulo}</h2><div className="subtitle">{seccionesGerencia[vistaActual].descripcion}</div></div><span className="management-preview-badge">Boceto</span></div>
            <section className="management-empty-state"><div className="management-empty-icon">{seccionesGerencia[vistaActual].icono}</div><h3>{seccionesGerencia[vistaActual].mensaje}</h3><p>{seccionesGerencia[vistaActual].detalle}</p><div className="management-placeholder-panel" aria-hidden="true"><div className="management-placeholder-line"></div><div className="management-placeholder-line short"></div><div className="management-placeholder-line"></div></div><button type="button" className="management-back-btn" onClick={() => setVistaActual('pos')}>Volver al punto de venta</button></section>
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
                    <th>Folio</th>
                    <th>Fecha</th>
                    <th>Método</th>
                    <th>Monto pagado</th>
                    <th>Cambio</th>
                    <th>Total de venta</th>
                    <th>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasPaginaActual.map(v => (
                    <tr key={v.folio}>
                      <td><strong>#TK-{v.folio}</strong></td>
                      <td>{new Date(v.fecha_hora).toLocaleString('es-MX')}</td>
                      <td>
                        <span className={`pay-badge ${v.metodo_pago.toLowerCase() === 'efectivo' ? 'efectivo' : 'tarjeta'}`}>
                          {v.metodo_pago}
                        </span>
                      </td>
                      <td>{money(v.efectivo_recibido || v.total)}</td>
                      <td>{money(v.cambio_entregado || 0)}</td>
                      <td><strong>{money(v.total)}</strong></td>
                      <td>
                        <button
                          type="button"
                          onClick={() => setTicketSeleccionado(v)}
                          className="sales-detail-button"
                          title="Consultar detalle de la venta"
                        >
                          <span aria-hidden="true">▤</span>
                          Ver detalle
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

            {ventasGerencia.length > 0 && (
              <div className="pagination-controls sales-pagination" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                marginTop: '16px',
                padding: '8px 2px'
              }}>
                <span style={{ color: 'var(--text-muted, #777)', fontSize: '13px' }}>
                  Mostrando {(paginaVentasSegura - 1) * VENTAS_POR_PAGINA + 1}
                  {'–'}{Math.min(paginaVentasSegura * VENTAS_POR_PAGINA, ventasGerencia.length)}
                  {' '}de {ventasGerencia.length} ventas
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="secondary-btn"
                    disabled={paginaVentasSegura === 1}
                    onClick={() => setPaginaVentas(p => Math.max(1, p - 1))}
                    style={{ opacity: paginaVentasSegura === 1 ? 0.5 : 1, cursor: paginaVentasSegura === 1 ? 'not-allowed' : 'pointer' }}
                  >
                    Anterior
                  </button>
                  <span style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
                    Página {paginaVentasSegura} de {totalPaginasVentas}
                  </span>
                  <button
                    type="button"
                    className="secondary-btn"
                    disabled={paginaVentasSegura >= totalPaginasVentas}
                    onClick={() => setPaginaVentas(p => Math.min(totalPaginasVentas, p + 1))}
                    style={{ opacity: paginaVentasSegura >= totalPaginasVentas ? 0.5 : 1, cursor: paginaVentasSegura >= totalPaginasVentas ? 'not-allowed' : 'pointer' }}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}

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
                    <div><span>Método de pago</span><strong>{ticketSeleccionado.metodo_pago}</strong></div>
                    <div><span>Recibido</span><strong>{money(ticketSeleccionado.efectivo_recibido || ticketSeleccionado.total)}</strong></div>
                    <div><span>Cambio</span><strong>{money(ticketSeleccionado.cambio_entregado || 0)}</strong></div>
                  </div>

                  <div className="ticket-modal-table-wrap">
                    <table className="inventory-table">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Precio unit.</th>
                          <th>Cant.</th>
                          <th>Subtotal</th>
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

      {errorVenta.visible && (
    <div className="modal-error-overlay">
        <div className="modal-error">
            <div className="modal-error-icon">!</div>

            <h2>No se pudo registrar la venta</h2>

            <p>{errorVenta.mensaje}</p>

            <button
                type="button"
                onClick={() =>
                    setErrorVenta({
                        visible: false,
                        mensaje: ''
                    })
                }
            >
                Entendido
            </button>
        </div>
    </div>
)}
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);