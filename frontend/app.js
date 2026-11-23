const { useState, useEffect, useRef } = React;


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


// Validaciones de acceso: se muestran mientras se escribe y también al enviar.
const validarUsernameEmpleado = (valor) => {
  const username = String(valor || '');
  if (!username) return 'El nombre de usuario es obligatorio.';
  if (/\s/.test(username)) return 'El usuario no puede contener espacios.';
  if (!/^[A-Za-z0-9._-]+$/.test(username)) return 'Usa solo letras, números, punto, guion o guion bajo.';
  const letras = (username.match(/[A-Za-z]/g) || []).length;
  if (letras < 6) return 'Escribe al menos 6 letras; los números y símbolos no cuentan.';
  return '';
};

const validarPasswordEmpleado = (valor) => {
  const password = String(valor || '');
  if (!password) return 'La contraseña es obligatoria.';
  if (/\s/.test(password)) return 'La contraseña no puede contener espacios.';
  if (password.length < 4 || password.length > 8) return 'La contraseña debe tener entre 4 y 8 caracteres.';
  if ((password.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g) || []).length < 4) return 'Usa al menos 4 letras.';
  const normalizada = password.toLowerCase();
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
  const [cargandoVentas, setCargandoVentas] = useState(false);
  const ventasEnCargaRef = useRef(false);
  const reportesEnCargaRef = useRef(false);
  const contabilidadEnCargaRef = useRef(false);
  const nominasEnCargaRef = useRef(false);
  const empleadosEnCargaRef = useRef(false);
  const [paginaVentas, setPaginaVentas] = useState(1);
  const [busquedaVentas, setBusquedaVentas] = useState('');
  const [filtroMetodoVentas, setFiltroMetodoVentas] = useState('todos');
  const [fechaInicioVentas, setFechaInicioVentas] = useState('');
  const [fechaFinVentas, setFechaFinVentas] = useState('');
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null);
  const [ventasParaImprimir, setVentasParaImprimir] = useState(null);
  const [tituloImpresionVentas, setTituloImpresionVentas] = useState('Historial de ventas');

  // Administración de proveedores
  const [proveedores, setProveedores] = useState([]);
  const [cargandoProveedores, setCargandoProveedores] = useState(false);
  const [proveedoresCargados, setProveedoresCargados] = useState(false);
  const [busquedaProveedor, setBusquedaProveedor] = useState('');
  const [filtroEstadoProveedor, setFiltroEstadoProveedor] = useState('todos');
  const [paginaProveedores, setPaginaProveedores] = useState(1);
  const [modalProveedorAbierto, setModalProveedorAbierto] = useState(false);
  const [proveedorEditando, setProveedorEditando] = useState(null);
  const [guardandoProveedor, setGuardandoProveedor] = useState(false);
  const [formProveedor, setFormProveedor] = useState({ nombre: '', contacto: '', lada: '52', telefono: '', estado: 'Activo' });
  const [confirmacionProveedor, setConfirmacionProveedor] = useState(null);
  const [passwordConfirmacionProveedor, setPasswordConfirmacionProveedor] = useState('');
  const [mensajeProveedor, setMensajeProveedor] = useState({ visible: false, tipo: 'info', titulo: '', texto: '' });
  const [procesandoProveedor, setProcesandoProveedor] = useState(false);
  // Compras a proveedores: cada pedido puede contener productos e insumos.
  const [modalCompraAbierto, setModalCompraAbierto] = useState(false);
  const [catalogoCompras, setCatalogoCompras] = useState([]);
  const [categoriaCompraSeleccionada, setCategoriaCompraSeleccionada] = useState('');
  const [cargandoCatalogoCompras, setCargandoCatalogoCompras] = useState(false);
  const catalogoComprasEnCargaRef = useRef(false);
  const compraEnProcesoRef = useRef(false);
  const [catalogoComprasCargado, setCatalogoComprasCargado] = useState(false);
  const [guardandoCompra, setGuardandoCompra] = useState(false);
  const [confirmacionCompraAbierta, setConfirmacionCompraAbierta] = useState(false);
  const [mensajeCompra, setMensajeCompra] = useState({ visible: false, tipo: 'info', titulo: '', texto: '' });

  const [comprasProveedor, setComprasProveedor] = useState([]);
  const [formCompra, setFormCompra] = useState({ id_proveedor: '', fecha_compra: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })(), metodo_pago: 'Efectivo', observaciones: '', items: [] });

  const PROVEEDORES_POR_PAGINA = 12;
  const VENTAS_POR_PAGINA = 12;
  // Fecha local del navegador en formato YYYY-MM-DD para limitar los filtros.
  const fechaHoyVentas = (() => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  })();

  // Estados para Personalización
  const [productoPersonalizando, setProductoPersonalizando] = useState(null);
  const [tamanioSeleccionado, setTamanioSeleccionado] = useState(null);
  const [saborSeleccionado, setSaborSeleccionado] = useState('');
  const [extrasSeleccionados, setExtrasSeleccionados] = useState([]); 
  const [mostrarExtras, setMostrarExtras] = useState(false); 

  // Estados para el módulo de Empleados
  const [empleados, setEmpleados] = useState([]);
  const [cargandoEmpleados, setCargandoEmpleados] = useState(false);
  const [empleadosCargados, setEmpleadosCargados] = useState(false);
  const [busquedaEmpleado, setBusquedaEmpleado] = useState('');
  const [filtroEstadoEmpleado, setFiltroEstadoEmpleado] = useState('todos');
  const [fechaInicioEmpleados, setFechaInicioEmpleados] = useState('');
  const [fechaFinEmpleados, setFechaFinEmpleados] = useState('');
  const [paginaEmpleados, setPaginaEmpleados] = useState(1);
  const [vistaImpresionEmpleados, setVistaImpresionEmpleados] = useState(false);
  const EMPLEADOS_POR_PAGINA = 12;
  const [modalEmpleadoAbierto, setModalEmpleadoAbierto] = useState(false);
  const [modalCrearUsuarioAbierto, setModalCrearUsuarioAbierto] = useState(false);
    const [empleadoEditando, setEmpleadoEditando] = useState(null);
    const [passwordEmpleadoEdicion, setPasswordEmpleadoEdicion] = useState('');
    const [avisoEmpleado, setAvisoEmpleado] = useState({ visible: false, tipo: 'info', titulo: '', texto: '' });
    const [confirmacionEstadoEmpleado, setConfirmacionEstadoEmpleado] = useState(null);
    const [passwordConfirmacionEstado, setPasswordConfirmacionEstado] = useState('');
    const [guardandoEmpleado, setGuardandoEmpleado] = useState(false);

  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);

  const [formEmpleado, setFormEmpleado] = useState({ nombre: '', telefono: '', id_rol: 1 });
  const [formUsuario, setFormUsuario] = useState({ username: '', password: '' });

  const [errorVenta, setErrorVenta] = useState({
  visible: false,
  mensaje: ''
});
  const [guardandoVenta, setGuardandoVenta] = useState(false);
  // Bloqueo síncrono: evita que dos clics rápidos envíen dos ventas antes del siguiente render.
  const ventaEnProcesoRef = useRef(false);
