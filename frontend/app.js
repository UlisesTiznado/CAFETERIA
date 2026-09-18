const { useState, useEffect } = React;

function App() {

  /* ==================================================
     ESTADOS
  ================================================== */

  const [usuario, setUsuario] = useState(() => {

  const usuarioGuardado =
    localStorage.getItem('usuario');

  return usuarioGuardado
    ? JSON.parse(usuarioGuardado)
    : null;

});

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [menu, setMenu] = useState([]);
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

  const [mostrarVentaExitosa, setMostrarVentaExitosa] =
  useState(false);

  const [ultimaVenta, setUltimaVenta] =
  useState(null);

  


  /* ==================================================
     USUARIO / ROL
  ================================================== */

  const esAdministrador =
    usuario?.id_rol === 2 ||
    usuario?.rol === 'Administrador';


  /* ==================================================
     CARGAR MENÚ
  ================================================== */

  useEffect(() => {

    if (usuario) {
      cargarMenu();
    }

  }, [usuario]);


  const cargarMenu = async () => {

    try {

      const response = await fetch('/api/menu', {
        cache: 'no-store'
      });

      const data = await response.json();

      setMenu(data);

      if (data.length > 0) {

        const primeraCategoria =
          data[0].id_categoria ??
          data[0].categoria;

        setCategoriaSeleccionada(
          primeraCategoria
        );
      }

    } catch (error) {

      console.error(
        'Error al cargar el menú:',
        error
      );

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

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          username,
          password
        })

      });


      const data = await response.json();


      if (!response.ok) {

        setError(
          data.message ||
          'Usuario o contraseña incorrectos'
        );

        return;
      }


      console.log(
        'LOGIN RESPONSE:',
        data
      );

      setUsuario(data.user);

localStorage.setItem(
  'usuario',
  JSON.stringify(data.user)
);


    } catch (err) {

      console.error(
        'Error al iniciar sesión:',
        err
      );

      setError(
        'No se pudo conectar con el servidor'
      );

    }

  };


  /* ==================================================
     CARRITO
  ================================================== */

  const agregarAlCarrito = (producto) => {

  const stockDisponible = Number(producto.stock || 0);

  // No permitir productos agotados
  if (stockDisponible <= 0) {
    return;
  }

  setCarrito(prev => {

    const existe = prev.find(
      item =>
        item.id_producto ===
        producto.id_producto
    );

    if (existe) {

      // No permitir superar el stock disponible
      if (existe.cantidad >= stockDisponible) {
        return prev;
      }

      return prev.map(item =>

        item.id_producto === producto.id_producto

          ? {
              ...item,
              cantidad: item.cantidad + 1
            }

          : item

      );

    }

    return [
      ...prev,
      {
        ...producto,
        cantidad: 1
      }
    ];

  });

};



  const cambiarCantidad = (
  id_producto,
  delta
) => {

  setCarrito(prev =>

    prev

      .map(item => {

        if (
          item.id_producto === id_producto
        ) {

          const nuevaCantidad =
            item.cantidad + delta;

          const stockDisponible =
            Number(item.stock || 0);


          // Si intenta superar el stock,
          // mantener la cantidad actual
          if (
            delta > 0 &&
            nuevaCantidad > stockDisponible
          ) {
            return item;
          }


          return nuevaCantidad > 0

            ? {
                ...item,
                cantidad: nuevaCantidad
              }

            : null;

        }

        return item;

      })

      .filter(Boolean)

  );

};


  const eliminarProducto = (
    id_producto
  ) => {

    setCarrito(prev =>

      prev.filter(
        item =>
          item.id_producto !==
          id_producto
      )

    );

  };


  /* ==================================================
     TOTALES
  ================================================== */

  const total = carrito.reduce(

    (sum, item) =>

      sum +
      Number(item.precio) *
      item.cantidad,

    0

  );


  /*
    Los precios mostrados ya incluyen IVA.
  */

  const subtotal =
    total / 1.16;

  const iva =
    total - subtotal;


  const cantidadArticulos =
    carrito.reduce(

      (sum, item) =>
        sum + item.cantidad,

      0

    );


  /* ==================================================
     EFECTIVO Y CAMBIO
  ================================================== */

  const efectivoNumero =
    Number(
      efectivoRecibido || 0
    );


  const cambio =
    Math.max(
      efectivoNumero - total,
      0
    );


  const efectivoSuficiente =
    efectivoNumero >= total;


  /* ==================================================
     FORMATO DE DINERO
  ================================================== */

  const money = (valor) => {

    return Number(
      valor || 0
    ).toLocaleString(
      'es-MX',
      {
        style: 'currency',
        currency: 'MXN'
      }
    );

  };


  /* ==================================================
     CATEGORÍA ACTUAL
  ================================================== */

  const categoriaActual =

    menu.find(cat => {

      const idCategoria =
        cat.id_categoria ??
        cat.categoria;

      return (
        idCategoria ===
        categoriaSeleccionada
      );

    }) || menu[0];


  /* ==================================================
     FILTRAR PRODUCTOS
  ================================================== */

  const productosFiltrados = (() => {

  const textoBusqueda =
    busqueda.trim().toLowerCase();

  // Siempre trabajar únicamente
  // con la categoría seleccionada
  const productosCategoria =
    categoriaActual?.productos || [];

  // Si no hay búsqueda, mostrar todos
  // los productos de esa categoría
  if (!textoBusqueda) {
    return productosCategoria;
  }

  // Si hay búsqueda, filtrar solamente
  // dentro de la categoría seleccionada
  return productosCategoria.filter(producto =>
    producto.nombre
      .toLowerCase()
      .includes(textoBusqueda)
  );

})();

