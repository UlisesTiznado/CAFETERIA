const { useState, useEffect } = React;

function App() {
  const [usuario, setUsuario] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [menu, setMenu] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [error, setError] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [menuGerenciaAbierto, setMenuGerenciaAbierto] = useState(false);
  const [mostrarPagoEfectivo, setMostrarPagoEfectivo] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [efectivoRecibido, setEfectivoRecibido] = useState('');
  const efectivoNumero = Number(efectivoRecibido || 0);
  const totalNumero = Number(total || 0);

  const cambio = Math.max(
    efectivoNumero - totalNumero,
    0
  );

const efectivoSuficiente =
  efectivoNumero >= totalNumero;

  const esAdministrador =
  usuario?.id_rol === 2 ||
  usuario?.rol === 'Administrador';

  useEffect(() => {
    if (usuario) {
      cargarMenu();
    }
  }, [usuario]);

  const cargarMenu = async () => {

  try {

    const response =
      await fetch('/api/menu', {
        cache: 'no-store'
      });

    const data =
      await response.json();

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

      console.log('LOGIN RESPONSE:', data);

      setUsuario(data.user);

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

  const total = carrito.reduce(
  (sum, item) =>
    sum + Number(item.precio) * item.cantidad,
  0
);


const subtotal = total / 1.16;
const iva = total - subtotal;

const cantidadArticulos = carrito.reduce(
  (sum, item) => sum + item.cantidad,
  0
);

  const procesarVenta = async () => {
  if (carrito.length === 0) {
    alert('El carrito está vacío');
    return;
  }

  const ventaData = {
    total: total,
    metodo_pago: metodoPago,

    efectivo_recibido:
      metodoPago === 'Efectivo'
        ? efectivoNumero
        : null,

    cambio_entregado:
      metodoPago === 'Efectivo'
        ? cambio
        : null,

    detalles: carrito.map(item => ({
      id_producto: item.id_producto,
      cantidad: item.cantidad,
      precio: Number(item.precio)
    }))
  };

  try {
    const response = await fetch('/api/ventas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ventaData)
    });

    const data = await response.json();

    if (response.ok) {
      alert('Venta registrada con éxito');

      setCarrito([]);
      setEfectivoRecibido('');
      setMostrarPagoEfectivo(false);
      setMostrarConfirmacion(false);

    } else {
      console.error('Error del servidor:', data);

      alert(
        data.message ||
        'Error al registrar la venta'
      );
    }

  } catch (err) {
    console.error(err);

    alert(
      'Error de conexión con el servidor'
    );
  }
};

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
            Ingresa tus credenciales para acceder
            al punto de venta.
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
                setUsername(e.target.value)
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
                setPassword(e.target.value)
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
          Acceso exclusivo para personal autorizado
        </div>

      </div>

    </div>
  );
}

  const money = (valor) => {
  return Number(valor || 0).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN'
  });
};

const iconoCategoria = (categoria = '') => {
  const nombre = categoria.toLowerCase();

  if (nombre.includes('café') || nombre.includes('cafe')) {
    return '☕';
  }

  if (nombre.includes('fría') || nombre.includes('fria')) {
    return '🥤';
  }

  if (nombre.includes('postre')) {
    return '🍰';
  }

  if (nombre.includes('pan')) {
    return '🥐';
  }

  return '🍽️';
};

const categoriaActual =
  menu.find(cat => {

    const idCategoria =
      cat.id_categoria ??
      cat.categoria;

    return idCategoria === categoriaSeleccionada;

  }) || menu[0];

const productosFiltrados =
  categoriaActual?.productos?.filter(
    producto =>
      producto.nombre
        .toLowerCase()
        .includes(
          busqueda.toLowerCase()
        )
  ) || [];

const eliminarProducto = (id_producto) => {
  setCarrito(prev =>
    prev.filter(item => item.id_producto !== id_producto)
  );
};

console.log('USUARIO ACTUAL:', usuario);