const [reportesData, setReportesData] = useState(null);
  const fechaHoyReportes = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
  const [fechaInicioReportes, setFechaInicioReportes] = useState('');
  const [fechaFinReportes, setFechaFinReportes] = useState('');
  const [periodoAplicadoReportes, setPeriodoAplicadoReportes] = useState({ inicio: '', fin: '' });
  const [contabilidadData, setContabilidadData] = useState({ movimientos: [], resumen: { ingresos: 0, egresos: 0 } });
  const [compraTicketAbierta, setCompraTicketAbierta] = useState(null);
  const [fechaInicioCompras, setFechaInicioCompras] = useState('');
  const [fechaFinCompras, setFechaFinCompras] = useState('');
  const [periodoComprasAplicado, setPeriodoComprasAplicado] = useState({ inicio: '', fin: '' });
  const [paginaCompras, setPaginaCompras] = useState(1);
  const COMPRAS_POR_PAGINA = 12;
  const [fechaInicioGastos, setFechaInicioGastos] = useState('');
  const [fechaFinGastos, setFechaFinGastos] = useState('');
  const [periodoGastosAplicado, setPeriodoGastosAplicado] = useState({ inicio: '', fin: '' });
  const [paginaGastos, setPaginaGastos] = useState(1);
  const [fechaInicioPagos, setFechaInicioPagos] = useState('');
  const [fechaFinPagos, setFechaFinPagos] = useState('');
  const [periodoPagosAplicado, setPeriodoPagosAplicado] = useState({ inicio: '', fin: '' });
  const [paginaPagos, setPaginaPagos] = useState(1);
  const [paginaNominas, setPaginaNominas] = useState(1);
  const [gastoDetalleAbierto, setGastoDetalleAbierto] = useState(null);
  const [pagoDetalleAbierto, setPagoDetalleAbierto] = useState(null);
  const [confirmacionContable, setConfirmacionContable] = useState(null);
  const [avisoContable, setAvisoContable] = useState(null);
  const [guardandoContable, setGuardandoContable] = useState(false);
  const [cargandoContabilidad, setCargandoContabilidad] = useState(false);
  const [nominas, setNominas] = useState([]);
  const [pagosNomina, setPagosNomina] = useState([]);
  const [modalGastoExtra, setModalGastoExtra] = useState(false);
  const [modalNomina, setModalNomina] = useState(false);
  const [formGastoExtra, setFormGastoExtra] = useState({ concepto: '', categoria: 'Transporte', monto: '', fecha_gasto: new Date().toLocaleDateString('en-CA'), metodo_pago: 'Efectivo', observaciones: '' });
  const [formNomina, setFormNomina] = useState({ id_empleado: '', sueldo_mensual: '' });
  const [fechaSemanaNomina, setFechaSemanaNomina] = useState(new Date().toLocaleDateString('en-CA'));

  const [cargandoReportes, setCargandoReportes] = useState(false);
  const [errorReportes, setErrorReportes] = useState('');

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
    // Evita solicitudes duplicadas si se pulsa varias veces o se abre la sección repetidamente.
    if (ventasEnCargaRef.current) return;
    ventasEnCargaRef.current = true;
    setCargandoVentas(true);
    try {
      const response = await fetch('/api/ventas', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo cargar el historial de ventas');
      setVentasGerencia(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar ventas:', error);
      alert(error.message || 'No se pudo cargar el historial de ventas.');
    } finally {
      ventasEnCargaRef.current = false;
      setCargandoVentas(false);
    }
  };

const cargarReportes = async (opciones = {}) => {
  if (reportesEnCargaRef.current) return;
  const inicio = opciones.todo ? '' : (opciones.fechaInicio ?? fechaInicioReportes);
  const fin = opciones.todo ? '' : (opciones.fechaFin ?? fechaFinReportes);

  if (inicio && fin && inicio > fin) {
    setErrorReportes('La fecha inicial no puede ser posterior a la fecha final.');
    return;
  }
  if ((inicio && inicio > fechaHoyReportes) || (fin && fin > fechaHoyReportes)) {
    setErrorReportes('No puedes seleccionar fechas futuras.');
    return;
  }

  reportesEnCargaRef.current = true;
  setCargandoReportes(true);
  setErrorReportes('');
  setReportesData(null); // Evita dejar visibles resultados del periodo anterior mientras se aplica el nuevo filtro.

  try {
    const parametros = new URLSearchParams();
    if (inicio) parametros.set('fechaInicio', inicio);
    if (fin) parametros.set('fechaFin', fin);
    const query = parametros.toString();
    const response = await fetch(`/api/reportes${query ? `?${query}` : ''}`, { cache: 'no-store' });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `Error HTTP ${response.status}`);
    }

    if (!data.resumen || !Array.isArray(data.top_productos) || !Array.isArray(data.ventas_categoria)) {
      throw new Error('El servidor devolvió una respuesta de reportes incompleta.');
    }

    setReportesData(data);
    setPeriodoAplicadoReportes({ inicio, fin });
  } catch (error) {
    console.error('Error al cargar reportes:', error);
    setErrorReportes(error.message || 'No fue posible cargar los reportes.');
  } finally {
    reportesEnCargaRef.current = false;
    setCargandoReportes(false);
  }
};
  // Imprime únicamente el documento administrativo de reportes.
  const imprimirReportes = () => {
    if (!reportesData) {
      alert('Primero debes cargar los datos del reporte.');
      return;
    }
    document.body.classList.add('printing-reportes');
    const limpiarImpresion = () => {
      document.body.classList.remove('printing-reportes');
      window.removeEventListener('afterprint', limpiarImpresion);
    };
    window.addEventListener('afterprint', limpiarImpresion);
    window.print();
    setTimeout(limpiarImpresion, 2000);
  };

  const mostrarAvisoContable = (tipo, titulo, texto) => setAvisoContable({ tipo, titulo, texto });

  const cargarContabilidad = async () => {
    if (contabilidadEnCargaRef.current) return;
    contabilidadEnCargaRef.current = true;
    setCargandoContabilidad(true);
    try {
      const response = await fetch('/api/contabilidad', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo cargar Contabilidad');
      setContabilidadData(data);
    } catch (err) {
      console.error('Error al cargar contabilidad:', err);
      mostrarAvisoContable('error', 'No se pudo cargar', err.message || 'Error al cargar Contabilidad');
    } finally {
      contabilidadEnCargaRef.current = false;
      setCargandoContabilidad(false);
    }
  };

  const cargarNominas = async () => {
    if (nominasEnCargaRef.current) return;
    nominasEnCargaRef.current = true;
    try {
      const response = await fetch('/api/nominas', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron cargar las nóminas');
      setNominas(data.nominas || []);
      setPagosNomina(data.pagos || []);
    } catch (err) { mostrarAvisoContable('error', 'No se pudieron cargar las nóminas', err.message); }
    finally { nominasEnCargaRef.current = false; }
  };

  const guardarGastoExtra = async (e) => {
    e.preventDefault();
    setGuardandoContable(true);
    try {
      const response = await fetch('/api/contabilidad/gastos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formGastoExtra) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo registrar el gasto');
      setModalGastoExtra(false);
      setFormGastoExtra({ concepto: '', categoria: 'Transporte', monto: '', fecha_gasto: new Date().toLocaleDateString('en-CA'), metodo_pago: 'Efectivo', observaciones: '' });
      await cargarContabilidad();
      mostrarAvisoContable('success', 'Gasto registrado', 'El gasto adicional se agregó correctamente a los egresos.');
    } catch (err) { mostrarAvisoContable('error', 'No se pudo registrar', err.message); }
    finally { setGuardandoContable(false); }
  };

  const guardarConfiguracionNomina = async (e) => {
    e.preventDefault();
    setGuardandoContable(true);
    try {
      const response = await fetch('/api/nominas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formNomina) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo guardar la nómina');
      setModalNomina(false); setFormNomina({ id_empleado: '', sueldo_mensual: '' });
      await cargarNominas();
      mostrarAvisoContable('success', 'Nómina configurada', 'La nómina quedó configurada correctamente.');
    } catch (err) { mostrarAvisoContable('error', 'No se pudo guardar', err.message); }
    finally { setGuardandoContable(false); }
  };

  const registrarPagoNomina = async (nomina) => {
    setConfirmacionContable({
      titulo: 'Confirmar pago semanal',
      texto: `¿Registrar el pago de ${money(nomina.pago_semanal)} para ${nomina.nombre}?`,
      confirmar: async () => {
        setConfirmacionContable(null);
        setGuardandoContable(true);
        try {
          const response = await fetch(`/api/nominas/${nomina.id_nomina}/pagos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ semana_inicio: obtenerInicioSemana(fechaSemanaNomina), metodo_pago: 'Transferencia' }) });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'No se pudo registrar el pago');
          await Promise.all([cargarNominas(), cargarContabilidad()]);
          mostrarAvisoContable('success', 'Pago registrado', `Se registró el pago semanal de ${money(data.monto)} para ${nomina.nombre}.`);
        } catch (err) { mostrarAvisoContable('error', 'No se pudo registrar el pago', err.message); }
        finally { setGuardandoContable(false); }
      }
    });
  };

  useEffect(() => {
    if (usuario && vistaActual === 'Contabilidad') { cargarContabilidad(); cargarNominas(); }
  }, [usuario, vistaActual]);

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
    /*empleados: {
      titulo: 'Empleados',
      descripcion: 'Administración del personal de la cafetería.',
      icono: '♙',
      mensaje: 'Aquí podrás administrar los empleados.',
      detalle: 'El registro y la consulta de empleados estarán disponibles próximamente.'
    },*/
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
  const actualizarInsumoInventario = async (id_insumo, nuevoStock, nuevoMinStock, tipo = 'insumo') => {
    try {
      const endpoint = tipo === 'producto'
        ? `/api/inventario/productos/${id_insumo}`
        : `/api/inventario/${id_insumo}`;

      const response = await fetch(endpoint, {
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
  const mostrarMensajeProveedor = (tipo, titulo, texto) =>
    setMensajeProveedor({ visible: true, tipo, titulo, texto });

  const cargarProveedores = async (forzar = false) => {
    if (proveedoresCargados && !forzar) return;
    setCargandoProveedores(true);
    try {
      const response = await fetch('/api/proveedores', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron cargar los proveedores');
      setProveedores(Array.isArray(data) ? data : []);
      setProveedoresCargados(true);
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
      mostrarMensajeProveedor('error', 'No se pudieron cargar los proveedores', err.message || 'Error de conexión.');
    } finally {
      setCargandoProveedores(false);
    }
  };

  const separarTelefonoProveedor = (telefono) => {
    const digitos = String(telefono || '').replace(/\D/g, '');
    if (digitos.length <= 10) return { lada: '52', telefono: digitos };
    return { lada: digitos.slice(0, digitos.length - 10), telefono: digitos.slice(-10) };
  };

  const abrirNuevoProveedor = () => {
    setProveedorEditando(null);
    setFormProveedor({ nombre: '', contacto: '', lada: '52', telefono: '', estado: 'Activo' });
    setModalProveedorAbierto(true);
  };

  const abrirEditarProveedor = (proveedor) => {
    setProveedorEditando(proveedor);
    const tel = separarTelefonoProveedor(proveedor.telefono);
    setFormProveedor({
      nombre: proveedor.nombre || '', contacto: proveedor.contacto || '',
      lada: tel.lada, telefono: tel.telefono, estado: proveedor.estado || 'Activo'
    });
    setModalProveedorAbierto(true);
  };

  const validarNombreProveedor = (valor) => {
    const nombre = String(valor || '').normalize('NFC').trim().replace(/\s+/g, ' ');
    const letras = (nombre.match(/\p{L}/gu) || []).length;
    const tieneCaracteresInvalidos = /[\p{C}<>={}\[\]\\]/u.test(nombre);
    const puntuacionRepetida = /[^\p{L}\p{N}\s]{3,}/u.test(nombre);
    if (!nombre) return 'El nombre del proveedor es obligatorio.';
    if (letras < 4) return 'El nombre debe contener al menos 4 letras, sin contar espacios.';
    if (tieneCaracteresInvalidos || puntuacionRepetida) return 'El nombre contiene caracteres o secuencias no permitidas. Evita usar símbolos repetidos como "...".';
    if (!/\p{L}/u.test(nombre)) return 'El nombre debe incluir letras.';
    return '';
  };

  const validarCorreoProveedor = (valor) => {
    const correo = String(valor || '');
    if (!correo) return 'El correo electrónico es obligatorio.';
    if (correo.length > 254 || /\s/.test(correo)) return 'El correo no debe contener espacios y no puede superar 254 caracteres.';
    const formato = /^[A-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)*\.[A-Z]{2,63}$/i;
    const [local] = correo.split('@');
    if (!formato.test(correo) || !local || local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
      return 'Escribe un correo válido, por ejemplo: contacto@empresa.com.';
    }
    return '';
  };

  const guardarProveedor = async (e) => {
    e.preventDefault();
    const nombre = String(formProveedor.nombre || '').normalize('NFC').trim().replace(/\s+/g, ' ');
    const correo = String(formProveedor.contacto || '');
    const errorNombre = validarNombreProveedor(nombre);
    if (errorNombre) {
      mostrarMensajeProveedor('error', 'Nombre no válido', errorNombre);
      return;
    }
    const errorCorreo = validarCorreoProveedor(correo);
    if (errorCorreo) {
      mostrarMensajeProveedor('error', 'Correo no válido', errorCorreo);
      return;
    }
    const lada = String(formProveedor.lada || '').replace(/\D/g, '');
    const numero = String(formProveedor.telefono || '').replace(/\D/g, '');
    if (!/^\d{1,4}$/.test(lada) || !/^\d{10}$/.test(numero)) {
      mostrarMensajeProveedor('error', 'Teléfono no válido', 'La lada internacional debe tener de 1 a 4 dígitos y el número nacional debe contener exactamente 10 dígitos.');
      return;
    }
    setGuardandoProveedor(true);
    try {
      const response = await fetch(proveedorEditando ? `/api/proveedores/${proveedorEditando.id_proveedor}` : '/api/proveedores', {
        method: proveedorEditando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          contacto: correo,
          telefono: `+${lada}${numero}`,
          estado: formProveedor.estado
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo guardar el proveedor');
      setModalProveedorAbierto(false);
      await cargarProveedores(true);
      mostrarMensajeProveedor('success', proveedorEditando ? 'Proveedor actualizado' : 'Proveedor registrado',
        proveedorEditando ? 'Los datos se actualizaron correctamente.' : 'El proveedor se registró correctamente.');
    } catch (err) {
      console.error('Error al guardar proveedor:', err);
      mostrarMensajeProveedor('error', 'No se pudo guardar', err.message || 'Error de conexión al guardar proveedor.');
    } finally {
      setGuardandoProveedor(false);
    }
  };

  const abrirNuevaCompra = async () => {
    setCategoriaCompraSeleccionada('');
    setFormCompra({
      id_proveedor: '',
      fecha_compra: (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })(),
      metodo_pago: 'Efectivo',
      observaciones: '',
      items: []
    });
    setModalCompraAbierto(true);

    // Reutiliza el catálogo ya cargado y evita solicitudes simultáneas.
    if (catalogoComprasCargado || catalogoComprasEnCargaRef.current) return;

    catalogoComprasEnCargaRef.current = true;
    setCargandoCatalogoCompras(true);
    try {
      const catalogoRes = await fetch('/api/catalogo-compras');
      const catalogo = await catalogoRes.json();
      if (!catalogoRes.ok) throw new Error(catalogo.error || 'No se pudo cargar el catálogo');
      setCatalogoCompras(Array.isArray(catalogo) ? catalogo : []);
      setCatalogoComprasCargado(true);
    } catch (err) {
      setMensajeCompra({
        visible: true,
        tipo: 'error',
        titulo: 'No se pudo preparar la compra',
        texto: err.message || 'Ocurrió un error al cargar los artículos.'
      });
    } finally {
      catalogoComprasEnCargaRef.current = false;
      setCargandoCatalogoCompras(false);
    }
  };

  const obtenerFechaLocalHoy = () => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  };

  const obtenerPresentacionCompra = (unidad = '') => {
    const u = String(unidad).trim().toLowerCase();
    if (['gramo', 'gramos', 'g', 'gr'].includes(u)) {
      return { etiqueta: 'unidad de 1 kg', detalle: '1 unidad = 1 kg (1,000 g)', factorStock: 1000, unidadStock: 'gramos' };
    }
    if (['mililitro', 'mililitros', 'ml', 'cc'].includes(u)) {
      return { etiqueta: 'unidad de 1 L', detalle: '1 unidad = 1 L (1,000 ml)', factorStock: 1000, unidadStock: 'mililitros' };
    }
    if (['kilogramo', 'kilogramos', 'kg', 'kilo', 'kilos'].includes(u)) {
      return { etiqueta: 'unidad de 1 kg', detalle: '1 unidad = 1 kg', factorStock: 1, unidadStock: unidad || 'kg' };
    }
    if (['litro', 'litros', 'l', 'lt', 'lts'].includes(u)) {
      return { etiqueta: 'unidad de 1 L', detalle: '1 unidad = 1 L', factorStock: 1, unidadStock: unidad || 'L' };
    }
    return { etiqueta: 'pieza / unidad', detalle: `1 unidad = 1 ${unidad || 'pieza'}`, factorStock: 1, unidadStock: unidad || 'piezas' };
  };

  const agregarItemCompra = (articulo) => {
    setFormCompra(prev => {
      const existente = prev.items.find(x => x.tipo === articulo.tipo && Number(x.id_articulo) === Number(articulo.id_articulo));
      if (existente) return { ...prev, items: prev.items.map(x => x === existente ? { ...x, cantidad: Number(x.cantidad) + 1 } : x) };
      const presentacion = obtenerPresentacionCompra(articulo.unidad);
      return { ...prev, items: [...prev.items, { tipo: articulo.tipo, id_articulo: articulo.id_articulo, nombre: articulo.nombre, unidad: articulo.unidad, presentacion_compra: presentacion.etiqueta, detalle_presentacion: presentacion.detalle, factor_stock: presentacion.factorStock, cantidad: 1, precio_unitario: Number(articulo.precio_sugerido || 0) }] };
    });
  };

  const actualizarItemCompra = (indice, campo, valor) => {
    if (['cantidad', 'precio_unitario'].includes(campo) && valor !== '') {
      const numero = Number(valor);
      if (!Number.isFinite(numero) || numero < 0) return;
      if (campo === 'cantidad' && !Number.isInteger(numero)) return;
    }
    setFormCompra(prev => ({ ...prev, items: prev.items.map((x, i) => i === indice ? { ...x, [campo]: valor } : x) }));
  };

  const guardarCompraProveedor = async (e) => {
    e.preventDefault();
    if (!formCompra.id_proveedor) {
      setMensajeCompra({ visible: true, tipo: 'error', titulo: 'Falta seleccionar proveedor', texto: 'Selecciona el proveedor que surtió esta compra.' });
      return;
    }
    if (!formCompra.fecha_compra) {
      setMensajeCompra({ visible: true, tipo: 'error', titulo: 'Falta la fecha', texto: 'Selecciona la fecha en que realizaste la compra.' });
      return;
    }
    if (formCompra.fecha_compra > obtenerFechaLocalHoy()) {
      setMensajeCompra({ visible: true, tipo: 'error', titulo: 'Fecha no válida', texto: 'La fecha de compra no puede ser posterior al día de hoy.' });
      return;
    }
    if (!formCompra.items.length) {
      setMensajeCompra({ visible: true, tipo: 'error', titulo: 'Pedido vacío', texto: 'Agrega al menos un producto o insumo al pedido.' });
      return;
    }
    if (formCompra.items.some(x => !Number.isInteger(Number(x.cantidad)) || Number(x.cantidad) <= 0 || x.precio_unitario === '' || x.precio_unitario === null || x.precio_unitario === undefined || !Number.isFinite(Number(x.precio_unitario)) || Number(x.precio_unitario) <= 0)) {
      setMensajeCompra({ visible: true, tipo: 'error', titulo: 'Precio unitario obligatorio', texto: 'Todos los artículos deben tener un precio unitario mayor a $0.00. Completa los precios antes de continuar.' });
      return;
    }
    setConfirmacionCompraAbierta(true);
  };

  const confirmarCompraProveedor = async () => {
    if (guardandoCompra || compraEnProcesoRef.current) return;
    compraEnProcesoRef.current = true;
    setGuardandoCompra(true);
    try {
      const response = await fetch('/api/compras', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_proveedor: Number(formCompra.id_proveedor),
          id_usuario: Number(usuario?.id_usuario),
          fecha_compra: String(formCompra.fecha_compra).trim(),
          metodo_pago: formCompra.metodo_pago,
          observaciones: formCompra.observaciones,
          items: formCompra.items.map(x => ({ tipo: x.tipo, id_articulo: Number(x.id_articulo), cantidad: Number(x.cantidad), precio_unitario: Number(x.precio_unitario) }))
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo registrar la compra');
      setConfirmacionCompraAbierta(false);
      setModalCompraAbierto(false);
      // La compra puede actualizar precios sugeridos y existencias del catálogo.
      setCatalogoComprasCargado(false);
      await Promise.all([cargarInventario(), cargarMenu()]);
      setMensajeCompra({ visible: true, tipo: 'success', titulo: 'Compra registrada', texto: `La compra ${data.folio} se recibió correctamente. El inventario y Contabilidad fueron actualizados.` });
      // Refresh the accounting data if the view is currently open.
      if (vistaActual === 'Contabilidad') await cargarContabilidad();
    } catch (err) {
      setConfirmacionCompraAbierta(false);
      setMensajeCompra({ visible: true, tipo: 'error', titulo: 'No se pudo registrar la compra', texto: err.message || 'Ocurrió un error al registrar la compra.' });
    } finally {
      compraEnProcesoRef.current = false;
      setGuardandoCompra(false);
    }
  };

  const obtenerTiempoInactivoProveedor = (fecha) => {
    if (!fecha) return '—';
    const inicio = new Date(fecha);
    if (Number.isNaN(inicio.getTime())) return '—';
    const ahora = new Date();
    if (inicio > ahora) return 'Menos de un día';
    let meses = (ahora.getFullYear() - inicio.getFullYear()) * 12 +
      (ahora.getMonth() - inicio.getMonth());
    if (ahora.getDate() < inicio.getDate()) meses--;
    meses = Math.max(0, meses);
    const dias = Math.max(0, Math.floor((ahora - new Date(inicio.getFullYear(), inicio.getMonth() + meses, inicio.getDate())) / 86400000));
    const anios = Math.floor(meses / 12);
    const mesesRestantes = meses % 12;
    if (anios > 0) return `${anios} año(s), ${mesesRestantes} mes(es)`;
    if (meses > 0) return `${meses} mes(es), ${dias} día(s)`;
    return `${Math.max(0, Math.floor((ahora - inicio) / 86400000))} día(s)`;
  };

  const cambiarEstadoProveedor = async (proveedor) => {
    const estadoActual = String(proveedor.estado || 'Activo').trim().toLowerCase();
    const estadoNuevo = estadoActual === 'activo' ? 'Inactivo' : 'Activo';
    setPasswordConfirmacionProveedor('');
    setConfirmacionProveedor({
      tipo: 'estado', proveedor,
      titulo: estadoNuevo === 'Inactivo' ? '¿Desactivar proveedor?' : '¿Activar proveedor?',
      texto: `¿Deseas marcar a ${proveedor.nombre} como ${estadoNuevo.toLowerCase()}?`,
      estado: estadoNuevo
    });
  };


  const confirmarAccionProveedor = async () => {
    if (!confirmacionProveedor || procesandoProveedor) return;
    const { tipo, proveedor, estado } = confirmacionProveedor;
    if (tipo === 'estado' && estado === 'Inactivo' && !passwordConfirmacionProveedor.trim()) {
      mostrarMensajeProveedor('error', 'Contraseña requerida', 'Ingresa la contraseña de tu sesión actual para desactivar este proveedor.');
      return;
    }
    setProcesandoProveedor(true);
    try {
      const response = await fetch(`/api/proveedores/${proveedor.id_proveedor}/estado`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado,
          solicitanteIdUsuario: usuario?.id_usuario,
          passwordActual: estado === 'Inactivo' ? passwordConfirmacionProveedor : undefined
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo completar la operación');
      setConfirmacionProveedor(null);
      setPasswordConfirmacionProveedor('');
      if (tipo === 'estado' && data && data.id_proveedor) {
        setProveedores(lista => lista.map(item => Number(item.id_proveedor) === Number(data.id_proveedor) ? { ...item, ...data } : item));
      }
      await cargarProveedores(true);
      mostrarMensajeProveedor('success',
        estado === 'Activo' ? 'Proveedor activado' : 'Proveedor desactivado',
        data.message || 'El estado del proveedor se actualizó correctamente.');
    } catch (err) {
      setConfirmacionProveedor(null);
      setPasswordConfirmacionProveedor('');
      mostrarMensajeProveedor('error', 'No se pudo completar', err.message || 'Ocurrió un error.');
    } finally {
      setProcesandoProveedor(false);
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
     CRUD EMPLEADOS
  ================================================== */
const cargarEmpleados = async (forzar = false) => {
    if (empleadosEnCargaRef.current || (empleadosCargados && !forzar)) return;
    empleadosEnCargaRef.current = true;
    setCargandoEmpleados(true);
    try {
        const response = await fetch('/api/empleados', { cache: 'no-store' });
        const data = await response.json();
        if (response.ok) {
            setEmpleados(Array.isArray(data) ? data : []);
            setEmpleadosCargados(true);
        } else {
            mostrarAvisoEmpleado('error', 'No se pudo cargar el personal', data.error || 'Error al obtener la lista de empleados.');
        }
    } catch (err) {
        console.error('Error al cargar empleados:', err);
    } finally {
        empleadosEnCargaRef.current = false;
        setCargandoEmpleados(false);
    }
};

useEffect(() => {
    if (usuario && vistaActual === 'empleados') {
        cargarEmpleados();
    }
}, [usuario, vistaActual]);

const mostrarAvisoEmpleado = (tipo, titulo, texto) => {
    setAvisoEmpleado({ visible: true, tipo, titulo, texto });
};

const abrirNuevoEmpleado = () => {
    setEmpleadoEditando(null);
    setPasswordEmpleadoEdicion('');
    setFormEmpleado({ nombre: '', lada: '52', telefono: '', id_rol: 1 });
    setModalEmpleadoAbierto(true);
};

const abrirEditarEmpleado = (emp) => {
    setEmpleadoEditando(emp);
    setPasswordEmpleadoEdicion('');
    const telefonoGuardado = String(emp.telefono || '').trim();
    // Los teléfonos nuevos se guardan como +52 662..., con separador.
    // Para registros antiguos sin separador, México (+52) se interpreta con lada de 2 dígitos.
    const partesSeparadas = telefonoGuardado.match(/^\+(\d{2,3})[\s-]+(\d{4,14})$/);
    const digitosAntiguos = telefonoGuardado.replace(/\D/g, '');
    const esFormatoAntiguoMexico = telefonoGuardado.startsWith('+52') && digitosAntiguos.length >= 6;
    const ladaAntigua = esFormatoAntiguoMexico ? digitosAntiguos.slice(0, 2) : digitosAntiguos.slice(0, 3);
    const numeroAntiguo = esFormatoAntiguoMexico ? digitosAntiguos.slice(2) : digitosAntiguos.slice(3);
    setFormEmpleado({
        nombre: emp.nombre || '',
        lada: partesSeparadas ? partesSeparadas[1] : (telefonoGuardado ? ladaAntigua : '52'),
        telefono: partesSeparadas ? partesSeparadas[2] : (telefonoGuardado ? numeroAntiguo : ''),
        id_rol: Number(emp.id_rol || 1)
    });
    setModalEmpleadoAbierto(true);
};

const guardarEmpleado = async (e) => {
    e.preventDefault();
    if (!formEmpleado.nombre.trim()) {
        mostrarAvisoEmpleado('error', 'Falta el nombre', 'Ingresa el nombre del empleado.');
        return;
    }
    const ladaLimpia = String(formEmpleado.lada || '').replace(/\D/g, '');
    const telefonoLimpio = String(formEmpleado.telefono || '').replace(/\D/g, '');
    if (telefonoLimpio && (!/^\d{1,4}$/.test(ladaLimpia) || !/^\d{10}$/.test(telefonoLimpio))) {
        mostrarAvisoEmpleado('error', 'Teléfono no válido', 'Si registras un teléfono, la lada debe tener de 1 a 4 dígitos y el número nacional exactamente 10 dígitos.');
        return;
    }
    const telefonoCompleto = telefonoLimpio ? `+${ladaLimpia} ${telefonoLimpio}` : '';
    if (empleadoEditando && passwordEmpleadoEdicion) {
        const errorPasswordEdicion = validarPasswordEmpleado(passwordEmpleadoEdicion);
        if (errorPasswordEdicion) {
            mostrarAvisoEmpleado('error', 'Contraseña no válida', errorPasswordEdicion);
            return;
        }
    }
    setGuardandoEmpleado(true);
    try {
        const editando = Boolean(empleadoEditando);
        const url = editando ? `/api/empleados/${empleadoEditando.id_empleado}` : '/api/empleados';
        const response = await fetch(url, {
            method: editando ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...formEmpleado,
                telefono: telefonoCompleto,
                lada: ladaLimpia,
                telefonoNumero: telefonoLimpio,
                password: passwordEmpleadoEdicion || undefined
            })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || (editando ? 'No se pudo actualizar el empleado' : 'No se pudo crear el empleado'));

        setModalEmpleadoAbierto(false);
        setEmpleadoEditando(null);
        setPasswordEmpleadoEdicion('');
        setFormEmpleado({ nombre: '', lada: '52', telefono: '', id_rol: 1 });
        await cargarEmpleados(true);
        mostrarAvisoEmpleado('success', editando ? 'Empleado actualizado' : 'Empleado registrado',
            editando ? 'Los datos del empleado se guardaron correctamente.' : 'El empleado se registró correctamente.');
    } catch (err) {
        mostrarAvisoEmpleado('error', 'No se pudo guardar', err.message || 'Ocurrió un error al guardar el empleado.');
    } finally {
        setGuardandoEmpleado(false);
    }
};

const guardarUsuarioEmpleado = async (e) => {
    e.preventDefault();
    if (!empleadoSeleccionado) return;
    const errorUsername = validarUsernameEmpleado(formUsuario.username);
    const errorPassword = validarPasswordEmpleado(formUsuario.password);
    if (errorUsername || errorPassword) {
        mostrarAvisoEmpleado('error', 'Revisa los datos de acceso', errorUsername || errorPassword);
        return;
    }
    setGuardandoEmpleado(true);
    try {
        const response = await fetch(`/api/empleados/${empleadoSeleccionado.id_empleado}/usuario`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formUsuario)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'No se pudo asignar el usuario');

        setModalCrearUsuarioAbierto(false);
        setFormUsuario({ username: '', password: '' });
        await cargarEmpleados(true);
        mostrarAvisoEmpleado('success', 'Acceso creado', `Se creó correctamente el acceso @${data.usuario.username}.`);
    } catch (err) {
        mostrarAvisoEmpleado('error', 'No se pudo crear el acceso', err.message || 'Ocurrió un error al crear el usuario.');
    } finally {
        setGuardandoEmpleado(false);
    }
};


const imprimirEmpleados = () => {
    setVistaImpresionEmpleados(true);
    document.body.classList.add('printing-empleados');
    const limpiar = () => {
        setVistaImpresionEmpleados(false);
        document.body.classList.remove('printing-empleados');
        window.removeEventListener('afterprint', limpiar);
    };
    window.addEventListener('afterprint', limpiar);
    setTimeout(() => window.print(), 250);
    setTimeout(limpiar, 5000);
};

const cambiarEstadoEmpleado = (emp) => {
    const estadoActual = String(emp.estado || 'Activo').trim().toLowerCase();
    const nuevoEstado = estadoActual === 'activo' ? 'Inactivo' : 'Activo';
    setPasswordConfirmacionEstado('');
    setConfirmacionEstadoEmpleado({ empleado: emp, nuevoEstado });
};

const confirmarCambioEstadoEmpleado = async () => {
    if (!confirmacionEstadoEmpleado || guardandoEmpleado) return;
    const { empleado: emp, nuevoEstado } = confirmacionEstadoEmpleado;
    if (nuevoEstado === 'Inactivo' && !passwordConfirmacionEstado.trim()) {
        mostrarAvisoEmpleado('error', 'Contraseña requerida', 'Ingresa la contraseña de tu sesión actual para desactivar este acceso.');
        return;
    }
    setGuardandoEmpleado(true);
    try {
        const response = await fetch(`/api/empleados/${emp.id_empleado}/estado`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                estado: nuevoEstado,
                solicitanteIdUsuario: usuario?.id_usuario,
                passwordActual: nuevoEstado === 'Inactivo' ? passwordConfirmacionEstado : undefined
            })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'No se pudo cambiar el estado');
        setConfirmacionEstadoEmpleado(null);
        setPasswordConfirmacionEstado('');
        await cargarEmpleados(true);
        mostrarAvisoEmpleado('success', nuevoEstado === 'Activo' ? 'Empleado activado' : 'Empleado desactivado',
            `${emp.nombre} ahora está ${nuevoEstado.toLowerCase()}.`);
    } catch (err) {
        mostrarAvisoEmpleado('error', 'No se pudo cambiar el estado', err.message || 'Error al actualizar el estado.');
    } finally {
        setGuardandoEmpleado(false);
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
    // La API /api/menu debe entregar tamanos y extras configurados para cada producto.
    // Mostrar únicamente tamaños con capacidad expresada en onzas.
    const tamanos = (Array.isArray(producto.tamanos) ? producto.tamanos : [])
      .filter(t => /oz/i.test(String(t.nombre || '')));
    const extras = Array.isArray(producto.extras) ? producto.extras : [];

    // Si no hay opciones configuradas, se agrega el producto con su precio normal.
    if (tamanos.length === 0 && extras.length === 0) {
      agregarAlCarritoPersonalizado({
        ...producto,
        precio: Number(producto.precio),
        id_tamano: null,
        extras_seleccionados: [],
        customization: ''
      });
      return;
    }

    setProductoPersonalizando(producto);
    setExtrasSeleccionados([]);
    setMostrarExtras(false);
    setSaborSeleccionado('');
    setTamanioSeleccionado(tamanos.length > 0 ? tamanos[0] : null);
  };

  const confirmarAgregarPersonalizado = () => {
    if (!productoPersonalizando) return;

    const tamanos = Array.isArray(productoPersonalizando.tamanos) ? productoPersonalizando.tamanos : [];
    if (tamanos.length > 0 && !tamanioSeleccionado) {
      alert('Selecciona un tamaño para continuar.');
      return;
    }

    const tamano = tamanioSeleccionado;
    const precioBase = Number(productoPersonalizando.precio || 0);
    const modificador = Number(tamano?.modificador_precio || 0);
    const precioProducto = tamano?.precio != null
      ? Number(tamano.precio)
      : precioBase + modificador;

    const extras = extrasSeleccionados.map(extra => ({
      id_producto: extra.id_producto,
      nombre: extra.nombre,
      precio: Number(extra.precio || 0)
    }));
    const customizationParts = [];
    if (tamano?.nombre) customizationParts.push(tamano.nombre);
    if (saborSeleccionado) customizationParts.push(`Sabor: ${saborSeleccionado}`);
    if (extras.length) customizationParts.push(`Extras: ${extras.map(e => e.nombre).join(', ')}`);

    const nombreLower = (productoPersonalizando.nombre || '').toLowerCase();
    const esFria = ['frappe', 'frappé', 'helado', 'iced', 'fría', 'fria', 'frio', 'cold brew', 'tonic', 'limonada', 'soda']
      .some(palabra => nombreLower.includes(palabra));

    agregarAlCarritoPersonalizado({
      ...productoPersonalizando,
      precio: precioProducto,
      id_tamano: tamano?.id_tamano ?? tamano?.id ?? null,
      stock: tamano?.stock ?? productoPersonalizando.stock,
      extras_seleccionados: [], // Los extras se registran como renglones separados para evitar doble consumo/cobro.
      customization: customizationParts.join(' · '),
      es_fria: esFria
    });

    // Los extras se agregan como renglones separados para conservar el esquema actual de ventas.
    extrasSeleccionados.forEach(extra => {
      agregarAlCarritoPersonalizado({
        ...extra,
        precio: Number(extra.precio || 0),
        customization: `(Extra en ${productoPersonalizando.nombre})`,
        id_producto_padre: productoPersonalizando.id_producto,
        es_extra: true
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

  const obtenerInicioSemana = (valor) => {
    if (!valor) return '';
    const fecha = new Date(`${String(valor).slice(0,10)}T12:00:00`);
    const dia = fecha.getDay();
    fecha.setDate(fecha.getDate() - ((dia + 6) % 7));
    return `${fecha.getFullYear()}-${String(fecha.getMonth()+1).padStart(2,'0')}-${String(fecha.getDate()).padStart(2,'0')}`;
  };

  const formatearFechaContable = (valor) => {
    if (!valor) return '—';
    const texto = String(valor);
    const fecha = /^\d{4}-\d{2}-\d{2}$/.test(texto)
      ? new Date(`${texto}T12:00:00`)
      : new Date(texto);
    return Number.isNaN(fecha.getTime()) ? '—' : fecha.toLocaleDateString('es-MX');
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
    ? inventarioData
        .filter(item => item.tipo !== 'producto')
        .map(item => ({
          ...item,
          nombreInventario: item.producto || item.nombre || 'Insumo sin nombre',
          tipo: 'insumo'
        }))
    : inventarioData
        .filter(item => item.tipo === 'producto')
        .map(item => ({
          ...item,
          nombreInventario: item.producto || item.nombre || 'Producto sin nombre',
          tipo: 'producto',
          precio: Number(item.precio || 0),
          stock: Number(item.stock_actual || 0),
          stock_minimo: Number(item.stock_minimo || 0)
        }));

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
    // useRef se actualiza inmediatamente, a diferencia del estado de React.
    if (ventaEnProcesoRef.current || guardandoVenta) return false;

    if (carrito.length === 0) {
      alert('El carrito está vacío');
      return false;
    }

    ventaEnProcesoRef.current = true;
    setGuardandoVenta(true);

    const ventaData = {
      id_usuario: usuario?.id_usuario,
      total,
      metodo_pago: metodoPago,
      efectivo_recibido: metodoPago === 'Efectivo' ? efectivoNumero : 0,
      cambio_entregado: metodoPago === 'Efectivo' ? cambio : 0,
      detalles: carrito.map(item => ({
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio: Number(item.precio),
        customization: item.customization || '',
        id_tamano: item.id_tamano ?? null,
        extras_seleccionados: item.extras_seleccionados || [],
        es_fria: item.es_fria || false,
        id_producto_padre: item.id_producto_padre ?? null,
        es_extra: item.es_extra === true
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
    } finally {
      ventaEnProcesoRef.current = false;
      setGuardandoVenta(false);
    }
  };


  const GASTOS_POR_PAGINA = 12;
  const PAGOS_POR_PAGINA = 12;
  const NOMINAS_POR_PAGINA = 12;
  const totalPaginasNominas = Math.max(1, Math.ceil(nominas.length / NOMINAS_POR_PAGINA));
  const paginaNominasSegura = Math.min(paginaNominas, totalPaginasNominas);
  const nominasPaginaActual = nominas.slice((paginaNominasSegura - 1) * NOMINAS_POR_PAGINA, paginaNominasSegura * NOMINAS_POR_PAGINA);
  const gastosExtra = (contabilidadData.movimientos || []).filter(g => !['compras a proveedores', 'nómina'].includes(String(g.categoria || '').trim().toLowerCase()));
  const gastosFiltrados = gastosExtra.filter(g => {
    const fecha = String(g.fecha_gasto || '').slice(0, 10);
    return (!periodoGastosAplicado.inicio || fecha >= periodoGastosAplicado.inicio) && (!periodoGastosAplicado.fin || fecha <= periodoGastosAplicado.fin);
  });
  const totalPaginasGastos = Math.max(1, Math.ceil(gastosFiltrados.length / GASTOS_POR_PAGINA));
  const paginaGastosSegura = Math.min(paginaGastos, totalPaginasGastos);
  const gastosPaginaActual = gastosFiltrados.slice((paginaGastosSegura - 1) * GASTOS_POR_PAGINA, paginaGastosSegura * GASTOS_POR_PAGINA);
  const aplicarFiltroGastos = (todas = false) => {
    const inicio = todas ? '' : fechaInicioGastos, fin = todas ? '' : fechaFinGastos;
    if (inicio && fin && inicio > fin) return mostrarAvisoContable('error', 'Periodo no válido', 'La fecha inicial no puede ser posterior a la fecha final.');
    setPeriodoGastosAplicado({ inicio, fin }); setPaginaGastos(1); setGastoDetalleAbierto(null);
  };
  const pagosFiltrados = pagosNomina.filter(p => {
    const fecha = String(p.fecha_pago || p.semana_inicio || '').slice(0, 10);
    return (!periodoPagosAplicado.inicio || fecha >= periodoPagosAplicado.inicio) && (!periodoPagosAplicado.fin || fecha <= periodoPagosAplicado.fin);
  });
  const totalPaginasPagos = Math.max(1, Math.ceil(pagosFiltrados.length / PAGOS_POR_PAGINA));
  const paginaPagosSegura = Math.min(paginaPagos, totalPaginasPagos);
  const pagosPaginaActual = pagosFiltrados.slice((paginaPagosSegura - 1) * PAGOS_POR_PAGINA, paginaPagosSegura * PAGOS_POR_PAGINA);
  const aplicarFiltroPagos = (todas = false) => {
    const inicio = todas ? '' : fechaInicioPagos, fin = todas ? '' : fechaFinPagos;
    if (inicio && fin && inicio > fin) return mostrarAvisoContable('error', 'Periodo no válido', 'La fecha inicial no puede ser posterior a la fecha final.');
    setPeriodoPagosAplicado({ inicio, fin }); setPaginaPagos(1); setPagoDetalleAbierto(null);
  };
  const imprimirSeccionContable = (clase, hayDatos, etiqueta) => {
    if (!hayDatos) return mostrarAvisoContable('info', 'Sin registros', `No hay ${etiqueta} en el periodo seleccionado para imprimir.`);
    const bodyClass = `printing-${clase}`;
    document.body.classList.add(bodyClass);
    const limpiar = () => { document.body.classList.remove(bodyClass); window.removeEventListener('afterprint', limpiar); };
    window.addEventListener('afterprint', limpiar); window.print(); setTimeout(limpiar, 2000);
  };

  // Compras filtradas por fecha. La paginación solo afecta la tabla, no la impresión.
  const comprasFiltradas = (contabilidadData.compras || []).filter(compra => {
    const fecha = String(compra.fecha_compra || '').slice(0, 10);
    return (!periodoComprasAplicado.inicio || fecha >= periodoComprasAplicado.inicio) &&
           (!periodoComprasAplicado.fin || fecha <= periodoComprasAplicado.fin);
  });
  const totalPaginasCompras = Math.max(1, Math.ceil(comprasFiltradas.length / COMPRAS_POR_PAGINA));
  const paginaComprasSegura = Math.min(paginaCompras, totalPaginasCompras);
  const comprasPaginaActual = comprasFiltradas.slice(
    (paginaComprasSegura - 1) * COMPRAS_POR_PAGINA,
    paginaComprasSegura * COMPRAS_POR_PAGINA
  );

  const aplicarFiltroCompras = (todas = false) => {
    const inicio = todas ? '' : fechaInicioCompras;
    const fin = todas ? '' : fechaFinCompras;
    if (inicio && fin && inicio > fin) {
      mostrarAvisoContable('error', 'Periodo no válido', 'La fecha inicial no puede ser posterior a la fecha final.');
      return;
    }
    setPeriodoComprasAplicado({ inicio, fin });
    setPaginaCompras(1);
    setCompraTicketAbierta(null);
  };

  const imprimirComprasFiltradas = () => {
    if (!comprasFiltradas.length) {
      mostrarAvisoContable('info', 'Sin compras', 'No hay compras en el periodo seleccionado para imprimir.');
      return;
    }
    document.body.classList.add('printing-compras');
    const limpiar = () => {
      document.body.classList.remove('printing-compras');
      window.removeEventListener('afterprint', limpiar);
    };
    window.addEventListener('afterprint', limpiar);
    window.print();
    setTimeout(limpiar, 2000);
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


  // Filtros del historial de ventas. Los indicadores y la impresión respetan el periodo/filtros activos.
  const ventasFiltradas = ventasGerencia.filter(v => {
    const metodo = String(v.metodo_pago || '').toLowerCase();
    const folio = String(v.folio ?? '');
    const fecha = v.fecha_hora ? new Date(v.fecha_hora) : null;
    const fechaISO = fecha && !Number.isNaN(fecha.getTime())
      ? `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
      : '';
    const texto = busquedaVentas.trim().toLowerCase();
    const coincideTexto = !texto || folio.includes(texto.replace(/^#?tk-?/, '')) ||
      (v.detalles || []).some(d => String(d.nombre || '').toLowerCase().includes(texto));
    const coincideMetodo = filtroMetodoVentas === 'todos' || metodo === filtroMetodoVentas;
    const coincideInicio = !fechaInicioVentas || (fechaISO && fechaISO >= fechaInicioVentas);
    const coincideFin = !fechaFinVentas || (fechaISO && fechaISO <= fechaFinVentas);
    return coincideTexto && coincideMetodo && coincideInicio && coincideFin;
  });

  const totalPaginasVentas = Math.max(1, Math.ceil(ventasFiltradas.length / VENTAS_POR_PAGINA));
  const paginaVentasSegura = Math.min(paginaVentas, totalPaginasVentas);
  const ventasPaginaActual = ventasFiltradas.slice(
    (paginaVentasSegura - 1) * VENTAS_POR_PAGINA,
    paginaVentasSegura * VENTAS_POR_PAGINA
  );

  const limpiarFiltrosVentas = () => {
    setBusquedaVentas('');
    setFiltroMetodoVentas('todos');
    setFechaInicioVentas('');
    setFechaFinVentas('');
    setPaginaVentas(1);
  };

  const imprimirHistorialVentas = (todoElHistorial = false) => {
    const registros = todoElHistorial ? ventasGerencia : ventasFiltradas;
    if (!registros.length) {
      alert(todoElHistorial ? 'No hay ventas registradas para imprimir.' : 'No hay ventas en el periodo o con los filtros seleccionados.');
      return;
    }

    setVentasParaImprimir(registros);
    setTituloImpresionVentas(todoElHistorial
      ? 'Historial completo de ventas'
      : 'Ventas del periodo seleccionado');

    // Espera a que React actualice el documento imprimible antes de abrir el diálogo.
    requestAnimationFrame(() => {
      document.body.classList.add('printing-sales-history');
      const limpiar = () => {
        document.body.classList.remove('printing-sales-history');
        window.removeEventListener('afterprint', limpiar);
        setVentasParaImprimir(null);
      };
      window.addEventListener('afterprint', limpiar);
      window.print();
      setTimeout(limpiar, 2500);
    });
  };

  const imprimirTicketVenta = () => {
    if (!ticketSeleccionado) return;
    document.body.classList.add('printing-sales-ticket');
    const limpiar = () => {
      document.body.classList.remove('printing-sales-ticket');
      window.removeEventListener('afterprint', limpiar);
    };
    window.addEventListener('afterprint', limpiar);
    window.print();
    setTimeout(limpiar, 2000);
  };

  // Filtrado de empleados compartido por la tabla, paginación e impresión.
  // Debe vivir en el ámbito de App para que no quede encerrado en el IIFE del tbody.
  const empleadosFiltrados = empleados.filter(e => {
    const coincideTexto = [e.nombre, e.username, e.rol, e.telefono, e.estado].some(v =>
      String(v || '').toLowerCase().includes(busquedaEmpleado.toLowerCase().trim())
    );
    const fecha = e.fecha_inactivacion ? String(e.fecha_inactivacion).slice(0, 10) : '';
    const estadoEmpleado = String(e.estado || 'Activo').trim().toLowerCase();
    const coincideEstado = filtroEstadoEmpleado === 'todos' || estadoEmpleado === filtroEstadoEmpleado;
    const coincideDesde = !fechaInicioEmpleados || (fecha && fecha >= fechaInicioEmpleados);
    const coincideHasta = !fechaFinEmpleados || (fecha && fecha <= fechaFinEmpleados);
    return coincideTexto && coincideEstado && coincideDesde && coincideHasta;
  });

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
              className={`management-btn view-nav-btn ${vistaActual === 'pos' ? 'is-active' : ''}`}
              aria-current={vistaActual === 'pos' ? 'page' : undefined}
              onClick={() => {
                setVistaActual('pos');
                setMenuGerenciaAbierto(false);
              }}
            >
              <span className="view-nav-icon" aria-hidden="true">▣</span>
              Punto de venta
            </button>

            <button
              type="button"
              className={`management-btn view-nav-btn inventory-nav-btn ${vistaActual === 'inventario' ? 'is-active' : ''}`}
              aria-current={vistaActual === 'inventario' ? 'page' : undefined}
              onClick={() => {
                setVistaActual('inventario');
                setMenuGerenciaAbierto(false);
              }}
            >
              <span className="view-nav-icon" aria-hidden="true">▤</span>
              Inventario
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
                      <span className="management-status active">activo</span>
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
                      onClick={() => {
                        setVistaActual('empleados');
                        setMenuGerenciaAbierto(false);
                      }}
                    >
                      <span>Empleados</span>
                      <span className="management-status active">activo</span>
                    </button>
                    <button
                      type="button"
                      className="management-item"
                       onClick={() => {
                       setVistaActual('reportes');
                       setMenuGerenciaAbierto(false);
                       cargarReportes();
                        }}
>
                      <span>Reportes</span> <span className="management-status">activo</span>
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
                            <td><span>{Number(item.stock_actual || 0).toLocaleString('es-MX', { maximumFractionDigits: 3 })}</span></td>
                            <td><span>{Number(item.stock_minimo || 0).toLocaleString('es-MX', { maximumFractionDigits: 3 })}</span></td>
                            <td>{item.unidad || '—'}</td>
                          </>
                        ) : (
                          <>
                            <td>{money(item.precio)}</td>
                            <td><span>{stockProducto}</span></td>
                            <td><span>{stockMinimoProducto}</span></td>
                          </>
                        )}

                        <td>
                          <span className={`stock-status ${claseEstado}`}>
                            {tipoInventario === 'insumos' ? (item.estado || 'Disponible') : estadoProducto}
                          </span>
                        </td>
                        <td>
                          <small className="muted-note">
                            'Solo lectura · se actualiza mediante compras a proveedores'
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
          <main className="management-page suppliers-page" style={{ width: '100%', maxWidth: 'none', boxSizing: 'border-box', padding: '26px 28px' }}>
            <div className="management-page-header" style={{ width: '100%', boxSizing: 'border-box' }}>
              <div>
                <h2 className="title">Proveedores</h2>
                <div className="subtitle">Administra los datos de tus proveedores. Registra las compras desde la sección correspondiente.</div>
              </div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}><button type="button" className="btn-outline" onClick={abrirNuevaCompra}>＋ Registrar compra</button><button type="button" className="management-back-btn" onClick={abrirNuevoProveedor}>+ Nuevo proveedor</button></div>
            </div>

            <section className="management-placeholder-panel suppliers-panel" style={{ width: '100%', maxWidth: 'none', minWidth: 0, boxSizing: 'border-box', padding: 24, background: '#fff', borderRadius: 14, border: '1px solid #e8dfd3', marginTop: 18, boxShadow: '0 3px 12px rgba(54, 43, 29, 0.04)' }}>
              <div style={{ display: 'flex', gap: 18, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 22 }}>
                <div><strong style={{ fontSize: 22 }}>{proveedores.length}</strong><div className="subtitle">Proveedores registrados</div></div>
                <div className="status-filter-group">
                  <input type="search" value={busquedaProveedor} onChange={e => { setBusquedaProveedor(e.target.value); setPaginaProveedores(1); }} placeholder="Buscar por nombre, contacto o teléfono..." aria-label="Buscar proveedores" className="suppliers-search" style={{ width: 360, minWidth: 260, maxWidth: '100%', boxSizing: 'border-box', padding: '12px 14px', border: '1px solid #d5d9e0', borderRadius: 9, background: '#fff', fontSize: 14 }} />
                  <label className="status-filter-label">Mostrar
                    <select value={filtroEstadoProveedor} onChange={e => { setFiltroEstadoProveedor(e.target.value); setPaginaProveedores(1); }} aria-label="Filtrar proveedores por estado" className="status-filter-select">
                      <option value="todos">Todos</option><option value="activo">Activos</option><option value="inactivo">Inactivos</option>
                    </select>
                  </label>
                </div>
              </div>
              {cargandoProveedores ? <p>Cargando proveedores...</p> : (() => {
                const filtrados = proveedores.filter(p => { const estado = String(p.estado || 'Activo').trim().toLowerCase(); const coincideEstado = filtroEstadoProveedor === 'todos' || estado === filtroEstadoProveedor; const coincideTexto = [p.nombre, p.contacto, p.telefono, p.estado].some(v => String(v || '').toLowerCase().includes(busquedaProveedor.toLowerCase().trim())); return coincideEstado && coincideTexto; });
                const paginas = Math.max(1, Math.ceil(filtrados.length / PROVEEDORES_POR_PAGINA));
                const pagina = Math.min(paginaProveedores, paginas);
                const visibles = filtrados.slice((pagina - 1) * PROVEEDORES_POR_PAGINA, pagina * PROVEEDORES_POR_PAGINA);
                return <>
                  <div className="suppliers-table-wrap" style={{ width: '100%', overflowX: 'auto', border: '1px solid #ece7e0', borderRadius: 10 }}>
                    <table className="suppliers-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980, tableLayout: 'auto' }}>
                      <thead><tr style={{ textAlign: 'left', background: '#f7f8fa' }}>{['Proveedor', 'Contacto', 'Teléfono', 'Estado', 'Tiempo inactivo', 'Acciones'].map(t => <th key={t} style={{ padding: '14px 16px', borderBottom: '1px solid #e6e8ec', whiteSpace: 'nowrap', fontSize: 13, color: '#34413b' }}>{t}</th>)}</tr></thead>
                      <tbody>
                        {visibles.map(p => <tr key={p.id_proveedor}>
                          <td style={{ padding: '15px 16px', borderBottom: '1px solid #edf0f3', minWidth: 180 }}><strong style={{ overflowWrap: 'anywhere' }}>{p.nombre}</strong><div style={{ color: '#7b8492', fontSize: 12 }}>ID: {p.id_proveedor}</div></td>
                          <td style={{ padding: '15px 16px', borderBottom: '1px solid #edf0f3', minWidth: 220, overflowWrap: 'anywhere' }}>{p.contacto || '—'}</td>
                          <td style={{ padding: '15px 16px', borderBottom: '1px solid #edf0f3', minWidth: 150, whiteSpace: 'nowrap' }}>{p.telefono || '—'}</td>
                          <td style={{ padding: '15px 16px', borderBottom: '1px solid #edf0f3' }}><span style={{ display: 'inline-block', padding: '5px 9px', borderRadius: 20, fontSize: 12, background: (p.estado || 'Activo') === 'Activo' ? '#e4f7ec' : '#f0f1f3', color: (p.estado || 'Activo') === 'Activo' ? '#197443' : '#5f6670' }}>{p.estado || 'Activo'}</span></td>
                          <td style={{ padding: '15px 16px', borderBottom: '1px solid #edf0f3', whiteSpace: 'nowrap', color: (p.estado || 'Activo') === 'Activo' ? '#8a8176' : '#934c43', fontWeight: (p.estado || 'Activo') === 'Activo' ? 400 : 700 }}>
                            {(p.estado || 'Activo') === 'Activo' ? '—' : obtenerTiempoInactivoProveedor(p.fecha_inactivacion)}
                            {(p.estado || 'Activo') === 'Inactivo' && p.fecha_inactivacion && <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 3 }}>Desde {new Date(p.fecha_inactivacion).toLocaleDateString('es-MX')}</div>}
                          </td>
                          <td style={{ padding: '15px 16px', borderBottom: '1px solid #edf0f3', whiteSpace: 'nowrap' }}>
                            <button type="button" className="supplier-action-btn" onClick={() => abrirEditarProveedor(p)} style={{ marginRight: 8 }}>Editar</button>
                            <button type="button" className="supplier-action-btn supplier-toggle-btn" onClick={() => cambiarEstadoProveedor(p)} style={{ marginRight: 8 }}>{(p.estado || 'Activo') === 'Activo' ? 'Desactivar' : 'Activar'}</button>
                          </td>
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


            {confirmacionCompraAbierta && <div className="modal-overlay purchase-dialog-overlay" onClick={e => { if (e.target === e.currentTarget && !guardandoCompra) setConfirmacionCompraAbierta(false); }}>
              <section className="payment-modal purchase-dialog" role="dialog" aria-modal="true" aria-labelledby="confirmar-compra-titulo">
                <div className="purchase-dialog-icon">✓</div>
                <h3 id="confirmar-compra-titulo">¿Confirmar recepción de compra?</h3>
                <p>Al continuar, se aumentarán las existencias de los artículos y se registrará el importe como egreso en Contabilidad.</p>
                <div className="purchase-dialog-total">Total: {money(formCompra.items.reduce((s,x)=>s+Number(x.cantidad||0)*Number(x.precio_unitario||0),0))}</div>
                <div className="modal-actions">
                  <button type="button" className="modal-secondary" onClick={() => setConfirmacionCompraAbierta(false)} disabled={guardandoCompra}>Seguir revisando</button>
                  <button type="button" className="modal-primary" onClick={confirmarCompraProveedor} disabled={guardandoCompra}>{guardandoCompra ? 'Registrando...' : 'Sí, confirmar compra'}</button>
                </div>
              </section>
            </div>}

            {mensajeCompra.visible && <div className="modal-overlay purchase-dialog-overlay" onClick={e => { if (e.target === e.currentTarget) setMensajeCompra(p=>({...p,visible:false})); }}>
              <section className="payment-modal purchase-dialog" role="alertdialog" aria-modal="true" aria-labelledby="mensaje-compra-titulo">
                <div className={`purchase-dialog-icon ${mensajeCompra.tipo}`}>{mensajeCompra.tipo === 'success' ? '✓' : '!'}</div>
                <h3 id="mensaje-compra-titulo">{mensajeCompra.titulo}</h3>
                <p>{mensajeCompra.texto}</p>
                <div className="modal-actions"><button type="button" className="modal-primary" onClick={() => setMensajeCompra(p=>({...p,visible:false}))}>Aceptar</button></div>
              </section>
            </div>}

            {modalCompraAbierto && <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget && !guardandoCompra) setModalCompraAbierto(false); }}>
              <section className="payment-modal purchase-registration-modal" style={{width:'min(100%, 1050px)', maxWidth:1050, maxHeight:'90vh', overflowY:'auto'}}>
                <div className="modal-header">
                  <div><h3>Registrar compra a proveedor</h3><p>Al confirmar la recepción, se sumarán las existencias y se registrará el egreso contable.</p></div>
                  <button type="button" className="modal-close" onClick={() => setModalCompraAbierto(false)} disabled={guardandoCompra}>×</button>
                </div>
                {cargandoCatalogoCompras ? <p>Cargando productos e insumos...</p> : <form onSubmit={guardarCompraProveedor}>
                  <div className="modal-section">
                    <label className="modal-label">Proveedor *</label>
                    <select className="field-select" required value={formCompra.id_proveedor} onChange={e => setFormCompra(p => ({...p,id_proveedor:e.target.value}))}>
                      <option value="">Selecciona un proveedor</option>
                      {proveedores.filter(p => (p.estado || 'Activo') === 'Activo').map(p => <option key={p.id_proveedor} value={p.id_proveedor}>{p.nombre}</option>)}
                    </select>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:12,marginTop:12}}>
                    <div className="cash-field"><label>Fecha de compra</label><input type="date" required max={obtenerFechaLocalHoy()} value={formCompra.fecha_compra} onChange={e=>setFormCompra(p=>({...p,fecha_compra:e.target.value && e.target.value <= obtenerFechaLocalHoy() ? e.target.value : obtenerFechaLocalHoy()}))}/></div>
                    <div className="cash-field"><label>Método de pago</label><select value={formCompra.metodo_pago} onChange={e=>setFormCompra(p=>({...p,metodo_pago:e.target.value}))}><option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option><option>Crédito</option></select></div>
                  </div>
                  <div className="modal-section" style={{marginTop:16}}>
                    <label className="modal-label">Agregar artículos</label>
                    <div style={{display:'grid',gridTemplateColumns:'minmax(220px, 360px) 1fr',gap:12,alignItems:'end',marginBottom:12}}>
                      <div className="cash-field">
                        <label htmlFor="categoria-compra">Filtrar por categoría</label>
                        <select id="categoria-compra" className="field-select" value={categoriaCompraSeleccionada} onChange={e=>setCategoriaCompraSeleccionada(e.target.value)} disabled={!formCompra.id_proveedor}>
                          <option value="">Selecciona una categoría</option>
                          {[...new Set(catalogoCompras.map(x=>x.categoria || 'General'))].sort((x,y)=>x.localeCompare(y,'es')).map(cat=><option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>
                      <small style={{color:'#81786e'}}>Selecciona una categoría para desplegar sus insumos y productos.</small>
                    </div>
                    {categoriaCompraSeleccionada ? (
                      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:10}}>
                        {catalogoCompras.filter(x=>(x.categoria || 'General')===categoriaCompraSeleccionada).map(a=><button key={`${a.tipo}-${a.id_articulo}`} type="button" className="btn-outline purchase-item-choice" onClick={()=>agregarItemCompra(a)} disabled={!formCompra.id_proveedor} style={{textAlign:'left',padding:12}}>
                          <strong>{a.nombre}</strong><small style={{display:'block',opacity:.7}}>{a.tipo === 'producto' ? 'Producto de cafetería' : 'Insumo'} · {obtenerPresentacionCompra(a.unidad).detalle}</small>
                        </button>)}
                      </div>
                    ) : <div className="table-empty" style={{padding:18,textAlign:'center'}}>Selecciona primero un proveedor y después una categoría para mostrar los artículos disponibles.</div>}
                  </div>
                  <div style={{overflowX:'auto',marginTop:16}}>
                    <table className="inventory-table"><thead><tr><th>Artículo</th><th>Tipo</th><th>Cantidad (unidades de compra)</th><th>Precio por unidad</th><th>Importe</th><th></th></tr></thead>
                      <tbody>{formCompra.items.map((x,i)=><tr key={`${x.tipo}-${x.id_articulo}`}><td>{x.nombre}</td><td>{x.tipo==='producto'?'Producto':'Insumo'}</td>
                        <td><div className="purchase-quantity-cell"><input type="number" min="1" step="1" inputMode="numeric" value={x.cantidad} onKeyDown={e=>{if(['-','.','e','E'].includes(e.key))e.preventDefault();}} onChange={e=>actualizarItemCompra(i,'cantidad',e.target.value)} style={{width:92}}/><small>{x.detalle_presentacion || obtenerPresentacionCompra(x.unidad).detalle}</small></div></td>
                        <td><input type="number" min="0.01" step="0.01" inputMode="decimal" required value={x.precio_unitario} onKeyDown={e=>{if(e.key==='-')e.preventDefault();}} onChange={e=>actualizarItemCompra(i,'precio_unitario',e.target.value)} placeholder="Precio obligatorio" aria-invalid={!Number.isFinite(Number(x.precio_unitario)) || Number(x.precio_unitario)<=0} style={{width:140,borderColor:Number(x.precio_unitario)>0?'':'#c65b42'}}/>{Number(x.precio_unitario)<=0 && <small style={{display:'block',color:'#b34d36'}}>Debe ser mayor a $0.00</small>}</td>
                        <td><strong>{money(Number(x.cantidad)*Number(x.precio_unitario))}</strong></td>
                        <td><button type="button" className="btn-outline" onClick={()=>setFormCompra(p=>({...p,items:p.items.filter((_,j)=>j!==i)}))}>Quitar</button></td>
                      </tr>)}
                      {!formCompra.items.length && <tr><td colSpan="6" className="table-empty">Todavía no agregas artículos al pedido.</td></tr>}</tbody>
                    </table>
                  </div>
                  <div className="cash-field" style={{marginTop:12}}><label>Observaciones</label><textarea rows="2" value={formCompra.observaciones} onChange={e=>setFormCompra(p=>({...p,observaciones:e.target.value}))} placeholder="Factura, número de pedido o notas..."/></div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',marginTop:16}}>
                    <strong style={{fontSize:20}}>Total: {money(formCompra.items.reduce((s,x)=>s+Number(x.cantidad||0)*Number(x.precio_unitario||0),0))}</strong>
                    <div style={{display:'flex',gap:10}}><button type="button" className="modal-secondary" onClick={()=>setModalCompraAbierto(false)} disabled={guardandoCompra}>Cancelar</button><button type="submit" className="modal-primary purchase-footer-btn purchase-confirm-btn" disabled={guardandoCompra || !formCompra.id_proveedor || !formCompra.items.length || formCompra.items.some(x=>!Number.isFinite(Number(x.precio_unitario)) || Number(x.precio_unitario)<=0)}>{guardandoCompra?'Registrando...':'Confirmar recepción y compra'}</button></div>
                  </div>
                </form>}
              </section>
            </div>}

            {modalProveedorAbierto && <div className="modal-overlay supplier-modal-overlay" onClick={e => { if (e.target === e.currentTarget && !guardandoProveedor) setModalProveedorAbierto(false); }}>
              <section className="payment-modal supplier-form-modal" role="dialog" aria-modal="true" aria-labelledby="titulo-modal-proveedor">
                <div className="modal-header">
                  <div><h3 id="titulo-modal-proveedor">{proveedorEditando ? 'Editar proveedor' : 'Nuevo proveedor'}</h3><p>Registra los datos de contacto del proveedor.</p></div>
                  <button type="button" className="modal-close" onClick={() => setModalProveedorAbierto(false)} disabled={guardandoProveedor}>×</button>
                </div>
                <form onSubmit={guardarProveedor}>
                  <div className="cash-field"><label htmlFor="proveedor-nombre">Nombre *</label><input id="proveedor-nombre" required maxLength="150" minLength="4" autoComplete="organization" value={formProveedor.nombre} onChange={e => setFormProveedor(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre del proveedor" /></div>
                  <div className="cash-field"><label htmlFor="proveedor-correo">Correo electrónico *</label><input id="proveedor-correo" type="email" required maxLength="254" autoComplete="email" spellCheck="false" value={formProveedor.contacto} onChange={e => setFormProveedor(f => ({ ...f, contacto: e.target.value }))} placeholder="contacto@empresa.com" /></div>
                  <div className="cash-field">
                    <label htmlFor="proveedor-telefono">Teléfono *</label>
                    <div className="phone-input-wrap supplier-phone-wrap">
                      <span className="supplier-lada-prefix">+</span>
                      <input className="supplier-lada-input" aria-label="Lada internacional" inputMode="numeric" autoComplete="tel-country-code" maxLength="4" placeholder="52" required value={formProveedor.lada} onChange={e => setFormProveedor(f => ({ ...f, lada: e.target.value.replace(/\D/g, '').slice(0,4) }))} />
                      <input id="proveedor-telefono" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength="10" minLength="10" pattern="[0-9]{10}" required placeholder="10 dígitos" value={formProveedor.telefono} onChange={e => setFormProveedor(f => ({ ...f, telefono: e.target.value.replace(/\D/g, '').slice(0,10) }))} />
                    </div>
                    <small>Ingresa una lada internacional de 1 a 4 dígitos y un número nacional de exactamente 10 dígitos.</small>
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="modal-secondary" onClick={() => setModalProveedorAbierto(false)} disabled={guardandoProveedor}>Cancelar</button>
                    <button type="submit" className="modal-primary" disabled={guardandoProveedor}>{guardandoProveedor ? 'Guardando...' : 'Guardar proveedor'}</button>
                  </div>
                </form>
              </section>
            </div>}

            {confirmacionProveedor && <div className="modal-overlay supplier-modal-overlay supplier-confirm-overlay">
              <section className={`payment-modal employee-status-modal ${confirmacionProveedor.tipo === 'estado' ? 'supplier-status-modal' : ''}`} role="alertdialog" aria-modal="true">
                <div className={`purchase-dialog-icon ${confirmacionProveedor.tipo === 'estado' && confirmacionProveedor.estado === 'Inactivo' ? 'warning' : confirmacionProveedor.tipo === 'estado' ? 'success' : ''}`}>
                  {confirmacionProveedor.tipo === 'eliminar' ? '!' : confirmacionProveedor.estado === 'Inactivo' ? '!' : '✓'}
                </div>
                <h3>{confirmacionProveedor.titulo}</h3>
                <p>{confirmacionProveedor.texto}</p>
                {confirmacionProveedor.tipo === 'estado' && confirmacionProveedor.estado === 'Inactivo' && (
                  <div className="employee-status-password">
                    <label htmlFor="password-confirmar-proveedor">Contraseña de tu sesión actual</label>
                    <input
                      id="password-confirmar-proveedor"
                      type="password"
                      autoComplete="current-password"
                      placeholder="Ingresa tu contraseña"
                      value={passwordConfirmacionProveedor}
                      onChange={e => setPasswordConfirmacionProveedor(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') confirmarAccionProveedor(); }}
                      disabled={procesandoProveedor}
                    />
                    <small>Se solicita para confirmar que tienes autorización para desactivar este proveedor.</small>
                  </div>
                )}
                <div className="modal-actions">
                  <button type="button" className="modal-secondary" onClick={() => { setConfirmacionProveedor(null); setPasswordConfirmacionProveedor(''); }} disabled={procesandoProveedor}>Cancelar</button>
                  <button
                    type="button"
                    className={confirmacionProveedor.tipo === 'eliminar' ? 'modal-danger' : 'modal-primary'}
                    onClick={confirmarAccionProveedor}
                    disabled={procesandoProveedor || (confirmacionProveedor.tipo === 'estado' && confirmacionProveedor.estado === 'Inactivo' && !passwordConfirmacionProveedor.trim())}
                  >
                    {procesandoProveedor ? 'Procesando...' : confirmacionProveedor.tipo === 'eliminar' ? 'Sí, eliminar' : confirmacionProveedor.estado === 'Inactivo' ? 'Confirmar desactivación' : 'Confirmar activación'}
                  </button>
                </div>
              </section>
            </div>}

            {mensajeProveedor.visible && <div className="modal-overlay supplier-modal-overlay supplier-message-overlay">
              <section className="payment-modal purchase-dialog" role="alertdialog" aria-modal="true">
                <div className={`purchase-dialog-icon ${mensajeProveedor.tipo}`}>{mensajeProveedor.tipo === 'success' ? '✓' : '!'}</div>
                <h3>{mensajeProveedor.titulo}</h3>
                <p>{mensajeProveedor.texto}</p>
                <div className="modal-actions"><button type="button" className="modal-primary" onClick={() => setMensajeProveedor(p => ({ ...p, visible: false }))}>Aceptar</button></div>
              </section>
            </div>}

          </main>
        )}

        {/* VISTA DE EMPLEADOS Y USUARIOS (NUEVA) */}
          {vistaActual === 'empleados' && (
            <main className="management-page">
              <div className="management-page-header">
                <div>
                  <h2 className="title">Gestión de Empleados</h2>
                  <div className="subtitle">Registro de personal y asignación de cuentas de acceso.</div>
                </div>
                <button type="button" className="management-back-btn" onClick={() => setModalEmpleadoAbierto(true)}>
                  + Nuevo empleado
                </button>
              </div>

              <section className="management-placeholder-panel">
                <div className="employees-toolbar">
                  <div>
                    <strong>{empleados.length}</strong>
                    <div className="subtitle">Empleados registrados</div>
                  </div>
                  <input type="search" placeholder="Buscar por nombre o usuario..." value={busquedaEmpleado}
                    onChange={e => { setBusquedaEmpleado(e.target.value); setPaginaEmpleados(1); }} />
                  <div className="employees-date-filters">
                    <label>Mostrar
                      <select value={filtroEstadoEmpleado} onChange={e => { setFiltroEstadoEmpleado(e.target.value); setPaginaEmpleados(1); }} aria-label="Filtrar empleados por estado" className="status-filter-select">
                        <option value="todos">Todos</option><option value="activo">Activos</option><option value="inactivo">Inactivos</option>
                      </select>
                    </label>
                    <label>Inactivos desde <input type="date" value={fechaInicioEmpleados} onChange={e => {setFechaInicioEmpleados(e.target.value);setPaginaEmpleados(1);}} /></label>
                    <label>Hasta <input type="date" value={fechaFinEmpleados} onChange={e => {setFechaFinEmpleados(e.target.value);setPaginaEmpleados(1);}} /></label>
                    <button type="button" className="btn-outline" onClick={() => {setFechaInicioEmpleados('');setFechaFinEmpleados('');setBusquedaEmpleado('');setFiltroEstadoEmpleado('todos');setPaginaEmpleados(1);}}>Limpiar filtros</button>
                    <button type="button" className="management-back-btn" onClick={imprimirEmpleados}>Imprimir</button>
                  </div>
                </div>

                <div className="inventory-table-wrapper">
                  <table className="inventory-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Empleado</th>
                        <th>Teléfono</th>
                        <th>Rol</th>
                        <th>Cuenta de Acceso</th>
                        <th>Estado</th>
                        <th>Tiempo inactivo</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cargandoEmpleados ? (
                        <tr><td colSpan="8" className="table-empty">Cargando personal...</td></tr>
                      ) : (() => {
                        const totalPaginas = Math.max(1, Math.ceil(empleadosFiltrados.length / EMPLEADOS_POR_PAGINA));
                        const paginaActual = Math.min(paginaEmpleados, totalPaginas);
                        const empleadosPagina = (vistaImpresionEmpleados && document.body.classList.contains('printing-empleados'))
                          ? empleadosFiltrados
                          : empleadosFiltrados.slice((paginaActual - 1) * EMPLEADOS_POR_PAGINA, paginaActual * EMPLEADOS_POR_PAGINA);

                        if (empleadosFiltrados.length === 0) {
                          return <tr><td colSpan="8" className="table-empty">No se encontraron empleados.</td></tr>;
                        }

                        return empleadosPagina.map(emp => {
                          const esActivo = String(emp.estado || 'Activo').trim().toLowerCase() === 'activo';
                          return (
                            <tr key={emp.id_empleado}>
                              <td><strong>#{emp.id_empleado}</strong></td>
                              <td><strong>{emp.nombre}</strong></td>
                              <td>{emp.telefono ? (String(emp.telefono).startsWith('+') ? String(emp.telefono) : `+52 ${emp.telefono}`) : '—'}</td>
                              <td>{emp.rol}</td>
                              <td>
                                {emp.username ? (
                                  <span className="pay-badge efectivo">@{emp.username}</span>
                                ) : (
                                  <span className="stock-status low">Sin usuario</span>
                                )}
                              </td>
                              <td>
                                <span className={`stock-status ${esActivo ? 'available' : 'out'}`}>
                                  {esActivo ? 'Activo' : 'Inactivo'}
                                </span>
                              </td>
                              <td>
                                {esActivo ? '—' : (emp.tiempo_inactivo || 'Menos de un día')}
                                {!esActivo && emp.fecha_inactivacion && (
                                  <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 3 }}>
                                    Desde {new Date(emp.fecha_inactivacion).toLocaleDateString('es-MX')}
                                  </div>
                                )}
                              </td>

                              <td>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                  <button type="button" className="btn-outline" onClick={() => abrirEditarEmpleado(emp)}>Editar</button>
                                  {!emp.username && (
                                    <button
                                      type="button"
                                      className="sales-detail-button"
                                      onClick={() => {
                                        setEmpleadoSeleccionado(emp);
                                        setModalCrearUsuarioAbierto(true);
                                      }}
                                    >
                                      Crear acceso
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    className="btn-outline"
                                    onClick={() => cambiarEstadoEmpleado(emp)}
                                  >
                                    {esActivo ? 'Desactivar' : 'Activar'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
                <div className="employees-pagination">
                  <span>Mostrando {empleadosFiltrados.length ? (Math.min((paginaEmpleados - 1) * EMPLEADOS_POR_PAGINA + 1, empleadosFiltrados.length)) : 0}–{Math.min(paginaEmpleados * EMPLEADOS_POR_PAGINA, empleadosFiltrados.length)} de {empleadosFiltrados.length} empleados</span>
                  <div>
                    <button type="button" className="btn-outline" disabled={paginaEmpleados <= 1} onClick={() => setPaginaEmpleados(p => Math.max(1, p - 1))}>Anterior</button>
                    <span>Página {Math.min(paginaEmpleados, Math.max(1, Math.ceil(empleadosFiltrados.length / EMPLEADOS_POR_PAGINA)))} de {Math.max(1, Math.ceil(empleadosFiltrados.length / EMPLEADOS_POR_PAGINA))}</span>
                    <button type="button" className="btn-outline" disabled={paginaEmpleados >= Math.ceil(empleadosFiltrados.length / EMPLEADOS_POR_PAGINA)} onClick={() => setPaginaEmpleados(p => p + 1)}>Siguiente</button>
                  </div>
                </div>
              </section>

              {confirmacionEstadoEmpleado && (
                <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget && !guardandoEmpleado){setConfirmacionEstadoEmpleado(null);setPasswordConfirmacionEstado('');}}}>
                  <section className="payment-modal employee-status-modal" role="dialog" aria-modal="true">
                    <div className={`purchase-dialog-icon ${confirmacionEstadoEmpleado.nuevoEstado === 'Inactivo' ? 'warning' : 'success'}`}>{confirmacionEstadoEmpleado.nuevoEstado === 'Inactivo' ? '!' : '✓'}</div>
                    <h3>{confirmacionEstadoEmpleado.nuevoEstado === 'Inactivo' ? '¿Desactivar acceso?' : '¿Activar acceso?'}</h3>
                    <p>Vas a cambiar el estado de <strong>{confirmacionEstadoEmpleado.empleado.nombre}</strong> a {confirmacionEstadoEmpleado.nuevoEstado.toLowerCase()}.</p>
                    {confirmacionEstadoEmpleado.nuevoEstado === 'Inactivo' && (
                      <div className="employee-status-password">
                        <label htmlFor="password-confirmar-estado">Contraseña de tu sesión actual</label>
                        <input
                          id="password-confirmar-estado"
                          type="password"
                          autoComplete="current-password"
                          placeholder="Ingresa tu contraseña"
                          value={passwordConfirmacionEstado}
                          onChange={e=>setPasswordConfirmacionEstado(e.target.value)}
                          onKeyDown={e=>{if(e.key==='Enter')confirmarCambioEstadoEmpleado();}}
                          disabled={guardandoEmpleado}
                        />
                        <small>Se solicita para confirmar que tienes autorización para desactivar el acceso.</small>
                      </div>
                    )}
                    <div className="modal-actions">
                      <button type="button" className="modal-secondary" onClick={()=>{setConfirmacionEstadoEmpleado(null);setPasswordConfirmacionEstado('');}} disabled={guardandoEmpleado}>Cancelar</button>
                      <button type="button" className="modal-primary" onClick={confirmarCambioEstadoEmpleado} disabled={guardandoEmpleado || (confirmacionEstadoEmpleado.nuevoEstado === 'Inactivo' && !passwordConfirmacionEstado.trim())}>{guardandoEmpleado ? 'Procesando...' : confirmacionEstadoEmpleado.nuevoEstado === 'Inactivo' ? 'Confirmar desactivación' : 'Confirmar activación'}</button>
                    </div>
                  </section>
                </div>
              )}
              {avisoEmpleado.visible && (
                <div className="modal-overlay employee-notice-overlay" onClick={e=>{if(e.target===e.currentTarget)setAvisoEmpleado(p=>({...p,visible:false}));}}>
                  <section className="payment-modal" role="alertdialog" aria-modal="true" style={{maxWidth:440,textAlign:'center'}}>
                    <div className={`purchase-dialog-icon ${avisoEmpleado.tipo}`}>{avisoEmpleado.tipo==='success'?'✓':'!'}</div>
                    <h3>{avisoEmpleado.titulo}</h3>
                    <p>{avisoEmpleado.texto}</p>
                    <div className="modal-actions"><button type="button" className="modal-primary" onClick={()=>setAvisoEmpleado(p=>({...p,visible:false}))}>Aceptar</button></div>
                  </section>
                </div>
              )}

              {/* MODAL REGISTRAR EMPLEADO */}
              {modalEmpleadoAbierto && (
                <div className="modal-overlay">
                  <div className="payment-modal">
                    <div className="modal-header">
                      <div>
                        <h3>{empleadoEditando ? 'Editar empleado' : 'Nuevo empleado'}</h3>
                        <p>{empleadoEditando ? 'Actualiza los datos y, si lo necesitas, establece una nueva contraseña de acceso.' : 'Ingresa la información básica del personal.'}</p>
                      </div>
                      <button type="button" className="modal-close" onClick={() => { setModalEmpleadoAbierto(false); setEmpleadoEditando(null); setPasswordEmpleadoEdicion(''); }}>×</button>
                    </div>
                    <form noValidate onSubmit={guardarEmpleado}>
                      <div className="cash-field">
                        <label>Nombre completo *</label>
                        <input
                          type="text"
                          maxLength="150"
                          value={formEmpleado.nombre}
                          onChange={e => setFormEmpleado({ ...formEmpleado, nombre: e.target.value })}
                        />
                        {!formEmpleado.nombre.trim() && (
                          <small className="field-hint field-hint-error">El nombre es obligatorio. Se permite incluso un solo carácter.</small>
                        )}
                      </div>
                      <div className="cash-field">
                        <label>Teléfono</label>
                        <div className="phone-input-wrap employee-phone-input">
                          <div className="employee-country-code">
                            <span>+</span>
                            <input type="tel" inputMode="numeric" aria-label="Lada o código de país" maxLength="4" placeholder="52" value={formEmpleado.lada} onChange={e => setFormEmpleado({ ...formEmpleado, lada: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
                          </div>
                          <input type="tel" inputMode="numeric" autoComplete="tel-national" maxLength="10" placeholder="10 dígitos"
                            value={formEmpleado.telefono}
                            onChange={e => setFormEmpleado({ ...formEmpleado, telefono: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
                        </div>
                        <small className={
                          (formEmpleado.telefono && (!/^\d{1,4}$/.test(String(formEmpleado.lada || '')) || !/^\d{10}$/.test(String(formEmpleado.telefono || '')))) ||
                          (!formEmpleado.telefono && formEmpleado.lada && !/^\d{1,4}$/.test(String(formEmpleado.lada)))
                            ? "field-hint field-hint-error" : "field-hint"
                        }>
                          {formEmpleado.telefono
                            ? ((!/^\d{1,4}$/.test(String(formEmpleado.lada || '')) || !/^\d{10}$/.test(String(formEmpleado.telefono || '')))
                              ? 'Completa una lada de 1 a 4 dígitos y un número nacional de exactamente 10 dígitos.'
                              : 'Teléfono válido.')
                            : 'Opcional. Si lo agregas, usa una lada de 1 a 4 dígitos y 10 dígitos nacionales.'}
                        </small>
                      </div>
                      <div className="modal-section">
                        <label className="modal-label">Rol del sistema</label>
                        <select
                          className="field-select"
                          value={formEmpleado.id_rol}
                          onChange={e => setFormEmpleado({ ...formEmpleado, id_rol: Number(e.target.value) })}
                        >
                          <option value={1}>Empleado (Punto de Venta e Inventario)</option>
                          <option value={2}>Administrador (Acceso completo)</option>
                        </select>
                      </div>
                      {empleadoEditando?.username && (
                        <div className="cash-field">
                          <label>Nueva contraseña de acceso (opcional)</label>
                          <input
                            type="password"
                            autoComplete="new-password"
                            maxLength="8"
                            value={passwordEmpleadoEdicion}
                            onChange={e=>setPasswordEmpleadoEdicion(e.target.value)}
                            placeholder="Dejar vacío para conservar la actual"
                            aria-describedby="password-edicion-reglas"
                          />
                          <small
                            id="password-edicion-reglas"
                            className={passwordEmpleadoEdicion && validarPasswordEmpleado(passwordEmpleadoEdicion) ? "field-hint field-hint-error" : "field-hint"}
                          >
                            {passwordEmpleadoEdicion
                              ? (validarPasswordEmpleado(passwordEmpleadoEdicion) || 'Contraseña válida.')
                              : 'Por seguridad, la contraseña actual nunca se muestra. Déjala vacía para conservarla. Si la cambias, debe cumplir las mismas reglas de creación: 4 a 8 caracteres, mínimo 4 letras, sin espacios ni secuencias.'}
                          </small>
                        </div>
                      )}
                      <div className="modal-actions">
                        <button type="button" className="modal-secondary" onClick={() => { setModalEmpleadoAbierto(false); setEmpleadoEditando(null); setPasswordEmpleadoEdicion(''); }}>Cancelar</button>
                        <button type="submit" className="modal-primary" disabled={guardandoEmpleado}>{guardandoEmpleado ? 'Guardando...' : (empleadoEditando ? 'Guardar cambios' : 'Guardar empleado')}</button>
                      </div>
                    </form>
                  </div>
                </div>
            )}

            {/* MODAL CREAR USUARIO Y CONTRASEÑA */}
            {modalCrearUsuarioAbierto && (
              <div className="modal-overlay">
                <div className="payment-modal">
                  <div className="modal-header">
                    <div>
                      <h3>Crear acceso de usuario</h3>
                      <p>Asigna credenciales para {empleadoSeleccionado?.nombre}.</p>
                    </div>
                    <button type="button" className="modal-close" onClick={() => setModalCrearUsuarioAbierto(false)}>×</button>
                  </div>
                  <form noValidate onSubmit={guardarUsuarioEmpleado}>
                    <div className="cash-field">
                      <label>Usuario (Username) *</label>
                      <input
                        type="text"
                        maxLength="50"
                        value={formUsuario.username}
                        onChange={e => setFormUsuario({ ...formUsuario, username: e.target.value })}
                        aria-describedby="username-reglas"
                      />
                      <small id="username-reglas" className={formUsuario.username && validarUsernameEmpleado(formUsuario.username) ? "field-hint field-hint-error" : "field-hint"}>
                        {formUsuario.username ? (validarUsernameEmpleado(formUsuario.username) || 'Usuario válido.') : 'Mínimo 6 letras. Sin espacios; se permiten números, punto, guion y guion bajo.'}
                      </small>
                    </div>
                    <div className="cash-field">
                      <label>Contraseña *</label>
                      <input
                        type="password"
                        value={formUsuario.password}
                        maxLength="8"
                        autoComplete="new-password"
                        onChange={e => setFormUsuario({ ...formUsuario, password: e.target.value })}
                        aria-describedby="password-reglas"
                      />
                      <small id="password-reglas" className={formUsuario.password && validarPasswordEmpleado(formUsuario.password) ? "field-hint field-hint-error" : "field-hint"}>
                        {formUsuario.password ? (validarPasswordEmpleado(formUsuario.password) || 'Contraseña válida.') : 'De 4 a 8 caracteres, sin espacios. Evita secuencias como abcd o 1234 y caracteres repetidos.'}
                      </small>
                    </div>
                    <div className="modal-actions">
                      <button type="button" className="modal-secondary" onClick={() => setModalCrearUsuarioAbierto(false)}>Cancelar</button>
                      <button type="submit" className="modal-primary" disabled={guardandoEmpleado}>{guardandoEmpleado ? "Creando..." : "Crear usuario"}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </main>
        )}

        {/* OTRAS VISTAS DE GERENCIA EN PREPARACIÓN */}
        {seccionesGerencia[vistaActual] && vistaActual !== 'proveedores' && vistaActual !== 'reportes' && vistaActual !== 'Contabilidad' && (
          <main className="management-page">
            <div className="management-page-header"><div><h2 className="title">{seccionesGerencia[vistaActual].titulo}</h2><div className="subtitle">{seccionesGerencia[vistaActual].descripcion}</div></div><span className="management-preview-badge">Boceto</span></div>
            <section className="management-empty-state"><div className="management-empty-icon">{seccionesGerencia[vistaActual].icono}</div><h3>{seccionesGerencia[vistaActual].mensaje}</h3><p>{seccionesGerencia[vistaActual].detalle}</p><div className="management-placeholder-panel" aria-hidden="true"><div className="management-placeholder-line"></div><div className="management-placeholder-line short"></div><div className="management-placeholder-line"></div></div><button type="button" className="management-back-btn" onClick={() => setVistaActual('pos')}>Volver al punto de venta</button></section>
          </main>
        )}

        {/* VISTA GERENCIA VENTAS */}
        {vistaActual === 'gerencia-ventas' && (
          <div className="inventory-view">
            <div className="inventory-header sales-header">
              <div>
                <h2 className="title">Historial de Ventas y Arqueo de Caja</h2>
                <div className="subtitle">Consulta, filtra e imprime los movimientos de caja.</div>
              </div>
              <div className="sales-header-actions">
                <button type="button" className="btn-outline" onClick={() => { cargarVentasGerencia(); setPaginaVentas(1); }} disabled={cargandoVentas}>{cargandoVentas ? 'Cargando…' : '↻ Actualizar'}</button>
                <button type="button" className="management-btn" onClick={() => imprimirHistorialVentas(true)}>▤ Imprimir todo el historial</button>
                <button type="button" className="management-btn" onClick={() => imprimirHistorialVentas(false)}>▤ Imprimir periodo/filtros</button>
              </div>
            </div>

            <section className="sales-filters-panel">
              <div className="sales-filter-field sales-search-field">
                <label htmlFor="busqueda-ventas">Buscar venta</label>
                <input id="busqueda-ventas" type="search" value={busquedaVentas}
                  onChange={e => { setBusquedaVentas(e.target.value); setPaginaVentas(1); }}
                  placeholder="Folio o nombre de producto..." />
              </div>
              <div className="sales-filter-field">
                <label htmlFor="filtro-metodo-ventas">Método de pago</label>
                <select id="filtro-metodo-ventas" value={filtroMetodoVentas}
                  onChange={e => { setFiltroMetodoVentas(e.target.value); setPaginaVentas(1); }}>
                  <option value="todos">Todos los métodos</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                </select>
              </div>
              <div className="sales-filter-field">
                <label htmlFor="fecha-inicio-ventas">Desde</label>
                <input id="fecha-inicio-ventas" type="date" value={fechaInicioVentas}
                  max={fechaHoyVentas}
                  onChange={e => {
                    const nuevaFecha = e.target.value;
                    if (nuevaFecha && nuevaFecha > fechaHoyVentas) return;
                    setFechaInicioVentas(nuevaFecha);
                    // Si el inicio supera al fin actual, mueve el fin al mismo día.
                    if (nuevaFecha && fechaFinVentas && fechaFinVentas < nuevaFecha) {
                      setFechaFinVentas(nuevaFecha);
                    }
                    setPaginaVentas(1);
                  }} />
              </div>
              <div className="sales-filter-field">
                <label htmlFor="fecha-fin-ventas">Hasta</label>
                <input id="fecha-fin-ventas" type="date" value={fechaFinVentas}
                  min={fechaInicioVentas || undefined}
                  max={fechaHoyVentas}
                  onChange={e => {
                    const nuevaFecha = e.target.value;
                    if (nuevaFecha && (nuevaFecha > fechaHoyVentas ||
                      (fechaInicioVentas && nuevaFecha < fechaInicioVentas))) return;
                    setFechaFinVentas(nuevaFecha);
                    setPaginaVentas(1);
                  }} />
              </div>
              <button type="button" className="sales-clear-filters" onClick={limpiarFiltrosVentas}>Limpiar filtros</button>
            </section>

            <div className="kpi-grid">
              <div className="kpi-card brown">
                <div className="kpi-label">Ingresos Totales</div>
                <div className="kpi-value">
                  {money(ventasFiltradas.reduce((sum, v) => sum + v.total, 0))}
                </div>
              </div>
              <div className="kpi-card green">
                <div className="kpi-label">Efectivo Recibido</div>
                <div className="kpi-value">
                  {money(ventasFiltradas.filter(v => String(v.metodo_pago || '').toLowerCase() === 'efectivo').reduce((sum, v) => sum + (v.efectivo_recibido || v.total), 0))}
                </div>
              </div>
              <div className="kpi-card amber">
                <div className="kpi-label">Cambio Entregado</div>
                <div className="kpi-value">
                  {money(ventasFiltradas.reduce((sum, v) => sum + (v.cambio_entregado || 0), 0))}
                </div>
              </div>
              <div className="kpi-card blue">
                <div className="kpi-label">Total Tarjetas</div>
                <div className="kpi-value">
                  {money(ventasFiltradas.filter(v => String(v.metodo_pago || '').toLowerCase() === 'tarjeta').reduce((sum, v) => sum + v.total, 0))}
                </div>
              </div>
            </div>

            <div className="sales-results-caption">
              <span><strong>{ventasFiltradas.length}</strong> ventas encontradas</span>
              <span>12 registros por página · puedes imprimir todo el historial o el periodo filtrado</span>
            </div>
            <div className="inventory-table-wrapper sales-table-wrapper">
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
                  {cargandoVentas ? (
                    <tr><td colSpan="7" className="table-empty">Cargando historial y detalles de ventas…</td></tr>
                  ) : ventasPaginaActual.map(v => (
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
                  {!cargandoVentas && ventasFiltradas.length === 0 && (
                    <tr>
                      <td colSpan="7" className="table-empty">
                        {ventasGerencia.length === 0 ? 'Todavía no hay ventas registradas.' : 'No hay ventas que coincidan con los filtros seleccionados.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Documento completo para impresión: incluye TODAS las ventas filtradas,
                sin limitarse a los 12 registros de la página visible, y sus productos. */}
            <section className="sales-print-only">
              <h2>{tituloImpresionVentas}</h2>
              <p>Registros incluidos: {(ventasParaImprimir || ventasFiltradas).length}</p>
              <p>Periodo: {ventasParaImprimir === ventasGerencia ? 'Todo el historial' : `${fechaInicioVentas || 'Inicio'} — ${fechaFinVentas || 'Actualidad'}`}</p>
              <p>Total vendido: <strong>{money((ventasParaImprimir || ventasFiltradas).reduce((sum, v) => sum + Number(v.total || 0), 0))}</strong></p>
              {(ventasParaImprimir || ventasFiltradas).map(v => (
                <article className="sales-print-record" key={`print-${v.folio}`}>
                  <div className="sales-print-record-heading">
                    <strong>Ticket #TK-{v.folio}</strong>
                    <span>{new Date(v.fecha_hora).toLocaleString('es-MX')}</span>
                    <span>{v.metodo_pago}</span>
                    <span>Atendió: {v.nombre_usuario || v.username || 'No disponible'}</span>
                  </div>
                  <table className="sales-print-detail-table">
                    <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr></thead>
                    <tbody>
                      {(v.detalles || []).map((d, idx) => (
                        <tr key={`${v.folio}-${idx}`}>
                          <td>{d.nombre}</td><td>{d.cantidad}</td><td>{money(d.precio)}</td><td>{money(d.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="sales-print-record-total">Total: {money(v.total)} · Recibido: {money(v.efectivo_recibido || v.total)} · Cambio: {money(v.cambio_entregado || 0)}</div>
                </article>
              ))}
            </section>

            {ventasFiltradas.length > 0 && (
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
                  {'–'}{Math.min(paginaVentasSegura * VENTAS_POR_PAGINA, ventasFiltradas.length)}
                  {' '}de {ventasFiltradas.length} ventas
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
                    <div><span>Atendió</span><strong>{ticketSeleccionado.nombre_usuario || ticketSeleccionado.username || 'No disponible'}</strong></div>
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
                            <td>
                              <strong>{d.nombre}</strong>
                              {d.personalizacion && <small style={{ display: 'block', color: '#64748b', marginTop: '3px' }}>{d.personalizacion}</small>}
                              {d.id_producto_padre && <small style={{ display: 'block', color: '#64748b' }}>Extra asociado a la bebida principal</small>}
                            </td>
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
                    <button type="button" onClick={imprimirTicketVenta} className="management-btn">▤ Imprimir ticket</button>
                  </div>
                </section>
              </div>
            )}
          </div>
        )}
{/* VISTA CONTABILIDAD */}
{vistaActual === 'Contabilidad' && (
  <div className="inventory-view accounting-purchases-view">
    <div className="inventory-header"><div><h2 className="title">Contabilidad</h2><div className="subtitle">Resumen de ingresos, egresos y administración de gastos.</div></div><button type="button" className="management-btn" onClick={() => { cargarContabilidad(); cargarNominas(); }} disabled={cargandoContabilidad}>↻ Actualizar</button></div>
    <section className="accounting-summary-grid">
      <article className="accounting-summary-card income"><span>Ingresos por ventas</span><strong>{money(contabilidadData.resumen?.ingresos)}</strong></article>
      <article className="accounting-summary-card expenses"><span>Egresos registrados</span><strong>{money(contabilidadData.resumen?.egresos)}</strong></article>
      <article className="accounting-summary-card balance"><span>Balance acumulado</span><strong>{money(Number(contabilidadData.resumen?.ingresos || 0) - Number(contabilidadData.resumen?.egresos || 0))}</strong></article>
    </section>

    <section className="inventory-table-wrapper accounting-admin-card">
      <div className="accounting-section-heading"><div><h3>Gastos adicionales</h3><p className="subtitle">Consulta, filtra e imprime gastos que no sean compras ni nóminas.</p></div><button type="button" className="btn-primary" onClick={() => setModalGastoExtra(true)}>＋ Registrar gasto</button></div>
      <div className="accounting-date-toolbar"><div className="accounting-date-fields"><label>Desde<input type="date" value={fechaInicioGastos} onChange={e => setFechaInicioGastos(e.target.value)} /></label><label>Hasta<input type="date" value={fechaFinGastos} onChange={e => setFechaFinGastos(e.target.value)} /></label><button type="button" className="btn-primary" onClick={() => aplicarFiltroGastos(false)}>Filtrar</button><button type="button" className="btn-outline" onClick={() => {setFechaInicioGastos('');setFechaFinGastos('');aplicarFiltroGastos(true);}}>Todo el historial</button></div><button type="button" className="btn-outline" onClick={() => imprimirSeccionContable('gastos', gastosFiltrados.length, 'gastos')}>Imprimir gastos</button></div>
      <div className="accounting-count">{gastosFiltrados.length} gastos encontrados</div>
      <div className="table-responsive"><table className="inventory-table"><thead><tr><th>Fecha</th><th>Concepto</th><th>Categoría</th><th>Método</th><th>Importe</th><th>Detalle</th></tr></thead><tbody>
        {gastosPaginaActual.map(g => <tr key={g.id_gasto}><td>{formatearFechaContable(g.fecha_gasto)}</td><td><strong>{g.concepto}</strong></td><td>{g.categoria}</td><td>{g.metodo_pago || '—'}</td><td><strong>{money(g.monto)}</strong></td><td><button type="button" className="btn-outline" onClick={() => setGastoDetalleAbierto(g)}>Ver detalle</button></td></tr>)}
        {!gastosFiltrados.length && <tr><td colSpan="6" className="table-empty">No hay gastos adicionales en el periodo seleccionado.</td></tr>}
      </tbody></table></div>
      {gastosFiltrados.length > 12 && <div className="pagination-controls purchases-pagination"><button disabled={paginaGastosSegura===1} onClick={()=>setPaginaGastos(p=>Math.max(1,p-1))}>Anterior</button><span>Página {paginaGastosSegura} de {totalPaginasGastos} · {gastosPaginaActual.length} de {gastosFiltrados.length}</span><button disabled={paginaGastosSegura>=totalPaginasGastos} onClick={()=>setPaginaGastos(p=>Math.min(totalPaginasGastos,p+1))}>Siguiente</button></div>}
    </section>

    <section className="inventory-table-wrapper accounting-admin-card">
      <div className="accounting-section-heading"><div><h3>Nóminas</h3><p className="subtitle">Configuración de sueldo mensual y pagos semanales recurrentes.</p></div><button type="button" className="btn-primary" onClick={() => { cargarEmpleados(); setModalNomina(true); }}>＋ Configurar nómina</button></div>
      <div className="payroll-week-control"><label>Fecha de la semana a pagar<input type="date" value={fechaSemanaNomina} onChange={e => setFechaSemanaNomina(e.target.value)} /></label><span>Pago semanal = sueldo mensual × 12 ÷ 52</span></div>
      <div className="table-responsive"><table className="inventory-table"><thead><tr><th>Empleado</th><th>Sueldo mensual</th><th>Pago semanal</th><th>Estado</th><th>Acción</th></tr></thead><tbody>
        {nominasPaginaActual.map(n => { const pagada = pagosNomina.some(p => Number(p.id_nomina) === Number(n.id_nomina) && String(p.semana_inicio).slice(0,10) === obtenerInicioSemana(fechaSemanaNomina)); return <tr key={n.id_nomina}><td><strong>{n.nombre}</strong></td><td>{money(n.sueldo_mensual)}</td><td>{money(n.pago_semanal)}</td><td>{pagada ? <span className="payroll-paid">Pagada esta semana</span> : 'Pendiente'}</td><td><button type="button" className="btn-outline" disabled={pagada || guardandoContable} onClick={() => registrarPagoNomina(n)}>{pagada ? 'Registrado' : 'Registrar pago'}</button></td></tr>; })}
        {!nominas.length && <tr><td colSpan="5" className="table-empty">Aún no hay nóminas configuradas.</td></tr>}
      </tbody></table></div>
      {nominas.length > 12 && <div className="pagination-controls purchases-pagination"><button disabled={paginaNominasSegura===1} onClick={()=>setPaginaNominas(p=>Math.max(1,p-1))}>Anterior</button><span>Página {paginaNominasSegura} de {totalPaginasNominas} · {nominasPaginaActual.length} de {nominas.length}</span><button disabled={paginaNominasSegura>=totalPaginasNominas} onClick={()=>setPaginaNominas(p=>Math.min(totalPaginasNominas,p+1))}>Siguiente</button></div>}
      <div className="accounting-subheading"><div><h4>Historial de pagos de nómina</h4><p className="subtitle">Filtra e imprime los pagos semanales registrados.</p></div></div>
      <div className="accounting-date-toolbar"><div className="accounting-date-fields"><label>Desde<input type="date" value={fechaInicioPagos} onChange={e=>setFechaInicioPagos(e.target.value)} /></label><label>Hasta<input type="date" value={fechaFinPagos} onChange={e=>setFechaFinPagos(e.target.value)} /></label><button type="button" className="btn-primary" onClick={()=>aplicarFiltroPagos(false)}>Filtrar</button><button type="button" className="btn-outline" onClick={()=>{setFechaInicioPagos('');setFechaFinPagos('');aplicarFiltroPagos(true);}}>Todo el historial</button></div><button type="button" className="btn-outline" onClick={()=>imprimirSeccionContable('nominas',pagosFiltrados.length,'pagos de nómina')}>Imprimir nóminas</button></div>
      <div className="accounting-count">{pagosFiltrados.length} pagos encontrados</div>
      <div className="table-responsive"><table className="inventory-table"><thead><tr><th>Fecha de pago</th><th>Empleado</th><th>Semana correspondiente</th><th>Método</th><th>Importe</th><th>Detalle</th></tr></thead><tbody>
        {pagosPaginaActual.map(p=><tr key={p.id_pago_nomina}><td>{formatearFechaContable(p.fecha_pago)}</td><td><strong>{p.nombre}</strong></td><td>{formatearFechaContable(p.semana_inicio)}</td><td>{p.metodo_pago || '—'}</td><td><strong>{money(p.monto)}</strong></td><td><button type="button" className="btn-outline" onClick={()=>setPagoDetalleAbierto(p)}>Ver detalle</button></td></tr>)}
        {!pagosFiltrados.length && <tr><td colSpan="6" className="table-empty">No hay pagos de nómina en el periodo seleccionado.</td></tr>}
      </tbody></table></div>
      {pagosFiltrados.length > 12 && <div className="pagination-controls purchases-pagination"><button disabled={paginaPagosSegura===1} onClick={()=>setPaginaPagos(p=>Math.max(1,p-1))}>Anterior</button><span>Página {paginaPagosSegura} de {totalPaginasPagos} · {pagosPaginaActual.length} de {pagosFiltrados.length}</span><button disabled={paginaPagosSegura>=totalPaginasPagos} onClick={()=>setPaginaPagos(p=>Math.min(totalPaginasPagos,p+1))}>Siguiente</button></div>}
    </section>

    {modalGastoExtra && <div className="purchase-ticket-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setModalGastoExtra(false);}}><form className="accounting-form-modal" onSubmit={guardarGastoExtra}><div className="purchase-ticket-actions"><h3>Registrar gasto adicional</h3><button type="button" className="btn-outline" onClick={()=>setModalGastoExtra(false)}>Cerrar ×</button></div><label>Concepto<input required value={formGastoExtra.concepto} onChange={e=>setFormGastoExtra({...formGastoExtra,concepto:e.target.value})} placeholder="Ej. Transporte" /></label><label>Categoría<select value={formGastoExtra.categoria} onChange={e=>setFormGastoExtra({...formGastoExtra,categoria:e.target.value})}><option>Transporte</option><option>Mantenimiento</option><option>Servicios</option><option>Limpieza</option><option>Otros</option></select></label><label>Importe<input required type="number" min="0.01" step="0.01" value={formGastoExtra.monto} onChange={e=>setFormGastoExtra({...formGastoExtra,monto:e.target.value})} /></label><label>Fecha<input required type="date" value={formGastoExtra.fecha_gasto} onChange={e=>setFormGastoExtra({...formGastoExtra,fecha_gasto:e.target.value})} /></label><label>Método de pago<select value={formGastoExtra.metodo_pago} onChange={e=>setFormGastoExtra({...formGastoExtra,metodo_pago:e.target.value})}><option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option></select></label><label>Observaciones<textarea value={formGastoExtra.observaciones} onChange={e=>setFormGastoExtra({...formGastoExtra,observaciones:e.target.value})} /></label><div className="modal-actions"><button type="button" className="btn-outline" onClick={()=>setModalGastoExtra(false)}>Cancelar</button><button className="btn-primary" type="submit" disabled={guardandoContable}>{guardandoContable?'Guardando...':'Guardar gasto'}</button></div></form></div>}
    {modalNomina && <div className="purchase-ticket-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setModalNomina(false);}}><form className="accounting-form-modal" onSubmit={guardarConfiguracionNomina}><div className="purchase-ticket-actions"><h3>Configurar nómina semanal</h3><button type="button" className="btn-outline" onClick={()=>setModalNomina(false)}>Cerrar ×</button></div><label>Empleado<select required value={formNomina.id_empleado} onChange={e=>setFormNomina({...formNomina,id_empleado:e.target.value})}><option value="">Selecciona un empleado</option>{empleados.filter(e=>!e.estado||e.estado.toLowerCase()==='activo').map(e=><option key={e.id_empleado} value={e.id_empleado}>{e.nombre}</option>)}</select></label><label>Sueldo mensual (MXN)<input required type="number" min="0.01" step="0.01" value={formNomina.sueldo_mensual} onChange={e=>setFormNomina({...formNomina,sueldo_mensual:e.target.value})} /></label>{Number(formNomina.sueldo_mensual)>0&&<p className="accounting-mini-note">Pago semanal calculado: <strong>{money(Number(formNomina.sueldo_mensual)*12/52)}</strong></p>}<div className="modal-actions"><button type="button" className="btn-outline" onClick={()=>setModalNomina(false)}>Cancelar</button><button className="btn-primary" type="submit" disabled={guardandoContable}>{guardandoContable?'Guardando...':'Guardar nómina'}</button></div></form></div>}
    {gastoDetalleAbierto && <div className="purchase-ticket-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setGastoDetalleAbierto(null);}}><section className="accounting-detail-modal" role="dialog" aria-modal="true"><div className="purchase-ticket-actions"><h3>Detalle del gasto</h3><button className="btn-outline" onClick={()=>setGastoDetalleAbierto(null)}>Cerrar ×</button></div><dl><dt>Concepto</dt><dd>{gastoDetalleAbierto.concepto}</dd><dt>Categoría</dt><dd>{gastoDetalleAbierto.categoria}</dd><dt>Fecha</dt><dd>{formatearFechaContable(gastoDetalleAbierto.fecha_gasto)}</dd><dt>Método de pago</dt><dd>{gastoDetalleAbierto.metodo_pago||'—'}</dd><dt>Importe</dt><dd>{money(gastoDetalleAbierto.monto)}</dd><dt>Observaciones</dt><dd>{gastoDetalleAbierto.observaciones||'Sin observaciones'}</dd></dl></section></div>}
    {pagoDetalleAbierto && <div className="purchase-ticket-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setPagoDetalleAbierto(null);}}><section className="accounting-detail-modal" role="dialog" aria-modal="true"><div className="purchase-ticket-actions"><h3>Detalle del pago de nómina</h3><button className="btn-outline" onClick={()=>setPagoDetalleAbierto(null)}>Cerrar ×</button></div><dl><dt>Empleado</dt><dd>{pagoDetalleAbierto.nombre}</dd><dt>Fecha de pago</dt><dd>{formatearFechaContable(pagoDetalleAbierto.fecha_pago)}</dd><dt>Semana correspondiente</dt><dd>{formatearFechaContable(pagoDetalleAbierto.semana_inicio)}</dd><dt>Método de pago</dt><dd>{pagoDetalleAbierto.metodo_pago||'—'}</dd><dt>Importe</dt><dd>{money(pagoDetalleAbierto.monto)}</dd></dl></section></div>}
    {confirmacionContable && <div className="purchase-ticket-overlay"><section className="accounting-detail-modal" role="dialog" aria-modal="true"><h3>{confirmacionContable.titulo}</h3><p>{confirmacionContable.texto}</p><div className="modal-actions"><button className="btn-outline" onClick={()=>setConfirmacionContable(null)}>Cancelar</button><button className="btn-primary" onClick={confirmacionContable.confirmar}>Confirmar pago</button></div></section></div>}
    {avisoContable && <div className="purchase-ticket-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setAvisoContable(null);}}><section className="accounting-detail-modal accounting-notice" role="dialog" aria-modal="true"><div className={`accounting-notice-icon ${avisoContable.tipo}`}>{avisoContable.tipo==='success'?'✓':avisoContable.tipo==='error'?'!':'i'}</div><h3>{avisoContable.titulo}</h3><p>{avisoContable.texto}</p><div className="modal-actions"><button className="btn-primary" onClick={()=>setAvisoContable(null)}>Aceptar</button></div></section></div>}

    <section className="inventory-table-wrapper purchases-history-card">
      <div className="purchases-history-heading">
        <div>
          <h3>Historial de compras a proveedores</h3>
          <p className="subtitle">Selecciona un periodo o consulta todas las compras. Puedes abrir cada ticket aquí mismo.</p>
        </div>
        <div className="purchases-filter">
          <label>Desde
            <input type="date" value={fechaInicioCompras} onChange={e => setFechaInicioCompras(e.target.value)} />
          </label>
          <label>Hasta
            <input type="date" value={fechaFinCompras} onChange={e => setFechaFinCompras(e.target.value)} />
          </label>
          <button type="button" className="btn-primary" onClick={() => aplicarFiltroCompras(false)}>Aplicar filtro</button>
          <button type="button" className="btn-outline" onClick={() => { setFechaInicioCompras(''); setFechaFinCompras(''); aplicarFiltroCompras(true); }}>Todas las fechas</button>
        </div>
      </div>

      <div className="purchases-toolbar">
        <span>{comprasFiltradas.length} {comprasFiltradas.length === 1 ? 'compra encontrada' : 'compras encontradas'}</span>
        <button type="button" className="btn-outline" onClick={imprimirComprasFiltradas} disabled={cargandoContabilidad || !comprasFiltradas.length}>
          Imprimir compras {periodoComprasAplicado.inicio || periodoComprasAplicado.fin ? 'del filtro' : ' (todas)'}
        </button>
      </div>

      <div style={{overflowX:'auto'}}>
        <table className="inventory-table">
          <thead><tr><th>Folio</th><th>Fecha</th><th>Proveedor</th><th>Artículos</th><th>Método de pago</th><th>Total</th><th>Ticket</th></tr></thead>
          <tbody>
            {cargandoContabilidad ? (
              <tr><td colSpan="7" className="table-empty">Cargando historial de compras...</td></tr>
            ) : comprasPaginaActual.map(compra => (
              <tr key={compra.id_compra}>
                <td><strong>CP-{compra.id_compra}</strong></td>
                <td>{formatearFechaContable(compra.fecha_compra)}</td>
                <td>{compra.proveedor}</td>
                <td>{(compra.detalles || []).length}</td>
                <td>{compra.metodo_pago}</td>
                <td><strong>{money(Number(compra.total))}</strong></td>
                <td><button type="button" className="btn-outline" onClick={() => setCompraTicketAbierta(compra)}>Ver ticket</button></td>
              </tr>
            ))}
            {!cargandoContabilidad && !comprasFiltradas.length && (
              <tr><td colSpan="7" className="table-empty">No hay compras registradas en las fechas seleccionadas.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {comprasFiltradas.length > COMPRAS_POR_PAGINA && (
        <div className="pagination-controls purchases-pagination">
          <button type="button" disabled={paginaComprasSegura === 1} onClick={() => setPaginaCompras(p => Math.max(1, p - 1))}>Anterior</button>
          <span>Página {paginaComprasSegura} de {totalPaginasCompras} · mostrando {comprasPaginaActual.length} de {comprasFiltradas.length} compras</span>
          <button type="button" disabled={paginaComprasSegura >= totalPaginasCompras} onClick={() => setPaginaCompras(p => Math.min(totalPaginasCompras, p + 1))}>Siguiente</button>
        </div>
      )}
    </section>

    {compraTicketAbierta && (
      <div className="purchase-ticket-overlay" onMouseDown={e => { if (e.target === e.currentTarget) setCompraTicketAbierta(null); }}>
        <section className="purchase-ticket-modal" role="dialog" aria-modal="true" aria-label={`Ticket de compra CP-${compraTicketAbierta.id_compra}`}>
          <div className="purchase-ticket-actions">
            <span>Detalle de compra</span>
            <button type="button" className="btn-outline" onClick={() => setCompraTicketAbierta(null)}>Cerrar ×</button>
          </div>
          <div className="purchase-ticket-paper">
            <header className="purchase-ticket-header">
              <div><h2>CAFETERÍA ORIGEN</h2><strong>Ticket de compra CP-{compraTicketAbierta.id_compra}</strong><div>Proveedor: {compraTicketAbierta.proveedor}</div><div><strong>Realizó:</strong> {compraTicketAbierta.nombre_usuario || compraTicketAbierta.username || 'No registrado'}{compraTicketAbierta.username ? ` (@${compraTicketAbierta.username})` : ''}{compraTicketAbierta.rol_usuario ? ` · ${compraTicketAbierta.rol_usuario}` : ''}</div></div>
              <div><div>Fecha: {formatearFechaContable(compraTicketAbierta.fecha_compra)}</div><div>Método: {compraTicketAbierta.metodo_pago}</div><div>Estado: {compraTicketAbierta.estado || 'Recibida'}</div></div>
            </header>
            <div className="purchase-ticket-table-wrap">
              <table className="inventory-table">
                <thead><tr><th>Artículo</th><th>Tipo</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {(compraTicketAbierta.detalles || []).map((detalle, i) => (
                    <tr key={detalle.id_detalle_compra || i}>
                      <td><strong>{detalle.nombre_articulo}</strong></td>
                      <td>{detalle.tipo_articulo === 'insumo' ? 'Insumo' : 'Producto'}</td>
                      <td>{Number(detalle.cantidad)} {detalle.unidad || ''}</td>
                      <td>{money(Number(detalle.precio_unitario))}</td>
                      <td><strong>{money(Number(detalle.subtotal))}</strong></td>
                    </tr>
                  ))}
                  {!(compraTicketAbierta.detalles || []).length && <tr><td colSpan="5" className="table-empty">Esta compra no tiene artículos detallados.</td></tr>}
                </tbody>
              </table>
            </div>
            {compraTicketAbierta.observaciones && <p className="purchase-ticket-notes"><strong>Observaciones:</strong> {compraTicketAbierta.observaciones}</p>}
            <div className="purchase-ticket-total">TOTAL: {money(Number(compraTicketAbierta.total))}</div>
          </div>
        </section>
      </div>
    )}

    {/* Área exclusiva de impresión: incluye todas las compras del filtro, sin paginación. */}
    <section className="purchases-print-area" aria-label="Compras para impresión">
      <header className="purchases-print-header">
        <h1>CAFETERÍA ORIGEN</h1>
        <h2>HISTORIAL DE COMPRAS A PROVEEDORES</h2>
        <p>Periodo: {periodoComprasAplicado.inicio || periodoComprasAplicado.fin
          ? `${periodoComprasAplicado.inicio || 'Inicio del historial'} al ${periodoComprasAplicado.fin || 'Fecha más reciente'}`
          : 'Todas las fechas'}</p>
        <p>Fecha de impresión: {new Date().toLocaleString('es-MX')}</p>
      </header>
      {comprasFiltradas.map(compra => (
        <article className="purchase-print-ticket" key={`print-${compra.id_compra}`}>
          <div className="purchase-print-ticket-head">
            <div><h3>Ticket CP-{compra.id_compra}</h3><strong>{compra.proveedor}</strong></div>
            <div>Fecha: {formatearFechaContable(compra.fecha_compra)}<br/>Pago: {compra.metodo_pago}<br/>Estado: {compra.estado || 'Recibida'}<br/>Realizó: {compra.nombre_usuario || compra.username || 'No registrado'}{compra.username ? ` (@${compra.username})` : ''}{compra.rol_usuario ? ` · ${compra.rol_usuario}` : ''}</div>
          </div>
          <table className="purchase-print-table">
            <thead><tr><th>Artículo</th><th>Tipo</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr></thead>
            <tbody>{(compra.detalles || []).map((d, i) => (
              <tr key={d.id_detalle_compra || i}><td>{d.nombre_articulo}</td><td>{d.tipo_articulo === 'insumo' ? 'Insumo' : 'Producto'}</td><td>{Number(d.cantidad)} {d.unidad || ''}</td><td>{money(Number(d.precio_unitario))}</td><td>{money(Number(d.subtotal))}</td></tr>
            ))}</tbody>
          </table>
          {compra.observaciones && <p>Observaciones: {compra.observaciones}</p>}
          <div className="purchase-print-total">TOTAL: {money(Number(compra.total))}</div>
        </article>
      ))}
    </section>
  </div>
)}

    <section className="accounting-print-area accounting-gastos-print"><h1>CAFETERÍA ORIGEN</h1><h2>HISTORIAL DE GASTOS ADICIONALES</h2><p>Periodo: {periodoGastosAplicado.inicio||periodoGastosAplicado.fin?`${periodoGastosAplicado.inicio||'Inicio'} al ${periodoGastosAplicado.fin||'Fecha reciente'}`:'Todo el historial'}</p><table><thead><tr><th>Fecha</th><th>Concepto</th><th>Categoría</th><th>Método</th><th>Importe</th><th>Observaciones</th></tr></thead><tbody>{gastosFiltrados.map(g=><tr key={`pg-${g.id_gasto}`}><td>{formatearFechaContable(g.fecha_gasto)}</td><td>{g.concepto}</td><td>{g.categoria}</td><td>{g.metodo_pago||'—'}</td><td>{money(g.monto)}</td><td>{g.observaciones||'—'}</td></tr>)}</tbody></table><strong>Total: {money(gastosFiltrados.reduce((a,g)=>a+Number(g.monto||0),0))}</strong></section>
    <section className="accounting-print-area accounting-nominas-print"><h1>CAFETERÍA ORIGEN</h1><h2>HISTORIAL DE PAGOS DE NÓMINA</h2><p>Periodo: {periodoPagosAplicado.inicio||periodoPagosAplicado.fin?`${periodoPagosAplicado.inicio||'Inicio'} al ${periodoPagosAplicado.fin||'Fecha reciente'}`:'Todo el historial'}</p><table><thead><tr><th>Fecha de pago</th><th>Empleado</th><th>Semana</th><th>Método</th><th>Importe</th></tr></thead><tbody>{pagosFiltrados.map(p=><tr key={`pn-${p.id_pago_nomina}`}><td>{formatearFechaContable(p.fecha_pago)}</td><td>{p.nombre}</td><td>{formatearFechaContable(p.semana_inicio)}</td><td>{p.metodo_pago||'—'}</td><td>{money(p.monto)}</td></tr>)}</tbody></table><strong>Total: {money(pagosFiltrados.reduce((a,p)=>a+Number(p.monto||0),0))}</strong></section>

{/* VISTA PANEL DE REPORTES Y ESTADÍSTICAS */}
{vistaActual === 'reportes' && (
  <div className="inventory-view">
    {reportesData && (
      <section className="report-print-area" aria-label="Reporte administrativo para impresión">
        <header className="report-print-header">
          <div><h1>CAFETERÍA ORIGEN</h1><p>REPORTE ADMINISTRATIVO DE VENTAS</p></div>
          <div className="report-print-meta">
            <span>Fecha de generación: {new Date().toLocaleString('es-MX')}</span>
            <span>Generado por: {usuario?.nombre || usuario?.username || 'Administrador'}</span>
            <span>Periodo: {periodoAplicadoReportes.inicio || periodoAplicadoReportes.fin ? `${periodoAplicadoReportes.inicio || 'Primera venta'} al ${periodoAplicadoReportes.fin || 'Hoy'}` : 'Todo el historial'}</span>
          </div>
        </header>
        <h2>Resumen financiero</h2>
        <div className="report-print-kpis">
          <div><span>Ingresos totales</span><strong>{money(reportesData.resumen.total_ingresos)}</strong></div>
          <div><span>Ventas realizadas</span><strong>{reportesData.resumen.total_ventas}</strong></div>
          <div><span>Ticket promedio</span><strong>{money(reportesData.resumen.ticket_promedio)}</strong></div>
          <div><span>Ingresos en efectivo</span><strong>{money(reportesData.resumen.ingresos_efectivo)}</strong></div>
          <div><span>Ingresos con tarjeta</span><strong>{money(reportesData.resumen.ingresos_tarjeta)}</strong></div>
        </div>
        <h2>Productos más vendidos</h2>
        <table className="report-print-table"><thead><tr><th>Producto</th><th>Categoría</th><th>Unidades</th><th>Importe recaudado</th></tr></thead>
          <tbody>
            {reportesData.top_productos.map((prod, idx) => <tr key={`print-prod-${idx}`}><td>{prod.nombre}</td><td>{prod.categoria}</td><td>{prod.total_unidades}</td><td>{money(prod.total_recaudado)}</td></tr>)}
            {reportesData.top_productos.length === 0 && <tr><td colSpan="4">No hay ventas registradas.</td></tr>}
          </tbody>
        </table>
        <h2>Ventas por categoría</h2>
        <table className="report-print-table"><thead><tr><th>Categoría</th><th>Unidades vendidas</th><th>Importe total</th></tr></thead>
          <tbody>
            {reportesData.ventas_categoria.map((cat, idx) => <tr key={`print-cat-${idx}`}><td>{cat.categoria}</td><td>{cat.unidades}</td><td>{money(cat.total)}</td></tr>)}
            {reportesData.ventas_categoria.length === 0 && <tr><td colSpan="3">Sin datos de categorías.</td></tr>}
          </tbody>
        </table>
        <footer className="report-print-footer">Documento generado desde el sistema de punto de venta de Cafetería Origen.</footer>
      </section>
    )}
    <div className="inventory-header no-print">
      <div>
        <h2 className="title">Panel de Reportes e Indicadores</h2>
        <div className="subtitle">Análisis estadístico de ventas, productos populares e ingresos</div>
      </div>
      <div className="report-actions no-print" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button type="button" className="management-btn" onClick={cargarReportes} disabled={cargandoReportes} style={{ padding: '8px 14px' }}>
          {cargandoReportes ? 'Actualizando…' : '🔄 Actualizar Datos'}
        </button>
        <button type="button" className="management-btn report-print-button" onClick={imprimirReportes} disabled={!reportesData || cargandoReportes} style={{ padding: '8px 14px' }}>
          🖨️ Imprimir reporte
        </button>
      </div>
    </div>

    <section className="no-print reports-filter-panel" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px 18px', margin: '18px 0', display: 'flex', gap: '14px', alignItems: 'end', flexWrap: 'wrap' }}>
      <div style={{ minWidth: '180px', flex: '1' }}>
        <label htmlFor="reporte-fecha-inicio" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Desde</label>
        <input id="reporte-fecha-inicio" type="date" value={fechaInicioReportes} max={fechaHoyReportes} onChange={e => setFechaInicioReportes(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '7px' }} />
      </div>
      <div style={{ minWidth: '180px', flex: '1' }}>
        <label htmlFor="reporte-fecha-fin" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Hasta</label>
        <input id="reporte-fecha-fin" type="date" value={fechaFinReportes} min={fechaInicioReportes || undefined} max={fechaHoyReportes} onChange={e => setFechaFinReportes(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '7px' }} />
      </div>
      <button type="button" className="management-btn" onClick={() => cargarReportes()} disabled={cargandoReportes} style={{ padding: '10px 16px' }}>{cargandoReportes ? 'Filtrando…' : 'Aplicar filtro'}</button>
      <button type="button" className="btn-outline" onClick={() => { setFechaInicioReportes(''); setFechaFinReportes(''); cargarReportes({ todo: true }); }} disabled={cargandoReportes} style={{ padding: '10px 16px' }}>Todo el historial</button>
      <div style={{ width: '100%', fontSize: '12px', color: '#6b7280' }}>Solo se mostrarán ventas realizadas dentro del periodo seleccionado. No se permiten fechas posteriores a hoy.</div>
    </section>

    {errorReportes && (
      <div className="no-print" role="alert" style={{ margin: '16px 0', padding: '12px 16px', borderRadius: '8px', background: '#f7e4e1', color: '#934c43' }}>
        {errorReportes}
      </div>
    )}

    <div className="no-print">
    {reportesData ? (
      <>
        {/* TARJETAS DE INDICADORES CLAVE (KPIs) */}
        <div className="reports-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', margin: '20px 0' }}>
          <div style={{ background: '#fff', padding: '18px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 'bold' }}>INGRESOS TOTALES</div>
            <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#111827', marginTop: '6px' }}>
              {money(reportesData.resumen.total_ingresos)}
            </div>
            <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>Ventas acumuladas</div>
          </div>

          <div style={{ background: '#fff', padding: '18px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 'bold' }}>ORDENES / TICKETS</div>
            <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#2563eb', marginTop: '6px' }}>
              {reportesData.resumen.total_ventas}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Transacciones realizadas</div>
          </div>

          <div style={{ background: '#fff', padding: '18px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 'bold' }}>TICKET PROMEDIO</div>
            <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#d97706', marginTop: '6px' }}>
              {money(reportesData.resumen.ticket_promedio)}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Consumo prom. por cliente</div>
          </div>

          <div style={{ background: '#fff', padding: '18px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 'bold' }}>MÉTODO PREFERIDO</div>
            <div style={{ fontSize: '14px', marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>💵 Efectivo:</span> <strong>{money(reportesData.resumen.ingresos_efectivo)}</strong>
            </div>
            <div style={{ fontSize: '14px', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
              <span>💳 Tarjeta:</span> <strong>{money(reportesData.resumen.ingresos_tarjeta)}</strong>
            </div>
          </div>
        </div>

        {/* SECCIÓN DOS COLUMNAS: TOP PRODUCTOS Y VENTAS POR CATEGORÍA */}
        <div className="reports-details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
          
          {/* TABLA DE TOP 5 PRODUCTOS MÁS VENDIDOS */}
          <div className="reports-panel" style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>
              ⭐ Top 5 Productos Más Vendidos
            </h3>
            <table className="inventory-table reports-data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>PRODUCTO</th>
                  <th>CATEGORÍA</th>
                  <th>UNID.</th>
                  <th>RECAUDADO</th>
                </tr>
              </thead>
              <tbody>
                {reportesData.top_productos.map((prod, idx) => (
                  <tr key={idx}>
                    <td><strong>{prod.nombre}</strong></td>
                    <td>{prod.categoria}</td>
                    <td><span style={{ fontWeight: 'bold', color: '#2563eb' }}>{prod.total_unidades}</span></td>
                    <td><strong>{money(prod.total_recaudado)}</strong></td>
                  </tr>
                ))}
                {reportesData.top_productos.length === 0 && (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '15px' }}>No hay ventas registradas.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* DISTRIBUCIÓN POR CATEGORÍAS */}
          <div className="reports-panel" style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>
              📊 Ventas por Categoría
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reportesData.ventas_categoria.map((cat, idx) => {
                const maxTotal = reportesData.ventas_categoria[0]?.total || 1;
                const porcentaje = Math.round((cat.total / maxTotal) * 100);

                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span><strong>{cat.categoria}</strong> ({cat.unidades} unid.)</span>
                      <strong>{money(cat.total)}</strong>
                    </div>
                    <div style={{ width: '100%', background: '#f3f4f6', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${porcentaje}%`, 
                          background: '#3b82f6', 
                          height: '100%', 
                          borderRadius: '5px',
                          transition: 'width 0.4s ease'
                        }} 
                      />
                    </div>
                  </div>
                );
              })}
              {reportesData.ventas_categoria.length === 0 && (
                <div style={{ textAlign: 'center', padding: '15px', color: '#6b7280' }}>Sin datos de categorías.</div>
              )}
            </div>
          </div>

        </div>
      </>
    ) : (
      <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
        {cargandoReportes ? 'Cargando estadísticas del sistema…' : (errorReportes || 'No hay datos de reportes para mostrar. Usa “Actualizar Datos” para intentarlo nuevamente.')}
      </div>
    )}
    </div>
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
        const tamanosProducto = (Array.isArray(productoPersonalizando.tamanos) ? productoPersonalizando.tamanos : [])
          .filter(t => /oz/i.test(String(t.nombre || '')));
        const listaExtras = Array.isArray(productoPersonalizando.extras) ? productoPersonalizando.extras : [];
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

              {tamanosProducto.length > 0 && (
                <div className="modal-section">
                    <label className="modal-label">Tamaño</label>
                    <div className="option-list">
                      {tamanosProducto.map((tam, idx) => {
                        const seleccionado = (tamanioSeleccionado?.id_tamano ?? tamanioSeleccionado?.id) === (tam.id_tamano ?? tam.id);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setTamanioSeleccionado(tam)}
                            className={`option-card${seleccionado ? ' selected' : ''}`}
                          >
                            <span className="option-name">{tam.nombre}</span>
                            <span className="option-price">
                              ${Number(tam.precio != null ? tam.precio : Number(productoPersonalizando.precio || 0) + Number(tam.modificador_precio || 0)).toFixed(2)}
                              <small style={{ display: 'block', fontWeight: 400, opacity: 0.75 }}>{Number(tam.stock || 0)} disponibles</small>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
              )}

                 {/* EXTRAS CONFIGURADOS PARA ESTE PRODUCTO */}
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
              <button
                type="button"
                className="modal-primary"
                disabled={guardandoVenta}
                onClick={procesarVenta}
              >
                {guardandoVenta ? 'Registrando venta…' : 'Confirmar venta'}
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