const productosInventario = (() => {

  const textoBusqueda =
    busqueda.trim().toLowerCase();


  // Convertir el menú en una sola lista de productos
  let productos = menu.flatMap(categoria =>

    categoria.productos.map(producto => {

      const stock =
        Number(producto.stock || 0);

      const stockMinimo =
        Number(producto.stock_minimo || 0);

      let estado = 'Disponible';

      if (stock === 0) {
        estado = 'Agotado';
      } else if (stock <= stockMinimo) {
        estado = 'Stock bajo';
      }

      return {
        ...producto,
        categoria: categoria.categoria,
        estadoInventario: estado
      };

    })

  );


  // ==========================================
  // FILTRAR
  // ==========================================

  if (textoBusqueda) {

    productos = productos.filter(producto => {

      const nombre =
        producto.nombre.toLowerCase();

      const categoria =
        producto.categoria.toLowerCase();

      const stock =
        String(producto.stock);

      const stockMinimo =
        String(producto.stock_minimo);

      const estado =
        producto.estadoInventario.toLowerCase();


      switch (filtroInventario) {

        case 'producto':
          return nombre.includes(textoBusqueda);

        case 'categoria':
          return categoria.includes(textoBusqueda);

        case 'stockActual':
          return stock.includes(textoBusqueda);

        case 'stockMinimo':
          return stockMinimo.includes(textoBusqueda);

        case 'estado':
          return estado.includes(textoBusqueda);

        default:
          return (
            nombre.includes(textoBusqueda) ||
            categoria.includes(textoBusqueda) ||
            stock.includes(textoBusqueda) ||
            stockMinimo.includes(textoBusqueda) ||
            estado.includes(textoBusqueda)
          );

      }

    });

  }

    // ==========================================
  // FILTRAR POR CATEGORÍA SELECCIONADA
  // ==========================================

  if (
    filtroInventario === 'categoria' &&
    valorFiltroInventario !== 'todos'
  ) {

    productos = productos.filter(
      producto =>
        producto.categoria === valorFiltroInventario
    );

  }


  // ==========================================
  // FILTRAR POR ESTADO SELECCIONADO
  // ==========================================

  if (
    filtroInventario === 'estado' &&
    valorFiltroInventario !== 'todos'
  ) {

    productos = productos.filter(
      producto =>
        producto.estadoInventario === valorFiltroInventario
    );

  }


  // ==========================================
  // ORDENAR
  // ==========================================

  productos.sort((a, b) => {

    switch (ordenInventario) {

      case 'productoAsc':
        return a.nombre.localeCompare(
          b.nombre,
          'es',
          { sensitivity: 'base' }
        );

      case 'productoDesc':
        return b.nombre.localeCompare(
          a.nombre,
          'es',
          { sensitivity: 'base' }
        );


      case 'categoriaAsc':
        return a.categoria.localeCompare(
          b.categoria,
          'es',
          { sensitivity: 'base' }
        );

      case 'categoriaDesc':
        return b.categoria.localeCompare(
          a.categoria,
          'es',
          { sensitivity: 'base' }
        );


      case 'stockAsc':
        return Number(a.stock) - Number(b.stock);

      case 'stockDesc':
        return Number(b.stock) - Number(a.stock);


      case 'minimoAsc':
        return (
          Number(a.stock_minimo) -
          Number(b.stock_minimo)
        );

      case 'minimoDesc':
        return (
          Number(b.stock_minimo) -
          Number(a.stock_minimo)
        );


      case 'estadoAsc':
        return a.estadoInventario.localeCompare(
          b.estadoInventario,
          'es',
          { sensitivity: 'base' }
        );

      case 'estadoDesc':
        return b.estadoInventario.localeCompare(
          a.estadoInventario,
          'es',
          { sensitivity: 'base' }
        );


      default:
        return 0;

    }

  });


  return productos;

})();


  /* ==================================================
     REGISTRAR VENTA
  ================================================== */

  const procesarVenta = async () => {

    if (carrito.length === 0) {

      alert(
        'El carrito está vacío'
      );

      return false;

    }


    const ventaData = {

      total,

      metodo_pago:
        metodoPago,

      detalles:
        carrito.map(item => ({

          id_producto:
            item.id_producto,

          cantidad:
            item.cantidad,

          precio:
            Number(item.precio)

        }))

    };


    try {

      const response =
        await fetch(
          '/api/ventas',
          {

            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body:
              JSON.stringify(
                ventaData
              )

          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        console.error(
          'Error del servidor:',
          data
        );

        alert(
          data.message ||
          'Error al registrar la venta'
        );

        return false;

      }


      setUltimaVenta({
  total: total,
  metodo_pago: metodoPago,
  efectivo_recibido:
    metodoPago === 'Efectivo'
      ? efectivoNumero
      : null,
  cambio:
    metodoPago === 'Efectivo'
      ? cambio
      : null
});

setMostrarVentaExitosa(true);


      setCarrito([]);

      setEfectivoRecibido('');

      setMostrarPagoEfectivo(
        false
      );

      setMostrarConfirmacion(
        false
      );


      return true;


    } catch (err) {

      console.error(err);

      alert(
        'Error de conexión con el servidor'
      );

      return false;

    }

  };


  /* ==================================================
     LOGIN
  ================================================== */

  if (!usuario) {

    return (

      <div className="simple-login-page">

        <div className="simple-login-card">

          <div className="simple-login-brand">
            CAFETERÍA ORIGEN
          </div>


          <div className="simple-login-header">

            <h1>
              Iniciar sesión
            </h1>

            <p>
              Ingresa tus credenciales
              para acceder al punto de venta.
            </p>

          </div>


          <form
            className="simple-login-form"
            onSubmit={handleLogin}
          >

            <div className="simple-login-field">

              <label htmlFor="username">
                Usuario
              </label>

              <input
                id="username"
                type="text"
                placeholder="Ingresa tu usuario"
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value
                  )
                }
                autoComplete="username"
                required
              />

            </div>


            <div className="simple-login-field">

              <label htmlFor="password">
                Contraseña
              </label>

              <input
                id="password"
                type="password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                autoComplete="current-password"
                required
              />

            </div>


            {error && (

              <div className="simple-login-error">
                {error}
              </div>

            )}


            <button
              type="submit"
              className="simple-login-button"
            >
              Iniciar sesión
            </button>

          </form>


          <div className="simple-login-footer">
            Acceso exclusivo para
            personal autorizado
          </div>

        </div>

      </div>

    );

  }


  /* ==================================================
     POS
  ================================================== */

  return (

    <>

      <div className="app-container">


        {/* =========================
            BARRA SUPERIOR
        ========================== */}

        <header className="topbar">


          <div className="brand">

            <div className="brand-mark">
              CO
            </div>


            <div>

              <div className="brand-name">
                Cafetería Origen
              </div>

              <div className="brand-sub">
                Sucursal Centro · Caja 1
              </div>

            </div>

          </div>


          <input
            className="search"
            type="text"
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={(e) =>
              setBusqueda(
                e.target.value
              )
            }
          />


          <div className="top-right">


            <div className="user-badge">
              Bienvenido {usuario.username}
            </div>

            <button
  type="button"
  className="management-btn"
  onClick={() => {
    setVistaActual(
      vistaActual === 'inventario'
        ? 'pos'
        : 'inventario'
    );

    setMenuGerenciaAbierto(false);
  }}
>
  {vistaActual === 'inventario'
    ? 'Punto de venta'
    : 'Inventario'}
</button>

            {esAdministrador && (

              <div className="management-wrapper">


                <button
                  type="button"
                  className="management-btn"
                  onClick={() =>
                    setMenuGerenciaAbierto(
                      !menuGerenciaAbierto
                    )
                  }
                >

                  Gerencia

                  <span className="management-arrow">
                    ▾
                  </span>

                </button>


                {menuGerenciaAbierto && (

                  <div className="management-menu">


                    <button
                      type="button"
                      className="management-item"
                    >

                      <span>
                        Proveedores
                      </span>

                      <span className="management-status soon">
                        próximamente
                      </span>

                    </button>


                    <button
                      type="button"
                      className="management-item"
                    >

                      <span>
                        Cuentas
                      </span>

                      <span className="management-status soon">
                        próximamente
                      </span>

                    </button>


                    <button
                      type="button"
                      className="management-item"
                    >

                      <span>
                        Ventas
                      </span>

                      <span className="management-status soon">
                        próximamente
                      </span>

                    </button>


                    <button
                      type="button"
                      className="management-item"
                    >

                      <span>
                        Empleados
                      </span>

                      <span className="management-status soon">
                        próximamente
                      </span>

                    </button>


                    <button
                      type="button"
                      className="management-item"
                    >

                      <span>
                        Reportes
                      </span>

                      <span className="management-status soon">
                        próximamente
                      </span>

                    </button>


                  </div>

                )}


              </div>

            )}


            <button
  type="button"
  className="logout-btn"
  onClick={() => {
    setMostrarConfirmarSalida(true);
  }}
>
  Cerrar sesión
</button>


          </div>


        </header>


        {/* =========================
            CUERPO POS
        ========================== */}

        {vistaActual === 'pos' && (
        <div className="pos-body">


          {/* =========================
              CATEGORÍAS
          ========================== */}

          <aside className="sidebar">


            <div className="side-label">
              Categorías
            </div>


            <div className="category-list">


              {menu.map(
                (cat, index) => {

                  const idCategoria =
                    cat.id_categoria ??
                    cat.categoria;


                  const activa =
                    categoriaSeleccionada ===
                    idCategoria;


                  return (

                    <button
                      key={
                        idCategoria ||
                        index
                      }
                      type="button"
                      className={
                        activa
                          ? 'cat-btn active'
                          : 'cat-btn'
                      }
                      onClick={() => {

                        setCategoriaSeleccionada(
                          idCategoria
                        );

                        setBusqueda('');

                      }}
                    >

                      {cat.categoria}

                    </button>

                  );

                }
              )}


            </div>


          </aside>


          {/* =========================
              PRODUCTOS
          ========================== */}

          <main className="main">


            <div className="header-row">


              <div>

                <h2 className="title">
                  Punto de venta
                </h2>

                <div className="subtitle">
                  Venta rápida · productos,
                  carrito y cobro
                </div>

              </div>


              <span className="product-count">

                {productosFiltrados.length}{' '}
                productos

              </span>


            </div>


            <div className="products-grid">


              {productosFiltrados.map(producto => {

  const stock =
    Number(producto.stock || 0);

  const stockMinimo =
    Number(producto.stock_minimo || 0);

  const agotado =
    stock === 0;

  const stockBajo =
    stock > 0 &&
    stock <= stockMinimo;

  return (

    <button
      key={producto.id_producto}
      type="button"
      className={
        agotado
          ? 'product-card agotado'
          : 'product-card'
      }
      disabled={agotado}
      onClick={() =>
        agregarAlCarrito(producto)
      }
    >

      <div className="product-thumb">

        {producto.nombre
          .charAt(0)
          .toUpperCase()}

      </div>


      <div className="product-name">
        {producto.nombre}
      </div>


      <div className="product-price">
        {money(producto.precio)}
      </div>


      <div
        className={
          agotado
            ? 'product-stock agotado'
            : stockBajo
              ? 'product-stock bajo'
              : 'product-stock disponible'
        }
      >

        {agotado
          ? 'Agotado'
          : stockBajo
            ? `Stock bajo · ${stock}`
            : `Disponible · ${stock}`
        }

      </div>

    </button>

  );

})}

            </div>


            {productosFiltrados.length === 0 && (

              <div className="empty-products">
                No se encontraron productos.
              </div>

            )}


          </main>


          {/* =========================
              TICKET
          ========================== */}

          <aside className="receipt-wrap">


            <div className="receipt">


              <div className="receipt-title">
                Ticket actual
              </div>


              <div className="receipt-sub">

                {cantidadArticulos}{' '}

                {cantidadArticulos === 1
                  ? 'artículo'
                  : 'artículos'}

              </div>


              <div className="dash"></div>


              <div className="receipt-items">


                {carrito.length === 0 ? (

                  <div className="empty-cart">

                    Selecciona productos para
                    <br />
                    comenzar la venta.

                  </div>

                ) : (

                  carrito.map(item => (

                    <div
                      key={
                        item.id_producto
                      }
                      className="cart-item"
                    >


                      <div className="cart-item-top">


                        <span className="cart-item-name">

                          {item.nombre}

                        </span>


                        <button
                          type="button"
                          className="trash-btn"
                          onClick={() =>
                            eliminarProducto(
                              item.id_producto
                            )
                          }
                        >
                          ×
                        </button>


                      </div>


                      <div className="cart-item-bottom">


                        <div className="qty-control">


                          <button
                            type="button"
                            onClick={() =>
                              cambiarCantidad(
                                item.id_producto,
                                -1
                              )
                            }
                          >
                            −
                          </button>


                          <strong>
                            {item.cantidad}
                          </strong>


                          <button
                            type="button"
                            onClick={() =>
                              cambiarCantidad(
                                item.id_producto,
                                1
                              )
                            }
                          >
                            +
                          </button>


                        </div>


                        <strong>

                          {money(

                            Number(
                              item.precio
                            ) *
                            item.cantidad

                          )}

                        </strong>


                      </div>


                    </div>

                  ))

                )}


              </div>


              <div className="dash"></div>


              <div className="total-row">

                <span>
                  Subtotal sin IVA
                </span>

                <span>
                  {money(subtotal)}
                </span>

              </div>


              <div className="total-row">

                <span>
                  IVA incluido (16%)
                </span>

                <span>
                  {money(iva)}
                </span>

              </div>


              <div className="total-final">

                <span>
                  TOTAL
                </span>

                <span>
                  {money(total)}
                </span>

              </div>


              {/* =========================
                  MÉTODO DE PAGO
              ========================== */}

              <div className="payment-buttons">


                <button
                  type="button"
                  className={
                    metodoPago ===
                    'Efectivo'
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setMetodoPago(
                      'Efectivo'
                    )
                  }
                >
                  Efectivo
                </button>


                <button
                  type="button"
                  className={
                    metodoPago ===
                    'Tarjeta'
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setMetodoPago(
                      'Tarjeta'
                    )
                  }
                >
                  Tarjeta
                </button>


              </div>


              {/* =========================
                  COBRAR
              ========================== */}

              <button
                type="button"
                className="charge-btn"
                disabled={
                  carrito.length === 0
                }
                onClick={() => {

                  if (
                    metodoPago ===
                    'Efectivo'
                  ) {

                    setEfectivoRecibido(
                      ''
                    );

                    setMostrarPagoEfectivo(
                      true
                    );

                    return;

                  }


                  setMostrarConfirmacion(
                    true
                  );

                }}
              >

                Cobrar {money(total)}

              </button>


            </div>


          </aside>


        </div>

        )}

        {/* =========================
    INVENTARIO
========================== */}

{vistaActual === 'inventario' && (

  <div className="inventory-view">

    <div className="inventory-header">

      <div>
        <h2 className="title">
          Inventario
        </h2>

        <div className="subtitle">
          Control de existencias de productos
        </div>
      </div>

      <div className="inventory-summary">
        {productosInventario.length}{' '}
        {productosInventario.length === 1
          ? 'producto'
          : 'productos'}
      </div>

    </div>

          <div className="inventory-controls">

  {/* =========================
      FILTRAR POR
  ========================== */}

  <div className="inventory-filter-group">

    <label>
      Filtrar por
    </label>

    <select
      value={filtroInventario}
      onChange={(e) => {
        setFiltroInventario(e.target.value);
        setValorFiltroInventario('todos');
        setBusqueda('');
      }}
    >

      <option value="todos">
        Todos los campos
      </option>

      <option value="producto">
        Producto
      </option>

      <option value="categoria">
        Categoría
      </option>

      <option value="stockActual">
        Stock actual
      </option>

      <option value="stockMinimo">
        Stock mínimo
      </option>

      <option value="estado">
        Estado
      </option>

    </select>

  </div>


  {/* =========================
      SELECCIONAR CATEGORÍA
      Solo aparece si eliges Categoría
  ========================== */}

  {filtroInventario === 'categoria' && (

    <div className="inventory-filter-group">

      <label>
        Categoría
      </label>

      <select
        value={valorFiltroInventario}
        onChange={(e) =>
          setValorFiltroInventario(
            e.target.value
          )
        }
      >

        <option value="todos">
          Todas las categorías
        </option>

        {menu.map(categoria => (

          <option
            key={categoria.categoria}
            value={categoria.categoria}
          >
            {categoria.categoria}
          </option>

        ))}

      </select>

    </div>

  )}


  {/* =========================
      SELECCIONAR ESTADO
      Solo aparece si eliges Estado
  ========================== */}

  {filtroInventario === 'estado' && (

    <div className="inventory-filter-group">

      <label>
        Estado
      </label>

      <select
        value={valorFiltroInventario}
        onChange={(e) =>
          setValorFiltroInventario(
            e.target.value
          )
        }
      >

        <option value="todos">
          Todos los estados
        </option>

        <option value="Disponible">
          Disponible
        </option>

        <option value="Stock bajo">
          Stock bajo
        </option>

        <option value="Agotado">
          Agotado
        </option>

      </select>

    </div>

  )}


  {/* =========================
      ORDENAR POR
  ========================== */}

  <div className="inventory-filter-group">

    <label>
      Ordenar por
    </label>

    <select
      value={ordenInventario}
      onChange={(e) => {
        setOrdenInventario(
          e.target.value
        );
      }}
    >

      <option value="predeterminado">
        Predeterminado
      </option>

      <option value="productoAsc">
        Producto: A → Z
      </option>

      <option value="productoDesc">
        Producto: Z → A
      </option>

      <option value="categoriaAsc">
        Categoría: A → Z
      </option>

      <option value="categoriaDesc">
        Categoría: Z → A
      </option>

      <option value="stockAsc">
        Stock actual: Menor → Mayor
      </option>

      <option value="stockDesc">
        Stock actual: Mayor → Menor
      </option>

      <option value="minimoAsc">
        Stock mínimo: Menor → Mayor
      </option>

      <option value="minimoDesc">
        Stock mínimo: Mayor → Menor
      </option>

      <option value="estadoAsc">
        Estado: A → Z
      </option>

      <option value="estadoDesc">
        Estado: Z → A
      </option>

    </select>

  </div>

</div>

    <div className="inventory-table-wrapper">

      <table className="inventory-table">

        <thead>
          <tr>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Stock actual</th>
            <th>Stock mínimo</th>
            <th>Estado</th>
          </tr>
        </thead>


        <tbody>

          {productosInventario.map(producto => {

  const stock =
    Number(producto.stock || 0);

  const stockMinimo =
    Number(producto.stock_minimo || 0);

  let estado = 'Disponible';
  let claseEstado = 'available';

  if (stock === 0) {

    estado = 'Agotado';
    claseEstado = 'out';

  } else if (stock <= stockMinimo) {

    estado = 'Stock bajo';
    claseEstado = 'low';

  }

  return (

    <tr key={producto.id_producto}>

      <td>
        <strong>
          {producto.nombre}
        </strong>
      </td>

      <td>
        {producto.categoria}
      </td>

      <td>
        {stock}
      </td>

      <td>
        {stockMinimo}
      </td>

      <td>
        <span
          className={`stock-status ${claseEstado}`}
        >
          {estado}
        </span>
      </td>

    </tr>

  );

})}

        </tbody>

      </table>

    </div>

  </div>

)}
      </div>



      {/* ==================================================
          MODAL PAGO EN EFECTIVO
      ================================================== */}

      {mostrarPagoEfectivo && (

        <div className="modal-overlay">


          <div className="payment-modal">


            <div className="modal-header">


              <div>

                <h3>
                  Pago en efectivo
                </h3>

                <p>
                  Ingresa la cantidad
                  recibida del cliente.
                </p>

              </div>


              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setMostrarPagoEfectivo(
                    false
                  )
                }
              >
                ×
              </button>


            </div>


            <div className="payment-summary">


              <div className="payment-row">

                <span>
                  Total de la venta
                </span>

                <strong>
                  {money(total)}
                </strong>

              </div>


            </div>


            <div className="cash-field">


              <label>
                Efectivo recibido
              </label>


              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={
                  efectivoRecibido
                }
                onChange={(e) =>
                  setEfectivoRecibido(
                    e.target.value
                  )
                }
                autoFocus
              />


            </div>


            <div className="change-box">


              <span>
                Cambio
              </span>


              <strong>
                {money(cambio)}
              </strong>


            </div>


            {efectivoRecibido !== '' &&
              !efectivoSuficiente && (

                <div className="cash-warning">

                  El efectivo recibido
                  es menor al total.

                </div>

            )}


            <div className="modal-actions">


              <button
                type="button"
                className="modal-secondary"
                onClick={() =>
                  setMostrarPagoEfectivo(
                    false
                  )
                }
              >
                Cancelar
              </button>


              <button
                type="button"
                className="modal-primary"
                disabled={
                  !efectivoSuficiente
                }
                onClick={() => {

                  setMostrarPagoEfectivo(
                    false
                  );

                  setMostrarConfirmacion(
                    true
                  );

                }}
              >
                Continuar
              </button>


            </div>


          </div>


        </div>

      )}


      {/* ==================================================
          MODAL CONFIRMAR VENTA
      ================================================== */}

      {mostrarConfirmacion && (

        <div className="modal-overlay">


          <div className="confirm-modal">


            <div className="modal-header">


              <div>

                <h3>
                  Confirmar venta
                </h3>

                <p>
                  Revisa los datos antes
                  de registrar la venta.
                </p>

              </div>


            </div>



            <div className="confirm-details">


              <div className="confirm-row">

                <span>
                  Método de pago
                </span>

                <strong>
                  {metodoPago}
                </strong>

              </div>


              <div className="confirm-row">

                <span>
                  Total
                </span>

                <strong>
                  {money(total)}
                </strong>

              </div>


              {metodoPago ===
                'Efectivo' && (

                <>


                  <div className="confirm-row">

                    <span>
                      Efectivo recibido
                    </span>

                    <strong>
                      {money(
                        efectivoNumero
                      )}
                    </strong>

                  </div>


                  <div className="confirm-row">

                    <span>
                      Cambio
                    </span>

                    <strong>
                      {money(cambio)}
                    </strong>

                  </div>


                </>

              )}


            </div>


            <div className="modal-actions">


              <button
                type="button"
                className="modal-secondary"
                onClick={() => {

                  setMostrarConfirmacion(
                    false
                  );


                  if (
                    metodoPago ===
                    'Efectivo'
                  ) {

                    setMostrarPagoEfectivo(
                      true
                    );

                  }

                }}
              >
                Regresar
              </button>


              <button
                type="button"
                className="modal-primary"
                onClick={async () => {

                  await procesarVenta();

                }}
              >
                Confirmar venta
              </button>


            </div>


          </div>


        </div>

      )}

      {/* ==================================================
          MODAL MOSTRAR CONFIRMACION DE VENTA EXITOSA
      ================================================== */}

      {mostrarVentaExitosa && ultimaVenta && (

  <div className="modal-overlay">

    <div className="success-modal">

      <div className="success-icon">
        ✓
      </div>

      <h3>
        Venta completada
      </h3>

      <p className="success-message">
        La venta se registró correctamente
      </p>


      <div className="success-details">

        <div className="confirm-row">
          <span>Total</span>

          <strong>
            {money(ultimaVenta.total)}
          </strong>
        </div>


        <div className="confirm-row">
          <span>Método de pago</span>

          <strong>
            {ultimaVenta.metodo_pago}
          </strong>
        </div>


        {ultimaVenta.metodo_pago === 'Efectivo' && (
          <>
            <div className="confirm-row">
              <span>Efectivo recibido</span>

              <strong>
                {money(
                  ultimaVenta.efectivo_recibido
                )}
              </strong>
            </div>

            <div className="confirm-row success-change">
              <span>Cambio</span>

              <strong>
                {money(ultimaVenta.cambio)}
              </strong>
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

      {/* ==================================================
    MODAL CONFIRMAR CIERRE DE SESIÓN
================================================== */}

{mostrarConfirmarSalida && (

  <div className="modal-overlay">

    <div className="confirm-modal">

      <div className="modal-header">

        <div>

          <h3>
            Cerrar sesión
          </h3>

          <p>
            ¿Estás seguro de que deseas cerrar sesión?
          </p>

        </div>

        <button
          type="button"
          className="modal-close"
          onClick={() =>
            setMostrarConfirmarSalida(false)
          }
        >
          ×
        </button>

      </div>


      <div className="confirm-details">

        <div className="confirm-row">

          <span>
            Usuario actual
          </span>

          <strong>
            {usuario.username}
          </strong>

        </div>

      </div>


      <div className="modal-actions">

        <button
          type="button"
          className="modal-secondary"
          onClick={() =>
            setMostrarConfirmarSalida(false)
          }
        >
          Cancelar
        </button>


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


    </>

  );

}


/* ==================================================
   INICIAR REACT
================================================== */

const root =
  ReactDOM.createRoot(
    document.getElementById('root')
  );

root.render(<App />);