{mostrarPagoEfectivo && (

  <div className="modal-overlay">

    <div className="payment-modal">

      <div className="modal-header">

        <div>
          <h3>
            Pago en efectivo
          </h3>

          <p>
            Ingresa la cantidad recibida del cliente.
          </p>
        </div>

        <button
          type="button"
          className="modal-close"
          onClick={() =>
            setMostrarPagoEfectivo(false)
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
          value={efectivoRecibido}
          onChange={(e) =>
            setEfectivoRecibido(e.target.value)
          }
          autoFocus
        />

      </div>


      <div className="change-box">
  <span>Cambio</span>

  <strong>
    {money(cambio)}
  </strong>
</div>


      {!efectivoSuficiente &&
        efectivoRecibido !== '' && (

          <div className="cash-warning">
            El efectivo recibido es menor al total.
          </div>

      )}


      <div className="modal-actions">

        <button
          type="button"
          className="modal-secondary"
          onClick={() =>
            setMostrarPagoEfectivo(false)
          }
        >
          Cancelar
        </button>


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

{mostrarConfirmacion && (

  <div className="modal-overlay">

    <div className="confirm-modal">

      <div className="modal-header">

        <div>
          <h3>
            Confirmar venta
          </h3>

          <p>
            Revisa los datos antes de registrar la venta.
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


        {metodoPago === 'Efectivo' && (
          <>
            <div className="confirm-row">

              <span>
                Efectivo recibido
              </span>

              <strong>
                {money(efectivoNumero)}
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
          onClick={() =>
            setMostrarConfirmacion(false)
          }
        >
          Regresar
        </button>


        <button
          type="button"
          className="modal-primary"
          onClick={async () => {

            await procesarVenta();

            setMostrarConfirmacion(false);

            setEfectivoRecibido('');

          }}
        >
          Confirmar venta
        </button>

      </div>

    </div>

  </div>

)}

console.log('mostrarPagoEfectivo:', mostrarPagoEfectivo);
console.log('PAGO:', {
  efectivoRecibido,
  efectivoNumero,
  total,
  totalNumero,
  cambio
});

  return (
  <div className="app-container">

    {/* =========================
        BARRA SUPERIOR
    ========================== */}

    <header className="topbar">

      <div className="brand">

        <div className="brand-mark">
          ☕
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
      
      {mostrarPagoEfectivo && (

      <div className="modal-overlay">

        <div className="payment-modal">

          <div className="modal-header">

            <div>
              <h3>Pago en efectivo</h3>

              <p>
                Ingresa la cantidad recibida del cliente.
              </p>
            </div>

            <button
              type="button"
              className="modal-close"
              onClick={() =>
                setMostrarPagoEfectivo(false)
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
              value={efectivoRecibido}
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


          {!efectivoSuficiente &&
            efectivoRecibido !== '' && (

            <div className="cash-warning">
              El efectivo recibido es menor al total.
            </div>

          )}


          <div className="modal-actions">

            <button
              type="button"
              className="modal-secondary"
              onClick={() =>
                setMostrarPagoEfectivo(false)
              }
            >
              Cancelar
            </button>


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


    {mostrarConfirmacion && (

      <div className="modal-overlay">

        <div className="confirm-modal">

          <div className="modal-header">

            <div>
              <h3>Confirmar venta</h3>

              <p>
                Revisa los datos antes de registrar la venta.
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


            {metodoPago === 'Efectivo' && (
              <>

                <div className="confirm-row">

                  <span>
                    Efectivo recibido
                  </span>

                  <strong>
                    {money(efectivoNumero)}
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

                setMostrarConfirmacion(false);

                if (metodoPago === 'Efectivo') {
                  setMostrarPagoEfectivo(true);
                }

              }}
            >
              Regresar
            </button>


            <button
              type="button"
              className="modal-primary"
              onClick={procesarVenta}
            >
              Confirmar venta
            </button>

          </div>

        </div>

      </div>

    )}

      <input
        className="search"
        type="text"
        placeholder="Buscar producto..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />


      <div className="top-right">

  <div className="user-badge">
    Bienvenido {usuario.username}
  </div>


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
          <span>Proveedores</span>
          <span className="management-status soon">
            próximamente
          </span>
        </button>

        <button
          type="button"
          className="management-item"
        >
          <span>Cuentas</span>
          <span className="management-status soon">
            próximamente
          </span>
        </button>

        <button
          type="button"
          className="management-item"
        >
          <span>Ventas</span>
          <span className="management-status soon">
            próximamente
          </span>
        </button>

        <button
          type="button"
          className="management-item"
        >
          <span>Empleados</span>
          <span className="management-status soon">
            próximamente
          </span>
        </button>

        <button
          type="button"
          className="management-item"
        >
          <span>Reportes</span>
          <span className="management-status soon">
            próximamente
          </span>
        </button>

      </div>
    )}

  </div>
)}


  <button
    className="logout-btn"
    onClick={() => {
      setUsuario(null);
      setCarrito([]);
      setMenuGerenciaAbierto(false);
    }}
  >
    Cerrar sesión
  </button>

</div>

    </header>



    {/* =========================
        CUERPO DEL POS
    ========================== */}

    <div className="pos-body">


      {/* =========================
          CATEGORÍAS
      ========================== */}

      <aside className="sidebar">

  <div className="side-label">
    Categorías
  </div>

  <div className="category-list">

    {menu.map((cat, index) => {

      const idCategoria =
        cat.id_categoria ??
        cat.categoria;

      const activa =
        categoriaSeleccionada === idCategoria;

      return (
        <button
          key={idCategoria || index}
          type="button"
          className={
            activa
              ? 'cat-btn active'
              : 'cat-btn'
          }
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
              Venta rápida · productos, carrito y cobro
            </div>

          </div>


          <span className="product-count">

            {productosFiltrados.length}{' '}
            productos

          </span>

        </div>



        <div className="products-grid">

          {productosFiltrados.map(producto => (

            <button
              key={producto.id_producto}
              className="product-card"
              onClick={() =>
                agregarAlCarrito(producto)
              }
            >

              <div className="product-thumb">

                {iconoCategoria(
                  categoriaActual?.categoria
                )}

              </div>


              <div className="product-name">

                {producto.nombre}

              </div>


              <div className="product-price">

                {money(producto.precio)}

              </div>

            </button>

          ))}

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
                  key={item.id_producto}
                  className="cart-item"
                >

                  <div className="cart-item-top">

                    <span className="cart-item-name">

                      {item.nombre}

                    </span>


                    <button
                      className="trash-btn"
                      onClick={() =>
                        eliminarProducto(
                          item.id_producto
                        )
                      }
                    >
                      🗑
                    </button>

                  </div>


                  <div className="cart-item-bottom">

                    <div className="qty-control">

                      <button
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
                        Number(item.precio) *
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



          <div className="payment-buttons">

            <button
              className={
                metodoPago === 'Efectivo'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setMetodoPago('Efectivo')
              }
            >
              💵 Efectivo
            </button>


            <button
              className={
                metodoPago === 'Tarjeta'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setMetodoPago('Tarjeta')
              }
            >
              💳 Tarjeta
            </button>

          </div>



  <button
  className="charge-btn"
  disabled={carrito.length === 0}
  onClick={() => {
    console.log('BOTÓN COBRAR PRESIONADO');
    console.log('Método:', metodoPago);
    console.log('Carrito:', carrito);
    console.log('Total:', total);

    if (metodoPago === 'Efectivo') {
      console.log('ABRIENDO MODAL EFECTIVO');
      setEfectivoRecibido('');
      setMostrarPagoEfectivo(true);
      return;
    }

    console.log('ABRIENDO CONFIRMACIÓN');
    setMostrarConfirmacion(true);
  }}
>
  Cobrar {money(total)}
</button>

        </div>

      </aside>

    </div>

  </div>
);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);