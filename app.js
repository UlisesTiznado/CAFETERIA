const { useState, useMemo, createElement: h } = React;

const Icon = ({ children, size = 16 }) =>
  h("span", { style: { fontSize: size, lineHeight: 1, display: "inline-flex" } }, children);

const IconCoffee = (p) => h(Icon, p, "☕");
const IconCupSoda = (p) => h(Icon, p, "🥤");
const IconCookie = (p) => h(Icon, p, "🥐");
const IconCake = (p) => h(Icon, p, "🍰");
const IconSandwich = (p) => h(Icon, p, "🥪");
const IconPlus = (p) => h(Icon, p, "+");
const IconMinus = (p) => h(Icon, p, "−");
const IconTrash = (p) => h(Icon, p, "🗑");
const IconCard = (p) => h(Icon, p, "💳");
const IconCash = (p) => h(Icon, p, "💵");
const IconStore = (p) => h(Icon, p, "🏬");
const IconChevron = (p) => h(Icon, p, "▾");
const IconSearch = (p) => h(Icon, p, "🔍");
const IconUser = (p) => h(Icon, p, "👤");
const IconShield = (p) => h(Icon, p, "🛡");

const CATEGORIES = [
  { id: "calientes", label: "Bebidas calientes", icon: IconCoffee },
  { id: "frias", label: "Bebidas frías", icon: IconCupSoda },
  { id: "panaderia", label: "Panadería", icon: IconCookie },
  { id: "postres", label: "Postres", icon: IconCake },
  { id: "snacks", label: "Snacks", icon: IconSandwich },
];

const PRODUCTS = {
  calientes: [
    { id: "c1", name: "Espresso", price: 35 },
    { id: "c2", name: "Americano", price: 38 },
    { id: "c3", name: "Cappuccino", price: 48 },
    { id: "c4", name: "Latte", price: 52 },
    { id: "c5", name: "Moka", price: 55 },
    { id: "c6", name: "Chocolate caliente", price: 45 },
  ],
  frias: [
    { id: "f1", name: "Frappé vainilla", price: 58 },
    { id: "f2", name: "Frappé moka", price: 60 },
    { id: "f3", name: "Iced latte", price: 50 },
    { id: "f4", name: "Limonada menta", price: 42 },
    { id: "f5", name: "Té helado", price: 38 },
  ],
  panaderia: [
    { id: "p1", name: "Concha", price: 22 },
    { id: "p2", name: "Cuernito", price: 20 },
    { id: "p3", name: "Muffin arándano", price: 35 },
    { id: "p4", name: "Croissant", price: 32 },
  ],
  postres: [
    { id: "d1", name: "Pastel de chocolate", price: 48 },
    { id: "d2", name: "Cheesecake", price: 55 },
    { id: "d3", name: "Brownie", price: 38 },
    { id: "d4", name: "Flan napolitano", price: 32 },
  ],
  snacks: [
    { id: "s1", name: "Sandwich de jamón", price: 65 },
    { id: "s2", name: "Bagel", price: 45 },
    { id: "s3", name: "Ensalada del día", price: 70 },
    { id: "s4", name: "Yogurt con granola", price: 48 },
  ],
};

const ADMIN_LINKS = ["Proveedores", "Cuentas", "Ventas", "Empleados", "Reportes"];

const mxn = (n) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

