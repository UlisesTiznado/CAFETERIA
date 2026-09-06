const { useState, useMemo, createElement: h } = React;

const Icon = ({ children, size = 16 }) =>
  h("span", { style: { fontSize: size, lineHeight: 1, display: "inline-flex" } }, children);

const IconPlus = (p) => h(Icon, p, "+");
const IconMinus = (p) => h(Icon, p, "−");
const IconTrash = (p) => h(Icon, p, "🗑");
const IconSearch = (p) => h(Icon, p, "🔍");
const IconReceipt = (p) => h(Icon, p, "🧾");
const IconFileText = (p) => h(Icon, p, "📄");
const IconLogout = (p) => h(Icon, p, "🚪");
const IconChevron = (p) => h(Icon, p, "▾");
const IconEdit = (p) => h(Icon, p, "✏️");

const CATEGORIES = [
  { id: "calientes", label: "Bebidas calientes" },
  { id: "frias", label: "Bebidas frías" },
  { id: "panaderia", label: "Panadería" },
  { id: "postres", label: "Postres" },
  { id: "snacks", label: "Snacks" },
  { id: "inventario", label: "Inventario" }
];

// Opciones de Tamaños con aumentos en montos cerrados
const SIZES = [
  { id: "chico", label: "Chico (8 oz / 12 oz)", modifier: 0 },
  { id: "mediano", label: "Mediano (16 oz)", modifier: 10 },
  { id: "grande", label: "Grande (20 oz)", modifier: 15 }
];

// Precios finales cerrados (IVA Incluido)
const PRODUCTS = {
  calientes: [
    { id: "c_espresso", name: "Espresso", basePrice: 35, flavors: ["Clásico", "Doble", "Cortado"] },
    { id: "c_americano", name: "Americano", basePrice: 40, flavors: ["Tueste Oscuro", "Descafeinado", "Casa"] },
    { id: "c_cappuccino", name: "Cappuccino", basePrice: 50, flavors: ["Tradicional", "Vainilla", "Canela", "Caramelo"] },
    { id: "c_latte", name: "Latte", basePrice: 55, flavors: ["Clásico", "Vainilla", "Avellana", "Caramelo"] },
    { id: "c_moka", name: "Moka", basePrice: 60, flavors: ["Chocolate Blanco", "Chocolate Oscuro", "Menta"] },
    { id: "c_chocolate", name: "Chocolate Caliente", basePrice: 45, flavors: ["Tradicional", "Blanco", "Especial de la Casa"] }
  ],
  frias: [
    { id: "f_frappe", name: "Frappé", basePrice: 60, flavors: ["Vainilla", "Moka", "Caramelo", "Oreo", "Chai"] },
    { id: "f_iced_latte", name: "Iced Latte", basePrice: 55, flavors: ["Clásico", "Vainilla", "Caramelo Salado"] },
    { id: "f_limonada", name: "Limonada / Naranjada", basePrice: 45, flavors: ["Natural", "Menta", "Mineral", "Frutos Rojos"] },
    { id: "f_te", name: "Té Helado", basePrice: 40, flavors: ["Negro", "Verde Citrus", "Durazno", "Matcha"] }
  ],
  panaderia: [
    { id: "p1", name: "Concha", basePrice: 25, flavors: ["Vainilla", "Chocolate"] },
    { id: "p2", name: "Cuernito", basePrice: 20, flavors: ["Mantequilla"] },
    { id: "p3", name: "Muffin", basePrice: 35, flavors: ["Arándano", "Chocolate", "Plátano"] },
    { id: "p4", name: "Croissant", basePrice: 35, flavors: ["Jamón y Queso", "Mantequilla"] }
  ],
  postres: [
    { id: "d1", name: "Pastel", basePrice: 50, flavors: ["Chocolate", "Zanahoria", "Red Velvet"] },
    { id: "d2", name: "Cheesecake", basePrice: 60, flavors: ["Frutos Rojos", "Tortuga", "Oreo"] },
    { id: "d3", name: "Brownie", basePrice: 40, flavors: ["Nuez", "Nuez con Nieve"] },
    { id: "d4", name: "Flan Napolitano", basePrice: 35, flavors: ["Tradicional", "Café"] }
  ],
  snacks: [
    { id: "s1", name: "Sandwich", basePrice: 70, flavors: ["Jamón Pavo", "Tres Quesos", "Pollo Chipotle"] },
    { id: "s2", name: "Bagel", basePrice: 50, flavors: ["Queso Crema", "Lomo Canadiense"] },
    { id: "s3", name: "Ensalada del Día", basePrice: 75, flavors: ["César", "Mixta con Nuez"] }
  ]
};

const INITIAL_INVENTORY = [
  { id: "inv_v_ch", name: "Vasos Chicos (8-12 oz)", category: "Empaques", stock: 240, unit: "piezas", minStock: 50 },
  { id: "inv_v_med", name: "Vasos Medianos (16 oz)", category: "Empaques", stock: 180, unit: "piezas", minStock: 50 },
  { id: "inv_v_gde", name: "Vasos Grandes (20 oz)", category: "Empaques", stock: 120, unit: "piezas", minStock: 40 },
  { id: "inv_t_cal", name: "Tapas Calientes Domo", category: "Empaques", stock: 350, unit: "piezas", minStock: 60 },
  { id: "inv_t_fri", name: "Tapas Frías Plano/Plana", category: "Empaques", stock: 300, unit: "piezas", minStock: 60 },
  { id: "inv_cafe", name: "Grano de Café Mezcla Casa", category: "Insumos Base", stock: 18, unit: "kg", minStock: 5 },
  { id: "inv_leche", name: "Leche Entera", category: "Lácteos", stock: 24, unit: "litros", minStock: 8 }
];