function CafeteriaPOS() {
  const [category, setCategory] = useState("calientes");
  const [cart, setCart] = useState([]);
  const [role, setRole] = useState("empleado");
  const [adminOpen, setAdminOpen] = useState(false);
  const [query, setQuery] = useState("");

  const products = useMemo(() => {
    const list = PRODUCTS[category];
    if (!query.trim()) return list;
    return list.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  }, [category, query]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const changeQty = (id, delta) => {
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i)).filter((i) => i.qty > 0)
    );
  };

  const removeItem = (id) => setCart((prev) => prev.filter((i) => i.id !== id));

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const iva = subtotal * 0.16;
  const total = subtotal + iva;
  const itemCount = cart.reduce((sum, i) => sum + i.qty, 0);

  return h(
    "div",
    { className: "app" },
    h(
      "header",
      { className: "topbar" },
      h(
        "div",
        { className: "brand" },
        h("div", { className: "brand-mark" }, "☕"),
        h(
          "div",
          null,
          h("div", { className: "brand-name" }, "Cafetería Origen"),
          h("div", { className: "brand-sub" }, "Sucursal Centro · Caja 1")
        )
      ),
      h(
        "div",
        { className: "topbar-center" },
        h(IconSearch, { size: 16 }),
        h("input", {
          value: query,
          onChange: (e) => setQuery(e.target.value),
          placeholder: "Buscar producto...",
          className: "search-input",
        })
      ),
      h(
        "div",
        { className: "topbar-right" },
        h(
          "div",
          { className: "role-switch" },
          h(
            "button",
            {
              onClick: () => setRole("empleado"),
              className: `role-btn ${role === "empleado" ? "active-empleado" : ""}`,
            },
            h(IconUser, { size: 13 }),
            " Empleado"
          ),
          h(
            "button",
            {
              onClick: () => setRole("admin"),
              className: `role-btn ${role === "admin" ? "active-admin" : ""}`,
            },
            h(IconShield, { size: 13 }),
            " Admin"
          )
        ),
        role === "admin" &&
          h(
            "div",
            { style: { position: "relative" } },
            h(
              "button",
              { onClick: () => setAdminOpen((v) => !v), className: "admin-menu-btn" },
              h(IconStore, { size: 14 }),
              " Gerencia ",
              h(IconChevron, { size: 14 })
            ),
            adminOpen &&
              h(
                "div",
                { className: "admin-dropdown" },
                ADMIN_LINKS.map((link) =>
                  h(
                    "button",
                    { key: link, className: "admin-dropdown-item" },
                    link,
                    h("span", { className: "soon-tag" }, "próximamente")
                  )
                )
              )
          )
      )
    ),
    h(
      "div",
      { className: "body" },
      h(
        "nav",
        { className: "sidebar" },
        h("div", { className: "sidebar-label" }, "Categorías"),
        CATEGORIES.map((cat) => {
          const CatIcon = cat.icon;
          const active = category === cat.id;
          return h(
            "button",
            {
              key: cat.id,
              onClick: () => setCategory(cat.id),
              className: `cat-btn ${active ? "active" : ""}`,
            },
            h(CatIcon, { size: 18 }),
            h("span", null, cat.label)
          );
        })
      ),
      h(
        "main",
        { className: "main" },
        h(
          "div",
          { className: "main-header" },
          h("h2", { className: "main-title" }, CATEGORIES.find((c) => c.id === category)?.label),
          h("span", { className: "main-count" }, `${products.length} producto${products.length !== 1 ? "s" : ""}`)
        ),
        h(
          "div",
          { className: "grid" },
          products.map((p) =>
            h(
              "button",
              { key: p.id, onClick: () => addToCart(p), className: "product-card" },
              h("div", { className: "product-thumb" }, h(CATEGORIES.find((c) => c.id === category).icon, { size: 22 })),
              h("div", { className: "product-name" }, p.name),
              h("div", { className: "product-price" }, mxn(p.price))
            )
          )
        )
      ),
      h(
        "aside",
        { className: "receipt-wrap" },
        h(
          "div",
          { className: "receipt" },
          h(
            "div",
            { className: "receipt-header" },
            h("div", { className: "receipt-title" }, "Ticket actual"),
            h("div", { className: "receipt-sub" }, `${itemCount} artículo${itemCount !== 1 ? "s" : ""}`)
          ),
          h("div", { className: "receipt-divider" }),
          h(
            "div",
            { className: "receipt-items" },
            cart.length === 0
              ? h(
                  "div",
                  { className: "empty-cart" },
                  "Selecciona productos para",
                  h("br"),
                  "comenzar la venta."
                )
              : cart.map((item) =>
                  h(
                    "div",
                    { key: item.id, className: "receipt-item" },
                    h(
                      "div",
                      { className: "receipt-item-top" },
                      h("span", { className: "receipt-item-name" }, item.name),
                      h(
                        "button",
                        { onClick: () => removeItem(item.id), className: "trash-btn" },
                        h(IconTrash, { size: 13 })
                      )
                    ),
                    h(
                      "div",
                      { className: "receipt-item-bottom" },
                      h(
                        "div",
                        { className: "qty-controls" },
                        h(
                          "button",
                          { onClick: () => changeQty(item.id, -1), className: "qty-btn" },
                          h(IconMinus, { size: 11 })
                        ),
                        h("span", { className: "qty-value" }, item.qty),
                        h(
                          "button",
                          { onClick: () => changeQty(item.id, 1), className: "qty-btn" },
                          h(IconPlus, { size: 11 })
                        )
                      ),
                      h("span", { className: "receipt-item-price" }, mxn(item.price * item.qty))
                    )
                  )
                )
          ),
          h("div", { className: "receipt-divider-dashed" }),
          h(
            "div",
            { className: "totals-block" },
            h("div", { className: "total-row" }, h("span", null, "Subtotal"), h("span", null, mxn(subtotal))),
            h("div", { className: "total-row" }, h("span", null, "IVA (16%)"), h("span", null, mxn(iva))),
            h("div", { className: "total-row-final" }, h("span", null, "TOTAL"), h("span", null, mxn(total)))
          ),
          h(
            "div",
            { className: "pay-buttons" },
            h("button", { className: "pay-btn" }, h(IconCash, { size: 16 }), " Efectivo"),
            h("button", { className: "pay-btn pay-btn-card" }, h(IconCard, { size: 16 }), " Tarjeta")
          ),
          h("button", { className: "charge-btn" }, `Cobrar ${mxn(total)}`),
          h(
            "div",
            { className: "perforation" },
            Array.from({ length: 26 }).map((_, i) => h("span", { key: i, className: "perf-dot" }))
          )
        )
      )
    )
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(h(CafeteriaPOS));