const INITIAL_EMPLOYEES = [
  { id: 1, name: "Alan Joaquín", role: "Cajero / Barista", shift: "Matutino", status: "Activo", phone: "662 111 2233" },
  { id: 2, name: "Valeria Gómez", role: "Barista Lead", shift: "Vespertino", status: "Activo", phone: "662 444 5566" }
];

const INITIAL_PROVIDERS = [
  { id: 1, name: "Café Sierra", contact: "María López", phone: "662 123 4567", product: "Café en grano", status: "Activo" },
  { id: 2, name: "Panadería La Espiga", contact: "Carlos Ruiz", phone: "662 234 5678", product: "Pan y repostería", status: "Activo" }
];

const INITIAL_INVOICES = [
  { id: "FAC-001", client: "Publicis México", rfc: "PME980101AA1", total: 1250, date: "01/09/2026", status: "Timbrada" },
  { id: "FAC-002", client: "Desarrollos Sonora S.A.", rfc: "DSO120415BB2", total: 3420, date: "03/09/2026", status: "Timbrada" }
];

const INITIAL_SALES_HISTORY = [
  {
    id: 1001,
    date: "06/09/2026, 09:15:30",
    total: 120,
    paymentMethod: "efectivo",
    cashGiven: 200,
    changeGiven: 80,
    itemsCount: 2,
    items: [
      { name: "Americano Tueste Oscuro (Mediano)", price: 50, qty: 1 },
      { name: "Sandwich (Jamón Pavo)", price: 70, qty: 1 }
    ]
  }
];

const INITIAL_WEEKLY_SALES = [
  { day: "Lun", sales: 3250, tickets: 48 },
  { day: "Mar", sales: 4120, tickets: 61 },
  { day: "Mié", sales: 3890, tickets: 57 },
  { day: "Jue", sales: 4650, tickets: 69 },
  { day: "Vie", sales: 5280, tickets: 77 },
  { day: "Sáb", sales: 6140, tickets: 91 },
  { day: "Dom", sales: 4870, tickets: 73 }
];

const ADMIN_VIEWS = [
  { id: "providers", label: "Proveedores" },
  { id: "invoices", label: "Facturas" },
  { id: "sales", label: "Ventas" },
  { id: "employees", label: "Empleados" },
  { id: "reports", label: "Informes" }
];

const mxn = (n) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 });

function CafeteriaPOS() {
  const [user, setUser] = useState(null);
  const [loginRole, setLoginRole] = useState("empleado");
  const [loginPass, setLoginPass] = useState("");

  const [category, setCategory] = useState("calientes");
  const [cart, setCart] = useState([]);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminView, setAdminView] = useState(null);
  const [query, setQuery] = useState("");
  
  const [activeProduct, setActiveProduct] = useState(null);
  const [selectedFlavor, setSelectedFlavor] = useState("");
  const [selectedSize, setSelectedSize] = useState(SIZES[0]);

  // Modales y Cobro
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [amountReceived, setAmountReceived] = useState("");

  // Control de Caja Inicial e Inyecciones de Fondo
  const [initialCash, setInitialCash] = useState(1500); // Fondo inicial simulado
  const [cashAddition, setCashAddition] = useState("");
  const [nextShiftReserve, setNextShiftReserve] = useState(1500);

  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [invQuery, setInvQuery] = useState("");
  const [invCategoryFilter, setInvCategoryFilter] = useState("todas");
  const [salesHistory, setSalesHistory] = useState(INITIAL_SALES_HISTORY);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [empForm, setEmpForm] = useState({ id: null, name: "", role: "Barista", shift: "Matutino", phone: "" });
  const [showEmpModal, setShowEmpModal] = useState(false);

  const [providers, setProviders] = useState(INITIAL_PROVIDERS);
  const [provForm, setProvForm] = useState({ id: null, name: "", contact: "", phone: "", product: "" });
  const [showProvModal, setShowProvModal] = useState(false);

  const [invoices, setInvoices] = useState(INITIAL_INVOICES);

  const handleLogin = (e) => {
    e.preventDefault();
    setUser({
      name: loginRole === "admin" ? "Administrador General" : "Empleado de Caja",
      role: loginRole
    });
    setLoginPass("");
  };

  const handleLogout = () => {
    setUser(null);
    setAdminView(null);
    setCategory("calientes");
  };

  const products = useMemo(() => {
    const list = PRODUCTS[category] || [];
    if (!query.trim()) return list;
    return list.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  }, [category, query]);

  const openProductSelector = (product) => {
    setActiveProduct(product);
    setSelectedFlavor(product.flavors[0]);
    setSelectedSize(SIZES[0]);
  };

  const confirmAddToCart = () => {
    if (!activeProduct) return;
    const isBeverage = category === "calientes" || category === "frias";
    const finalPrice = activeProduct.basePrice + (isBeverage ? selectedSize.modifier : 0);
    
    const fullName = isBeverage
      ? `${activeProduct.name} ${selectedFlavor} (${selectedSize.label.split(" ")[0]})`
      : `${activeProduct.name} (${selectedFlavor})`;

    const cartId = `${activeProduct.id}_${selectedFlavor}_${selectedSize.id}`;

    setCart((prev) => {
      const existing = prev.find((i) => i.cartId === cartId);
      if (existing) {
        return prev.map((i) => (i.cartId === cartId ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, {
        cartId,
        id: activeProduct.id,
        name: fullName,
        price: finalPrice,
        qty: 1,
        isBeverage,
        sizeId: selectedSize.id,
        category
      }];
    });

    setActiveProduct(null);
  };

  const changeQty = (cartId, delta) => {
    setCart((prev) =>
      prev.map((i) => (i.cartId === cartId ? { ...i, qty: i.qty + delta } : i)).filter((i) => i.qty > 0)
    );
  };

  const removeItem = (cartId) => setCart((prev) => prev.filter((i) => i.cartId !== cartId));

  // Cálculo total entero (sin desglose de IVA explícito)
  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const itemCount = cart.reduce((sum, i) => sum + i.qty, 0);

  const openCheckout = () => {
    if (!cart.length) return;
    setAmountReceived("");
    setShowCheckoutModal(true);
  };

  const processFinalCheckout = () => {
    const receivedNum = parseInt(amountReceived, 10) || 0;
    if (paymentMethod === "efectivo" && receivedNum < total) {
      alert("La cantidad ingresada es menor al total a pagar.");
      return;
    }

    const calculatedChange = paymentMethod === "efectivo" ? receivedNum - total : 0;

    let updatedInv = [...inventory];
    cart.forEach(item => {
      if (item.isBeverage) {
        let vId = item.sizeId === "chico" ? "inv_v_ch" : item.sizeId === "mediano" ? "inv_v_med" : "inv_v_gde";
        let tId = item.category === "calientes" ? "inv_t_cal" : "inv_t_fri";

        updatedInv = updatedInv.map(inv => {
          if (inv.id === vId || inv.id === tId) {
            return { ...inv, stock: Math.max(0, inv.stock - item.qty) };
          }
          return inv;
        });
      }
    });

    setInventory(updatedInv);

    const newSale = {
      id: Math.floor(1000 + Math.random() * 9000),
      date: new Date().toLocaleString("es-MX"),
      total,
      paymentMethod,
      cashGiven: paymentMethod === "efectivo" ? receivedNum : total,
      changeGiven: calculatedChange,
      itemsCount: itemCount,
      items: cart.map(x => ({ ...x }))
    };

    setSalesHistory([newSale, ...salesHistory]);
    setCart([]);
    setShowCheckoutModal(false);

    if (paymentMethod === "efectivo") {
      alert(`Venta cobrada con éxito (#${newSale.id}).\nCambio a devolver: ${mxn(calculatedChange)}`);
    } else {
      alert(`Transacción aprobada (#${newSale.id}) en terminal.`);
    }
  };

  // Inyectar más dinero de cambio a la caja
  const handleAddExtraCash = (e) => {
    e.preventDefault();
    const amount = parseInt(cashAddition, 10);
    if (amount && amount > 0) {
      setInitialCash(prev => prev + amount);
      setCashAddition("");
      alert(`Se han añadido ${mxn(amount)} a la caja inicial para cambio.`);
    }
  };

  const handleSaveEmployee = (e) => {
    e.preventDefault();
    if (empForm.id) {
      setEmployees(prev => prev.map(emp => emp.id === empForm.id ? { ...emp, ...empForm } : emp));
    } else {
      setEmployees(prev => [...prev, { ...empForm, id: Date.now(), status: "Activo" }]);
    }
    setEmpForm({ id: null, name: "", role: "Barista", shift: "Matutino", phone: "" });
    setShowEmpModal(false);
  };

  const handleEditEmp = (emp) => {
    setEmpForm(emp);
    setShowEmpModal(true);
  };

  const handleDeleteEmp = (id) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  const handleSaveProvider = (e) => {
    e.preventDefault();
    if (provForm.id) {
      setProviders(prev => prev.map(p => p.id === provForm.id ? { ...p, ...provForm } : p));
    } else {
      setProviders(prev => [...prev, { ...provForm, id: Date.now(), status: "Activo" }]);
    }
    setProvForm({ id: null, name: "", contact: "", phone: "", product: "" });
    setShowProvModal(false);
  };

  const handleEditProv = (p) => {
    setProvForm(p);
    setShowProvModal(true);
  };

  const handleDeleteProv = (id) => {
    setProviders(prev => prev.filter(p => p.id !== id));
  };

  const handleSimulateInvoice = () => {
    const nextNum = invoices.length + 1;
    const newFac = {
      id: `FAC-00${nextNum}`,
      client: "Cliente Mostrador Frecuente",
      rfc: "XAXX010101000",
      total: Math.floor(200 + Math.random() * 800),
      date: new Date().toLocaleDateString("es-MX"),
      status: "Timbrada"
    };
    setInvoices([newFac, ...invoices]);
    alert(`Factura ${newFac.id} generada y timbrada exitosamente.`);
  };

  const filteredInventory = useMemo(() => {
    let items = [...inventory];
    if (invCategoryFilter !== "todas") {
      items = items.filter(i => i.category === invCategoryFilter);
    }
    if (invQuery.trim()) {
      items = items.filter(i => i.name.toLowerCase().includes(invQuery.toLowerCase()));
    }
    return items;
  }, [inventory, invCategoryFilter, invQuery]);

  const salesMetrics = useMemo(() => {
    const totalVendido = salesHistory.reduce((sum, s) => sum + s.total, 0);
    const efectivo = salesHistory.filter(s => s.paymentMethod === "efectivo").reduce((sum, s) => sum + s.total, 0);
    const tarjeta = salesHistory.filter(s => s.paymentMethod === "tarjeta").reduce((sum, s) => sum + s.total, 0);
    const totalCambio = salesHistory.reduce((sum, s) => sum + (s.changeGiven || 0), 0);
    return { totalVendido, efectivo, tarjeta, totalCambio, ticketsCount: salesHistory.length };
  }, [salesHistory]);

  const reportMetrics = useMemo(() => {
    const totalSemana = INITIAL_WEEKLY_SALES.reduce((s, x) => s + x.sales, 0);
    const totalTickets = INITIAL_WEEKLY_SALES.reduce((s, x) => s + x.tickets, 0);
    const maxSale = Math.max(...INITIAL_WEEKLY_SALES.map(x => x.sales), 1);
    return { totalSemana, totalTickets, promedio: totalSemana / (totalTickets || 1), maxSale };
  }, []);

  // LOGIN SCREEN
  if (!user) {
    return h("div", { className: "login-container" },
      h("div", { className: "login-card" },
        h("h2", { style: { textAlign: "center", marginBottom: 4 } }, "Cafetería Origen"),
        h("div", { className: "brand-sub", style: { textAlign: "center", marginBottom: 20 } }, "Punto de Venta e Inventarios"),
        h("form", { onSubmit: handleLogin },
          h("div", { style: { marginBottom: 14 } },
            h("label", { className: "stat-label", style: { display: "block", marginBottom: 6 } }, "Tipo de Usuario"),
            h("select", {
              className: "search-input",
              style: { width: "100%", padding: 10, borderRadius: 8, border: "1px solid #d8cfc2", background: "#fff" },
              value: loginRole,
              onChange: (e) => setLoginRole(e.target.value)
            },
              h("option", { value: "empleado" }, "Empleado / Barista"),
              h("option", { value: "admin" }, "Administrador / Gerente")
            )
          ),
          h("div", { style: { marginBottom: 20 } },
            h("label", { className: "stat-label", style: { display: "block", marginBottom: 6 } }, "Contraseña"),
            h("input", {
              type: "password",
              required: true,
              placeholder: "••••••••",
              className: "search-input",
              style: { width: "100%", padding: 10, borderRadius: 8, border: "1px solid #d8cfc2", background: "#fff" },
              value: loginPass,
              onChange: (e) => setLoginPass(e.target.value)
            })
          ),
          h("button", { type: "submit", className: "charge-btn", style: { marginTop: 0 } }, "Ingresar al Sistema")
        )
      )
    );
  }

  // RENDER DE VISTAS PRINCIPALES Y GERENCIA
  const renderMainContent = () => {
    if (adminView === "sales" && user.role === "admin") {
      return h("div", { className: "admin-section" },
        h("div", { className: "main-header" },
          h("div", null,
            h("h2", { className: "main-title" }, "Historial de Ventas y Arqueo de Caja"),
            h("div", { className: "brand-sub" }, "Detalle de cobros, recibidos y devoluciones")
          )
        ),
        h("div", { className: "cards-grid" },
          h("div", { className: "stat-card" }, h("span", { className: "stat-label" }, "Ingresos Totales"), h("div", { className: "stat-val" }, mxn(salesMetrics.totalVendido))),
          h("div", { className: "stat-card" }, h("span", { className: "stat-label" }, "Efectivo Recibido"), h("div", { className: "stat-val", style: { color: "#46704d" } }, mxn(salesMetrics.efectivo))),
          h("div", { className: "stat-card" }, h("span", { className: "stat-label" }, "Cambio Entregado"), h("div", { className: "stat-val", style: { color: "#c67c2e" } }, mxn(salesMetrics.totalCambio))),
          h("div", { className: "stat-card" }, h("span", { className: "stat-label" }, "Total Tarjetas"), h("div", { className: "stat-val", style: { color: "#4f7cac" } }, mxn(salesMetrics.tarjeta)))
        ),
        h("div", { className: "table-container", style: { marginTop: 10 } },
          h("table", { className: "admin-table" },
            h("thead", null,
              h("tr", null,
                h("th", null, "Folio Ticket"),
                h("th", null, "Fecha"),
                h("th", null, "Método"),
                h("th", null, "Monto Pagado"),
                h("th", null, "Cambio"),
                h("th", null, "Total Venta"),
                h("th", null, "Detalle")
              )
            ),
            h("tbody", null,
              salesHistory.map(s =>
                h("tr", { key: s.id },
                  h("td", { style: { fontWeight: "bold" } }, `#TK-${s.id}`),
                  h("td", null, s.date),
                  h("td", null, h("span", { className: `status-tag ${s.paymentMethod === "efectivo" ? "status-ok" : "status-warn"}` }, s.paymentMethod.toUpperCase())),
                  h("td", null, mxn(s.cashGiven || s.total)),
                  h("td", null, mxn(s.changeGiven || 0)),
                  h("td", { style: { fontWeight: "bold" } }, mxn(s.total)),
                  h("td", null, h("button", { className: "trash-btn", onClick: () => setSelectedTicket(s) }, h(IconReceipt, { size: 16 })))
                )
              )
            )
          )
        ),
        selectedTicket && h("div", { className: "form-card", style: { marginTop: 10 } },
          h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
            h("h3", null, `Ticket #TK-${selectedTicket.id}`),
            h("button", { className: "btn-sm btn-secondary", onClick: () => setSelectedTicket(null) }, "Cerrar")
          ),
          h("div", { style: { fontSize: 13, margin: "10px 0", color: "#8a8176" } }, `Fecha: ${selectedTicket.date} | Pago: ${selectedTicket.paymentMethod.toUpperCase()} | Recibido: ${mxn(selectedTicket.cashGiven || selectedTicket.total)} | Cambio: ${mxn(selectedTicket.changeGiven || 0)}`),
          h("div", { className: "table-container" },
            h("table", { className: "admin-table" },
              h("thead", null,
                h("tr", null,
                  h("th", null, "Producto"),
                  h("th", null, "Precio Unit."),
                  h("th", null, "Cant."),
                  h("th", null, "Subtotal")
                )
              ),
              h("tbody", null,
                selectedTicket.items.map((it, idx) =>
                  h("tr", { key: idx },
                    h("td", null, it.name),
                    h("td", null, mxn(it.price)),
                    h("td", null, it.qty),
                    h("td", null, mxn(it.price * it.qty))
                  )
                )
              )
            )
          )
        )
      );
    }

    if (adminView === "invoices" && user.role === "admin") {
      return h("div", { className: "admin-section" },
        h("div", { className: "main-header" },
          h("h2", { className: "main-title" }, "Gestión de Facturas (CFDI)"),
          h("button", {
            className: "charge-btn",
            style: { width: "auto", padding: "8px 16px" },
            onClick: handleSimulateInvoice
          }, "+ Generar Factura")
        ),
        h("div", { className: "table-container" },
          h("table", { className: "admin-table" },
            h("thead", null,
              h("tr", null,
                h("th", null, "Folio"),
                h("th", null, "Cliente"),
                h("th", null, "RFC"),
                h("th", null, "Fecha"),
                h("th", null, "Total"),
                h("th", null, "Estado")
              )
            ),
            h("tbody", null,
              invoices.map(fac =>
                h("tr", { key: fac.id },
                  h("td", { style: { fontWeight: "bold" } }, fac.id),
                  h("td", null, fac.client),
                  h("td", null, fac.rfc),
                  h("td", null, fac.date),
                  h("td", { style: { fontWeight: "bold" } }, mxn(fac.total)),
                  h("td", null, h("span", { className: `status-tag ${fac.status === "Timbrada" ? "status-ok" : "status-warn"}` }, fac.status))
                )
              )
            )
          )
        )
      );
    }

    // INFORMES Y APERTURA/CORTE DE CAJA
    if (adminView === "reports" && user.role === "admin") {
      const efectivoNetoEnCaja = initialCash + salesMetrics.efectivo - salesMetrics.totalCambio;

      return h("div", { className: "admin-section" },
        h("div", { className: "main-header" },
          h("h2", { className: "main-title" }, "Informes de Caja y Desempeño"),
          h("button", { className: "btn-sm btn-secondary", onClick: () => window.print() }, h(IconFileText, { size: 14 }), " Imprimir Informe")
        ),

        // BLOQUE DE CONTROL DE APERTURA, FONDO Y CAMBIO DE TURNO
        h("div", { className: "form-card", style: { background: "#fff", borderLeft: "4px solid #c67c2e" } },
          h("h3", { style: { fontSize: 16, marginBottom: 10 } }, "Control de Caja e Inyección de Cambio"),
          h("div", { className: "cards-grid", style: { marginBottom: 14 } },
            h("div", { className: "stat-card" }, h("span", { className: "stat-label" }, "Caja Inicial (Apertura)"), h("div", { className: "stat-val" }, mxn(initialCash))),
            h("div", { className: "stat-card" }, h("span", { className: "stat-label" }, "Efectivo Físico Esperado"), h("div", { className: "stat-val", style: { color: "#46704d" } }, mxn(efectivoNetoEnCaja))),
            h("div", { className: "stat-card" }, h("span", { className: "stat-label" }, "Reserva Siguiente Turno"), h("div", { className: "stat-val", style: { color: "#4f7cac" } }, mxn(nextShiftReserve)))
          ),
          h("div", { style: { display: "flex", gap: 16, flexWrap: "wrap" } },
            h("form", { onSubmit: handleAddExtraCash, style: { flex: 1, minWidth: 260, display: "flex", gap: 8, alignItems: "flex-end" } },
              h("div", { style: { flex: 1 } },
                h("label", { className: "stat-label", style: { display: "block", marginBottom: 4 } }, "Agregar dinero a caja (para cambio):"),
                h("input", {
                  type: "number",
                  placeholder: "$ Monto a añadir",
                  value: cashAddition,
                  onChange: e => setCashAddition(e.target.value),
                  style: { width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d8cfc2" }
                })
              ),
              h("button", { type: "submit", className: "btn-sm btn-secondary", style: { padding: "9px 14px" } }, "+ Añadir Fondo")
            ),
            h("div", { style: { flex: 1, minWidth: 260, display: "flex", gap: 8, alignItems: "flex-end" } },
              h("div", { style: { flex: 1 } },
                h("label", { className: "stat-label", style: { display: "block", marginBottom: 4 } }, "Caja Base para Siguiente Turno:"),
                h("input", {
                  type: "number",
                  value: nextShiftReserve,
                  onChange: e => setNextShiftReserve(parseInt(e.target.value, 10) || 0),
                  style: { width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d8cfc2" }
                })
              ),
              h("button", { className: "btn-sm btn-secondary", style: { padding: "9px 14px" }, onClick: () => alert(`Fondo de ${mxn(nextShiftReserve)} fijado para el siguiente turno.`) }, "Establecer")
            )
          )
        ),

        h("div", { className: "cards-grid" },
          h("div", { className: "stat-card" }, h("span", { className: "stat-label" }, "Ventas Semanales Totales"), h("div", { className: "stat-val" }, mxn(reportMetrics.totalSemana))),
          h("div", { className: "stat-card" }, h("span", { className: "stat-label" }, "Tickets Totales"), h("div", { className: "stat-val" }, reportMetrics.totalTickets)),
          h("div", { className: "stat-card" }, h("span", { className: "stat-label" }, "Ticket Promedio"), h("div", { className: "stat-val" }, mxn(reportMetrics.promedio)))
        ),
        h("div", { className: "bar-chart-container" },
          INITIAL_WEEKLY_SALES.map(x => 
            h("div", { key: x.day, className: "bar-col" },
              h("span", { className: "bar-val" }, mxn(x.sales)),
              h("div", { className: "bar-fill", style: { height: `${Math.round((x.sales / reportMetrics.maxSale) * 140)}px` } }),
              h("span", { className: "bar-label" }, x.day)
            )
          )
        )
      );
    }

    if (adminView === "employees" && user.role === "admin") {
      return h("div", { className: "admin-section" },
        h("div", { className: "main-header" },
          h("h2", { className: "main-title" }, "Directorio de Empleados"),
          h("button", {
            className: "charge-btn",
            style: { width: "auto", padding: "8px 16px" },
            onClick: () => { setEmpForm({ id: null, name: "", role: "Barista", shift: "Matutino", phone: "" }); setShowEmpModal(true); }
          }, "+ Nuevo Empleado")
        ),
        showEmpModal && h("form", { className: "form-card", onSubmit: handleSaveEmployee },
          h("h3", null, empForm.id ? "Editar Empleado" : "Registrar Empleado"),
          h("div", { className: "form-grid" },
            h("input", { required: true, placeholder: "Nombre completo", value: empForm.name, onChange: e => setEmpForm({ ...empForm, name: e.target.value }) }),
            h("input", { required: true, placeholder: "Teléfono", value: empForm.phone, onChange: e => setEmpForm({ ...empForm, phone: e.target.value }) }),
            h("select", { value: empForm.role, onChange: e => setEmpForm({ ...empForm, role: e.target.value }) },
              h("option", { value: "Barista" }, "Barista"),
              h("option", { value: "Cajero / Barista" }, "Cajero / Barista")
            )
          ),
          h("div", { style: { display: "flex", gap: 10, marginTop: 10 } },
            h("button", { type: "submit", className: "charge-btn", style: { width: "auto" } }, "Guardar"),
            h("button", { type: "button", className: "btn-sm btn-secondary", onClick: () => setShowEmpModal(false) }, "Cancelar")
          )
        ),
        h("div", { className: "table-container" },
          h("table", { className: "admin-table" },
            h("thead", null, h("tr", null, h("th", null, "Nombre"), h("th", null, "Puesto"), h("th", null, "Turno"), h("th", null, "Teléfono"), h("th", null, "Estado"), h("th", null, "Acciones"))),
            h("tbody", null,
              employees.map(emp =>
                h("tr", { key: emp.id },
                  h("td", { style: { fontWeight: "bold" } }, emp.name),
                  h("td", null, emp.role),
                  h("td", null, emp.shift),
                  h("td", null, emp.phone),
                  h("td", null, h("span", { className: "status-tag status-ok" }, emp.status)),
                  h("td", null,
                    h("button", { className: "trash-btn", onClick: () => handleEditEmp(emp), style: { marginRight: 8 } }, h(IconEdit, { size: 14 })),
                    h("button", { className: "trash-btn", onClick: () => handleDeleteEmp(emp.id) }, h(IconTrash, { size: 14 }))
                  )
                )
              )
            )
          )
        )
      );
    }

    if (adminView === "providers" && user.role === "admin") {
      return h("div", { className: "admin-section" },
        h("div", { className: "main-header" },
          h("h2", { className: "main-title" }, "Directorio de Proveedores"),
          h("button", {
            className: "charge-btn",
            style: { width: "auto", padding: "8px 16px" },
            onClick: () => { setProvForm({ id: null, name: "", contact: "", phone: "", product: "" }); setShowProvModal(true); }
          }, "+ Nuevo Proveedor")
        ),
        showProvModal && h("form", { className: "form-card", onSubmit: handleSaveProvider },
          h("h3", null, provForm.id ? "Editar Proveedor" : "Registrar Proveedor"),
          h("div", { className: "form-grid" },
            h("input", { required: true, placeholder: "Nombre del proveedor", value: provForm.name, onChange: e => setProvForm({ ...provForm, name: e.target.value }) }),
            h("input", { required: true, placeholder: "Contacto", value: provForm.contact, onChange: e => setProvForm({ ...provForm, contact: e.target.value }) }),
            h("input", { required: true, placeholder: "Teléfono", value: provForm.phone, onChange: e => setProvForm({ ...provForm, phone: e.target.value }) }),
            h("input", { required: true, placeholder: "Suministro", value: provForm.product, onChange: e => setProvForm({ ...provForm, product: e.target.value }) })
          ),
          h("div", { style: { display: "flex", gap: 10, marginTop: 10 } },
            h("button", { type: "submit", className: "charge-btn", style: { width: "auto" } }, "Guardar"),
            h("button", { type: "button", className: "btn-sm btn-secondary", onClick: () => setShowProvModal(false) }, "Cancelar")
          )
        ),
        h("div", { className: "table-container" },
          h("table", { className: "admin-table" },
            h("thead", null, h("tr", null, h("th", null, "Proveedor"), h("th", null, "Contacto"), h("th", null, "Suministro"), h("th", null, "Teléfono"), h("th", null, "Estado"), h("th", null, "Acciones"))),
            h("tbody", null,
              providers.map(p =>
                h("tr", { key: p.id },
                  h("td", { style: { fontWeight: "bold" } }, p.name),
                  h("td", null, p.contact),
                  h("td", null, p.product),
                  h("td", null, p.phone),
                  h("td", null, h("span", { className: "status-tag status-ok" }, p.status)),
                  h("td", null,
                    h("button", { className: "trash-btn", onClick: () => handleEditProv(p), style: { marginRight: 8 } }, h(IconEdit, { size: 14 })),
                    h("button", { className: "trash-btn", onClick: () => handleDeleteProv(p.id) }, h(IconTrash, { size: 14 }))
                  )
                )
              )
            )
          )
        )
      );
    }

    if (category === "inventario") {
      return h("div", { className: "admin-section" },
        h("div", { className: "main-header" },
          h("div", null,
            h("h2", { className: "main-title" }, "Control de Inventario e Insumos"),
            h("span", { className: "main-count" }, `${filteredInventory.length} ítems registrados`)
          )
        ),
        h("div", { className: "form-card", style: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" } },
          h("div", { className: "topbar-center", style: { flex: 1, minWidth: 220 } },
            h(IconSearch, { size: 16 }),
            h("input", {
              value: invQuery,
              onChange: (e) => setInvQuery(e.target.value),
              placeholder: "Buscar vasos, tapas o insumos...",
              className: "search-input",
            })
          ),
          h("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
            h("span", { className: "stat-label" }, "Categoría:"),
            h("select", {
              value: invCategoryFilter,
              onChange: (e) => setInvCategoryFilter(e.target.value),
              style: { padding: "8px 12px", borderRadius: 6, border: "1px solid #d8cfc2", background: "#fff" }
            },
              h("option", { value: "todas" }, "Todas"),
              h("option", { value: "Empaques" }, "Empaques y Vasos"),
              h("option", { value: "Insumos Base" }, "Insumos Base"),
              h("option", { value: "Lácteos" }, "Lácteos")
            )
          )
        ),
        h("div", { className: "table-container" },
          h("table", { className: "admin-table" },
            h("thead", null,
              h("tr", null,
                h("th", null, "Insumo / Empaque"),
                h("th", null, "Categoría"),
                h("th", null, "Stock Disponible"),
                h("th", null, "Mínimo"),
                h("th", null, "Estado")
              )
            ),
            h("tbody", null,
              filteredInventory.map(item =>
                h("tr", { key: item.id },
                  h("td", { style: { fontWeight: "bold" } }, item.name),
                  h("td", null, item.category),
                  h("td", { style: { fontWeight: "bold" } }, `${item.stock} ${item.unit}`),
                  h("td", null, `${item.minStock} ${item.unit}`),
                  h("td", null,
                    h("span", { className: `status-tag ${item.stock <= item.minStock ? "status-warn" : "status-ok"}` },
                      item.stock <= item.minStock ? "Stock Bajo" : "Suficiente"
                    )
                  )
                )
              )
            )
          )
        )
      );
    }

    return h(React.Fragment, null,
      h("div", { className: "main-header" },
        h("h2", { className: "main-title" }, CATEGORIES.find((c) => c.id === category)?.label),
        h("span", { className: "main-count" }, `${products.length} variedad(es)`)
      ),
      h("div", { className: "grid" },
        products.map((p) =>
          h("button", {
            key: p.id,
            onClick: () => openProductSelector(p),
            className: "product-card"
          },
            h("div", { className: "product-name", style: { fontSize: 15 } }, p.name),
            h("div", { className: "brand-sub", style: { marginTop: 4 } }, `${p.flavors.length} opciones`),
            h("div", { className: "product-price" }, `Desde ${mxn(p.basePrice)}`)
          )
        )
      )
    );
  };

  return h("div", { className: "app" },
    h("header", { className: "topbar" },
      h("div", { className: "brand", onClick: () => setAdminView(null), style: { cursor: "pointer" } },
        h("div", null,
          h("div", { className: "brand-name" }, "Cafetería Origen"),
          h("div", { className: "brand-sub" }, "Sucursal Centro · Caja 1")
        )
      ),
      h("div", { className: "topbar-center" },
        h(IconSearch, { size: 16 }),
        h("input", {
          value: query,
          onChange: (e) => setQuery(e.target.value),
          placeholder: "Buscar producto...",
          className: "search-input",
        })
      ),
      h("div", { className: "topbar-right" },
        h("span", { className: "status-tag status-ok" }, user.role === "admin" ? "Admin" : "Empleado"),
        user.role === "admin" && h("div", { style: { position: "relative" } },
          h("button", { onClick: () => setAdminOpen(!adminOpen), className: "admin-menu-btn" },
            "Gerencia ", h(IconChevron, { size: 14 })
          ),
          adminOpen && h("div", { className: "admin-dropdown" },
            ADMIN_VIEWS.map((item) =>
              h("button", {
                key: item.id,
                onClick: () => { setAdminView(item.id); setAdminOpen(false); },
                className: "admin-dropdown-item"
              }, item.label)
            )
          )
        ),
        h("button", { className: "trash-btn", onClick: handleLogout, title: "Cerrar sesión" }, h(IconLogout, { size: 18 }))
      )
    ),
    h("div", { className: "body" },
      h("nav", { className: "sidebar" },
        h("div", { className: "sidebar-label" }, "Categorías"),
        CATEGORIES.map((cat) =>
          h("button", {
            key: cat.id,
            onClick: () => { setCategory(cat.id); setAdminView(null); },
            className: `cat-btn ${category === cat.id && !adminView ? "active" : ""}`,
          }, cat.label)
        )
      ),
      h("main", { className: "main" }, renderMainContent()),
      
      !adminView && category !== "inventario" && h("aside", { className: "receipt-wrap" },
        h("div", { className: "receipt" },
          h("div", { className: "receipt-header" },
            h("div", { className: "receipt-title" }, "Ticket actual"),
            h("div", { className: "receipt-sub" }, `${itemCount} artículo(s)`)
          ),
          h("div", { className: "receipt-divider" }),
          h("div", { className: "receipt-items" },
            cart.length === 0
              ? h("div", { className: "empty-cart" }, "Selecciona un producto para la orden.")
              : cart.map((item) =>
                  h("div", { key: item.cartId, className: "receipt-item" },
                    h("div", { className: "receipt-item-top" },
                      h("span", { className: "receipt-item-name" }, item.name),
                      h("button", { onClick: () => removeItem(item.cartId), className: "trash-btn" }, h(IconTrash, { size: 13 }))
                    ),
                    h("div", { className: "receipt-item-bottom" },
                      h("div", { className: "qty-controls" },
                        h("button", { onClick: () => changeQty(item.cartId, -1), className: "qty-btn" }, h(IconMinus, { size: 11 })),
                        h("span", { className: "qty-value" }, item.qty),
                        h("button", { onClick: () => changeQty(item.cartId, 1), className: "qty-btn" }, h(IconPlus, { size: 11 }))
                      ),
                      h("span", { className: "receipt-item-price" }, mxn(item.price * item.qty))
                    )
                  )
                )
          ),
          h("div", { className: "receipt-divider-dashed" }),
          h("div", { className: "totals-block" },
            h("div", { className: "total-row-final" }, h("span", null, "TOTAL (IVA inc.)"), h("span", null, mxn(total)))
          ),
          h("div", { className: "pay-buttons" },
            h("button", {
              className: `pay-btn ${paymentMethod === "efectivo" ? "active" : ""}`,
              onClick: () => setPaymentMethod("efectivo")
            }, "Efectivo"),
            h("button", {
              className: `pay-btn ${paymentMethod === "tarjeta" ? "active" : ""}`,
              onClick: () => setPaymentMethod("tarjeta")
            }, "Tarjeta")
          ),
          h("button", { className: "charge-btn", onClick: openCheckout }, `Cobrar ${mxn(total)}`)
        )
      )
    ),

    // MODAL DE PERSONALIZACIÓN DE PRODUCTO
    activeProduct && h("div", { className: "login-container", style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100 } },
      h("div", { className: "form-card", style: { width: 360, background: "#fff" } },
        h("h3", { style: { marginBottom: 4 } }, activeProduct.name),
        h("div", { className: "brand-sub", style: { marginBottom: 14 } }, "Personaliza la opción"),
        
        h("div", { style: { marginBottom: 14 } },
          h("label", { className: "stat-label", style: { display: "block", marginBottom: 6 } }, "Sabor / Variedad:"),
          h("select", {
            value: selectedFlavor,
            onChange: (e) => setSelectedFlavor(e.target.value),
            style: { width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d8cfc2" }
          },
            activeProduct.flavors.map(f => h("option", { key: f, value: f }, f))
          )
        ),

        (category === "calientes" || category === "frias") && h("div", { style: { marginBottom: 16 } },
          h("label", { className: "stat-label", style: { display: "block", marginBottom: 6 } }, "Tamaño:"),
          h("div", { style: { display: "flex", flexDirection: "column", gap: 6 } },
            SIZES.map(s =>
              h("button", {
                key: s.id,
                onClick: () => setSelectedSize(s),
                className: `pay-btn ${selectedSize.id === s.id ? "active" : ""}`,
                style: { justifyContent: "space-between", padding: "8px 12px" }
              },
                h("span", null, s.label),
                h("span", null, mxn(activeProduct.basePrice + s.modifier))
              )
            )
          )
        ),

        h("div", { style: { display: "flex", gap: 8, marginTop: 16 } },
          h("button", { className: "charge-btn", style: { marginTop: 0, flex: 1 }, onClick: confirmAddToCart }, "Agregar a Orden"),
          h("button", { className: "btn-sm btn-secondary", onClick: () => setActiveProduct(null) }, "Cancelar")
        )
      )
    ),

    // MODAL DE COBRO CON BILLETES DE BARRIDO RÁPIDO
    showCheckoutModal && h("div", { className: "login-container", style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 110 } },
      h("div", { className: "form-card", style: { width: 380, background: "#fff", padding: 20 } },
        h("h3", { style: { marginBottom: 4 } }, paymentMethod === "efectivo" ? "Cobro en Efectivo" : "Cobro con Tarjeta"),
        h("div", { className: "brand-sub", style: { marginBottom: 16 } }, `Monto Total a Cobrar: ${mxn(total)}`),

        paymentMethod === "efectivo" ? h("div", null,
          h("label", { className: "stat-label", style: { display: "block", marginBottom: 6 } }, "Paga con:"),
          h("input", {
            type: "number",
            step: "1",
            autoFocus: true,
            placeholder: "$0",
            value: amountReceived,
            onChange: (e) => setAmountReceived(e.target.value),
            style: { width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #d8cfc2", fontSize: 18, fontWeight: "bold" }
          }),
          h("div", { className: "quick-cash-buttons" },
            [50, 100, 200, 500].map(val =>
              h("button", {
                key: val,
                className: "btn-sm btn-secondary",
                onClick: () => setAmountReceived(val.toString())
              }, `$${val}`)
            )
          ),
          h("div", { className: "checkout-calc-card" },
            h("div", { style: { fontSize: 12, color: "#8a8176" } }, "Cambio a devolver:"),
            h("div", { className: "checkout-calc-val" },
              mxn(Math.max(0, (parseInt(amountReceived, 10) || 0) - total))
            )
          )
        ) : h("div", { className: "checkout-calc-card", style: { textAlign: "center", padding: "20px 12px" } },
          h("div", { style: { fontSize: 14, fontWeight: "bold", color: "#4f7cac" } }, "Continúa el proceso en la terminal de cobro..."),
          h("div", { style: { fontSize: 12, color: "#8a8176", marginTop: 6 } }, "Acerca o inserta la tarjeta del cliente para completar la transacción.")
        ),

        h("div", { style: { display: "flex", gap: 8, marginTop: 18 } },
          h("button", { className: "charge-btn", style: { marginTop: 0, flex: 1 }, onClick: processFinalCheckout }, "Confirmar Transacción"),
          h("button", { className: "btn-sm btn-secondary", onClick: () => setShowCheckoutModal(false) }, "Cancelar")
        )
      )
    )
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(h(CafeteriaPOS));