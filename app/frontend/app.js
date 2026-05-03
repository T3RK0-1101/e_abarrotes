/* ============================
   CONFIGURACIÓN
============================ */
const API = 'http://100.55.28.128:8000';

/* ============================
   ESTADO GLOBAL
============================ */
const state = {
  usuario: null,
  carrito: [],
  categorias: [],
  productos: [],
  imagenesProductos: {}, // { producto_id: "data:image/..." }
  pedidoActivo: null,
};

/* ============================
   UTILIDADES
============================ */
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type}`;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 3500);
}

function showModal(id) {
  document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

async function api(method, path, body = null) {
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${API}${path}`, opts);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Error desconocido' }));
      throw new Error(err.detail || 'Error en la petición');
    }
    return res.json();
  } catch (e) {
    showToast('❌ ' + e.message, 'error');
    throw e;
  }
}

/* ============================
   MANEJO DE IMÁGENES (localStorage)
   Las imágenes se guardan localmente como base64
   ya que el backend no tiene endpoint de imágenes.
============================ */
function guardarImagenLocal(productoId, base64) {
  try {
    localStorage.setItem(`img_prod_${productoId}`, base64);
    state.imagenesProductos[productoId] = base64;
  } catch(e) {
    // si localStorage está lleno, solo guardar en memoria
    state.imagenesProductos[productoId] = base64;
  }
}

function cargarImagenesLocales() {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('img_prod_')) {
      const id = parseInt(key.replace('img_prod_', ''));
      state.imagenesProductos[id] = localStorage.getItem(key);
    }
  }
}

function getImagenProducto(id) {
  return state.imagenesProductos[id] || null;
}

function eliminarImagenLocal(id) {
  delete state.imagenesProductos[id];
  localStorage.removeItem(`img_prod_${id}`);
}

/* ============================
   PREVIEW DE IMAGEN EN MODAL
============================ */
function previewImagen(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById('prod-imagen-preview');
    const placeholder = document.getElementById('prod-imagen-placeholder');
    preview.src = e.target.result;
    preview.style.display = 'block';
    placeholder.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function resetImagenModal() {
  const preview = document.getElementById('prod-imagen-preview');
  const placeholder = document.getElementById('prod-imagen-placeholder');
  const input = document.getElementById('prod-imagen-input');
  preview.src = '';
  preview.style.display = 'none';
  placeholder.style.display = 'block';
  input.value = '';
}

function cargarImagenEnModal(productoId) {
  const img = getImagenProducto(productoId);
  const preview = document.getElementById('prod-imagen-preview');
  const placeholder = document.getElementById('prod-imagen-placeholder');
  if (img) {
    preview.src = img;
    preview.style.display = 'block';
    placeholder.style.display = 'none';
  } else {
    resetImagenModal();
  }
}

function getImagenDelModal() {
  const preview = document.getElementById('prod-imagen-preview');
  if (preview.src && preview.style.display !== 'none' && preview.src !== window.location.href) {
    return preview.src;
  }
  return null;
}

/* ============================
   RENDER HELPERS
============================ */
function imgTag(productoId, size = 'card') {
  const src = getImagenProducto(productoId);
  if (src) {
    return `<img src="${src}" alt="producto" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" />`;
  }
  return '🛒';
}

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatMoney(n) {
  return '$' + Number(n || 0).toFixed(2);
}

const ESTADOS_ORDEN = ['pendiente', 'pagado', 'enviado', 'entregado'];

const estadoLabels = {
  pendiente: '⏳ Pendiente',
  pagado: '💳 Pagado',
  enviado: '🚚 Enviado',
  entregado: '✅ Entregado',
  cancelado: '❌ Cancelado',
};

/* ============================
   AUTH
============================ */
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach((b, i) => {
    b.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'register'));
  });
  document.getElementById('login-panel').classList.toggle('active', tab === 'login');
  document.getElementById('register-panel').classList.toggle('active', tab === 'register');
}

async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value;
  if (!email || !pass) return showToast('Completa todos los campos', 'error');
  try {
    const res = await api('POST', `/usuarios/login?email=${encodeURIComponent(email)}&contraseña=${encodeURIComponent(pass)}`);
    const userData = await api('GET', `/usuarios/${res.usuario_id}`);
    loginSuccess(userData);
  } catch (_) {}
}

async function handleRegister() {
  const nombre = document.getElementById('reg-nombre').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass = document.getElementById('reg-pass').value;
  if (!nombre || !email || !pass) return showToast('Completa todos los campos', 'error');
  try {
    await api('POST', '/usuarios/', { nombre, email, contraseña: pass, rol: 'cliente' });
    showToast('¡Cuenta creada! Inicia sesión.', 'success');
    switchTab('login');
    document.getElementById('login-email').value = email;
  } catch (_) {}
}

function loginSuccess(user) {
  state.usuario = user;
  cargarImagenesLocales();
  document.getElementById('auth-screen').classList.remove('active');
  document.getElementById('app-screen').classList.add('active');
  document.getElementById('sidebar-name').textContent = user.nombre;
  document.getElementById('sidebar-rol').textContent = user.rol;
  document.getElementById('sidebar-avatar').textContent = user.nombre.charAt(0).toUpperCase();

  if (user.rol === 'admin') {
    document.getElementById('nav-cliente').classList.add('hidden');
    document.getElementById('nav-admin').classList.remove('hidden');
    showSection('admin-productos');
    loadAdminData();
  } else {
    document.getElementById('nav-cliente').classList.remove('hidden');
    document.getElementById('nav-admin').classList.add('hidden');
    showSection('tienda');
    loadTienda();
    loadMisDirecciones();
    loadMisPedidos();
  }
}

function handleLogout() {
  state.usuario = null;
  state.carrito = [];
  state.productos = [];
  state.categorias = [];
  updateCartBadge();
  document.getElementById('app-screen').classList.remove('active');
  document.getElementById('auth-screen').classList.add('active');
  document.getElementById('login-email').value = '';
  document.getElementById('login-pass').value = '';
}

/* ============================
   NAVEGACIÓN
============================ */
function showSection(name) {
  document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
  document.getElementById(`section-${name}`).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const btn = [...document.querySelectorAll('.nav-btn')].find(b => b.getAttribute('onclick')?.includes(`'${name}'`));
  if (btn) btn.classList.add('active');
}

/* ============================
   TIENDA
============================ */
async function loadTienda() {
  try {
    const [productos, categorias] = await Promise.all([api('GET', '/productos/'), api('GET', '/categorias/')]);
    state.productos = productos;
    state.categorias = categorias;
    populateCategoryFilter();
    renderProducts(productos);
  } catch (_) {}
}

function populateCategoryFilter() {
  const sel = document.getElementById('filter-categoria');
  sel.innerHTML = '<option value="">Todas las categorías</option>';
  state.categorias.forEach(c => {
    const o = document.createElement('option');
    o.value = c.id; o.textContent = c.nombre;
    sel.appendChild(o);
  });
}

function filtrarProductos() {
  const q = document.getElementById('search-productos').value.toLowerCase();
  const cat = document.getElementById('filter-categoria').value;
  const filtered = state.productos.filter(p => {
    const matchQ = !q || p.nombre.toLowerCase().includes(q);
    const matchC = !cat || String(p.categoria?.id || p.categoria_id) === cat;
    return matchQ && matchC;
  });
  renderProducts(filtered);
}

function renderProducts(productos) {
  const grid = document.getElementById('products-grid');
  if (!productos.length) {
    grid.innerHTML = '<div class="empty-state">😔 No se encontraron productos</div>';
    return;
  }
  grid.innerHTML = productos.map((p, i) => {
    const catNombre = p.categoria?.nombre || '';
    const imgSrc = p.imagen_url ? `${API}${p.imagen_url}` : null;
    const imgHTML = imgSrc
      ? `<img src="${imgSrc}" alt="${p.nombre}" style="width:100%;height:100%;object-fit:cover;" />`
      : '🛒';
    const stockClass = p.stock < 5 ? 'low' : '';
    return `
      <div class="product-card" style="animation-delay:${i * 0.04}s">
        <div class="product-img">${imgHTML}</div>
        <div class="product-category">${catNombre}</div>
        <div class="product-name">${p.nombre}</div>
        <div class="product-price">${formatMoney(p.precio)}</div>
        <div class="product-stock ${stockClass}">${p.stock > 0 ? `${p.stock} disponibles` : '⚠️ Sin stock'}</div>
        <div class="product-actions">
          <div class="qty-control">
            <button class="qty-btn" onclick="changeQty(${p.id}, -1)">−</button>
            <input class="qty-input" id="qty-${p.id}" type="number" value="1" min="1" max="${p.stock}" />
            <button class="qty-btn" onclick="changeQty(${p.id}, 1)">+</button>
          </div>
          <button class="btn-add-cart" onclick="addToCart(${p.id})" ${p.stock === 0 ? 'disabled style="opacity:.5;cursor:not-allowed"' : ''}>
            🛒 Agregar
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function changeQty(id, delta) {
  const inp = document.getElementById(`qty-${id}`);
  let v = parseInt(inp.value) + delta;
  v = Math.max(1, Math.min(parseInt(inp.max) || 99, v));
  inp.value = v;
}

function addToCart(id) {
  const producto = state.productos.find(p => p.id === id);
  if (!producto) return;
  const qty = parseInt(document.getElementById(`qty-${id}`)?.value || 1);
  const existing = state.carrito.find(item => item.producto.id === id);
  if (existing) {
    existing.cantidad = Math.min(existing.cantidad + qty, producto.stock);
  } else {
    state.carrito.push({ producto, cantidad: qty });
  }
  updateCartBadge();
  renderCarrito();
  showToast(`✅ ${producto.nombre} agregado al carrito`, 'success');
}

function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  const total = state.carrito.reduce((a, i) => a + i.cantidad, 0);
  if (total > 0) { badge.textContent = total; badge.classList.remove('hidden'); }
  else badge.classList.add('hidden');
}

/* ============================
   CARRITO
============================ */
function renderCarrito() {
  const list = document.getElementById('cart-items-list');
  if (!state.carrito.length) {
    list.innerHTML = '<div class="empty-state">🛒 Tu carrito está vacío</div>';
    document.getElementById('cart-subtotal').textContent = '$0.00';
    document.getElementById('cart-total').textContent = '$0.00';
    return;
  }
  let total = 0;
  list.innerHTML = state.carrito.map((item, idx) => {
    const subtotal = item.producto.precio * item.cantidad;
    total += subtotal;
    const imgSrc = item.producto.imagen_url ? `${API}${item.producto.imagen_url}` : null;
    const imgHTML = imgSrc
      ? `<img src="${imgSrc}" alt="${item.producto.nombre}" style="width:100%;height:100%;object-fit:cover;" />`
      : '🛒';
    return `
      <div class="cart-item">
        <div class="cart-item-img">${imgHTML}</div>
        <div class="cart-item-info">
          <div class="name">${item.producto.nombre}</div>
          <div class="price">${formatMoney(item.producto.precio)} × ${item.cantidad}</div>
        </div>
        <div class="cart-item-total">${formatMoney(subtotal)}</div>
        <button class="cart-remove" onclick="removeFromCart(${idx})">✕</button>
      </div>
    `;
  }).join('');
  document.getElementById('cart-subtotal').textContent = formatMoney(total);
  document.getElementById('cart-total').textContent = formatMoney(total);
}

function removeFromCart(idx) {
  state.carrito.splice(idx, 1);
  updateCartBadge();
  renderCarrito();
}

async function realizarPedido() {
  if (!state.carrito.length) return showToast('Tu carrito está vacío', 'error');
  const dirId = document.getElementById('select-direccion').value;
  if (!dirId) return showToast('Selecciona una dirección de entrega', 'error');
  const total = state.carrito.reduce((a, i) => a + i.producto.precio * i.cantidad, 0);
  try {
    const pedido = await api('POST', '/pedidos/', { usuario_id: state.usuario.id, direccion_id: parseInt(dirId), total, estado: 'pendiente' });
    for (const item of state.carrito) {
      await api('POST', '/detalles/', { pedido_id: pedido.id, producto_id: item.producto.id, cantidad: item.cantidad, subtotal: item.producto.precio * item.cantidad });
    }
      showToast('🎉 ¡Pedido realizado con éxito!', 'success');
      state.carrito = [];
      updateCartBadge();
      renderCarrito();
      loadMisPedidos();
      showModal('modal-pago'); // <-- muestra info bancaria
  } catch (_) {}
}

/* ============================
   MIS PEDIDOS
============================ */
async function loadMisPedidos() {
  const list = document.getElementById('mis-pedidos-list');
  try {
    const todos = await api('GET', '/pedidos/');
    const misPedidos = todos.filter(p => p.usuario?.id === state.usuario.id);
    if (!misPedidos.length) { list.innerHTML = '<div class="empty-state">📦 No tienes pedidos aún</div>'; return; }
    list.innerHTML = misPedidos.map(p => pedidoCardHTML(p, false)).join('');
  } catch (_) {}
}

function pedidoCardHTML(p, isAdmin) {
  const estadoClass = `estado-${p.estado || 'pendiente'}`;
  const label = estadoLabels[p.estado] || p.estado || 'Pendiente';
  return `
    <div class="pedido-card" onclick="verDetallePedido(${p.id}, ${isAdmin})">
      <div class="pedido-id">#${p.id}</div>
      <div class="pedido-info">
        <div class="fecha">${formatDate(p.fecha)}</div>
        <div class="usuario">${isAdmin ? (p.usuario?.nombre || '—') : ((p.detalles?.length || 0) + ' producto(s)')}</div>
      </div>
      <div class="pedido-total">${formatMoney(p.total)}</div>
      <div class="estado-tag ${estadoClass}">${label}</div>
    </div>
  `;
}

async function verDetallePedido(id, isAdmin) {
  try {
    const pedido = await api('GET', `/pedidos/${id}`);
    state.pedidoActivo = pedido;
    document.getElementById('modal-pedido-titulo').textContent = `Pedido #${pedido.id}`;
    const estadoActual = pedido.estado || 'pendiente';
    const isCanceled = estadoActual === 'cancelado';
    const activeIdx = ESTADOS_ORDEN.indexOf(estadoActual);

    const trackingHTML = ESTADOS_ORDEN.map((e, i) => {
      let cls = '';
      if (!isCanceled) { if (i < activeIdx) cls = 'done'; else if (i === activeIdx) cls = 'active'; }
      const dot = { pendiente: '⏳', pagado: '💳', enviado: '🚚', entregado: '✅' }[e];
      const lbl = { pendiente: 'Pendiente', pagado: 'Pagado', enviado: 'Enviado', entregado: 'Entregado' }[e];
      return `<div class="tracking-step ${cls}"><div class="tracking-dot">${dot}</div><div class="tracking-label">${lbl}</div></div>`;
    }).join('');

    const detallesHTML = pedido.detalles?.map(d => {
      const imgSrc = getImagenProducto(d.producto?.id);
      const imgHTML = imgSrc ? `<img src="${imgSrc}" style="width:32px;height:32px;object-fit:cover;border-radius:6px;vertical-align:middle;margin-right:.4rem;" />` : '';
      return `
        <div class="detail-item">
          <span>${imgHTML}${d.producto?.nombre || '—'} × ${d.cantidad}</span>
          <span>${formatMoney(d.subtotal)}</span>
        </div>`;
    }).join('') || '<p style="color:var(--slate);font-size:.9rem">Sin detalles</p>';

    document.getElementById('modal-pedido-contenido').innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">
        <span class="estado-tag estado-${estadoActual}">${estadoLabels[estadoActual] || estadoActual}</span>
        <small style="color:var(--slate)">${formatDate(pedido.fecha)}</small>
      </div>
      ${isCanceled ? '<p style="color:var(--red);font-weight:600;text-align:center;padding:.5rem;">Pedido cancelado</p>' : `<div class="tracking-bar">${trackingHTML}</div>`}
      <h4 style="margin:1rem 0 .5rem;font-size:.9rem;color:var(--slate);text-transform:uppercase;letter-spacing:.05em;">Productos</h4>
      ${detallesHTML}
      <div class="modal-total"><span>Total</span><span>${formatMoney(pedido.total)}</span></div>
    `;

    const adminActions = document.getElementById('modal-pedido-estado-actions');
    adminActions.style.display = isAdmin ? 'block' : 'none';
    showModal('modal-pedido-detalle');
  } catch (_) {}
}

async function cambiarEstado(nuevoEstado) {
  if (!state.pedidoActivo) return;
  try {
    await api('PATCH', `/pedidos/${state.pedidoActivo.id}/estado?estado=${nuevoEstado}`);
    showToast('Estado actualizado ✅', 'success');
    closeModal('modal-pedido-detalle');
    loadAdminPedidos();
  } catch (_) {}
}

/* ============================
   MI PERFIL — DIRECCIONES
============================ */
async function loadMisDirecciones() {
  if (!state.usuario) return;
  try {
    const todas = await api('GET', '/direcciones/');
    const mias = todas.filter(d => d.usuario_id === state.usuario.id);
    const list = document.getElementById('mis-direcciones-list');
    const sel = document.getElementById('select-direccion');
    sel.innerHTML = '<option value="">-- Seleccionar dirección --</option>';
    if (!mias.length) { list.innerHTML = '<p style="color:var(--slate);font-size:.9rem">No tienes direcciones guardadas.</p>'; return; }
    list.innerHTML = mias.map(d => `
      <div class="dir-card">
        <div class="dir-info">
          <strong>${d.calle}</strong>
          ${d.colonia ? d.colonia + ', ' : ''}${d.ciudad}, ${d.estado} ${d.codigo_postal}
          ${d.referencia ? '<br><small>Ref: ' + d.referencia + '</small>' : ''}
        </div>
        <button class="btn-icon btn-delete" onclick="eliminarDireccion(${d.id})">🗑️</button>
      </div>
    `).join('');
    mias.forEach(d => {
      const o = document.createElement('option');
      o.value = d.id; o.textContent = `${d.calle}, ${d.ciudad}`;
      sel.appendChild(o);
    });
  } catch (_) {}
}

async function guardarDireccion() {
  const body = {
    usuario_id: state.usuario.id,
    calle: document.getElementById('dir-calle').value.trim(),
    colonia: document.getElementById('dir-colonia').value.trim(),
    ciudad: document.getElementById('dir-ciudad').value.trim(),
    estado: document.getElementById('dir-estado').value.trim(),
    codigo_postal: document.getElementById('dir-cp').value.trim(),
    referencia: document.getElementById('dir-ref').value.trim(),
  };
  if (!body.calle || !body.ciudad || !body.estado || !body.codigo_postal) return showToast('Completa los campos requeridos', 'error');
  try {
    await api('POST', '/direcciones/', body);
    showToast('Dirección guardada ✅', 'success');
    closeModal('modal-direccion');
    ['dir-calle','dir-colonia','dir-ciudad','dir-estado','dir-cp','dir-ref'].forEach(id => document.getElementById(id).value = '');
    loadMisDirecciones();
  } catch (_) {}
}

async function eliminarDireccion(id) {
  if (!confirm('¿Eliminar esta dirección?')) return;
  try {
    await api('DELETE', `/direcciones/${id}`);
    showToast('Dirección eliminada', 'success');
    loadMisDirecciones();
  } catch (_) {}
}

/* ============================
   ADMIN: CARGA GENERAL
============================ */
async function loadAdminData() {
  await Promise.all([loadAdminProductos(), loadAdminCategorias(), loadAdminPedidos(), loadAdminUsuarios(), loadCategoriasParaSelect()]);
}

/* ============================
   ADMIN: PRODUCTOS
============================ */
async function loadAdminProductos() {
  try {
    const productos = await api('GET', '/productos/');
    state.productos = productos;
    const tbody = document.getElementById('admin-productos-body');
    tbody.innerHTML = productos.map(p => {
      const imgSrc = p.imagen_url ? `${API}${p.imagen_url}` : null;
      const thumb = imgSrc
        ? `<div class="table-thumb"><img src="${imgSrc}" alt="${p.nombre}" /></div>`
        : `<div class="table-thumb">🛒</div>`;
      return `
        <tr>
          <td>${thumb}</td>
          <td>${p.id}</td>
          <td>${p.nombre}</td>
          <td>${formatMoney(p.precio)}</td>
          <td>${p.stock}</td>
          <td>${p.categoria?.nombre || '—'}</td>
          <td>
            <div class="table-actions">
              <button class="btn-icon btn-edit" onclick="editarProducto(${p.id})">✏️ Editar</button>
              <button class="btn-icon btn-delete" onclick="eliminarProducto(${p.id})">🗑️ Eliminar</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (_) {}
}

async function loadCategoriasParaSelect() {
  try {
    const cats = await api('GET', '/categorias/');
    state.categorias = cats;
    const sel = document.getElementById('prod-categoria');
    if (sel) sel.innerHTML = cats.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
  } catch (_) {}
}

function abrirModalProducto() {
  document.getElementById('prod-id').value = '';
  document.getElementById('prod-nombre').value = '';
  document.getElementById('prod-precio').value = '';
  document.getElementById('prod-stock').value = '';
  document.getElementById('modal-producto-title').textContent = 'Agregar Producto';
  resetImagenModal();
  showModal('modal-producto');
}

function editarProducto(id) {
  const p = state.productos.find(p => p.id === id);
  if (!p) return;
  document.getElementById('prod-id').value = p.id;
  document.getElementById('prod-nombre').value = p.nombre;
  document.getElementById('prod-precio').value = p.precio;
  document.getElementById('prod-stock').value = p.stock;
  document.getElementById('prod-categoria').value = p.categoria?.id || p.categoria_id;
  document.getElementById('modal-producto-title').textContent = 'Editar Producto';
  cargarImagenEnModal(p.id);
  showModal('modal-producto');
}

async function guardarProducto() {
  const id = document.getElementById('prod-id').value;
  const body = {
    nombre: document.getElementById('prod-nombre').value.trim(),
    precio: parseFloat(document.getElementById('prod-precio').value),
    stock: parseInt(document.getElementById('prod-stock').value),
    categoria_id: parseInt(document.getElementById('prod-categoria').value),
  };
  if (!body.nombre || isNaN(body.precio) || isNaN(body.stock)) {
    return showToast('Completa todos los campos', 'error');
  }

  try {
    let productoId;
    if (id) {
      await api('PUT', `/productos/${id}`, body);
      productoId = parseInt(id);
      showToast('Producto actualizado ✅', 'success');
    } else {
      const nuevo = await api('POST', '/productos/', body);
      productoId = nuevo.id;
      showToast('Producto creado ✅', 'success');
    }

    // Subir imagen si se seleccionó una
    const fileInput = document.getElementById('prod-imagen-input');
    if (fileInput.files.length > 0) {
      const formData = new FormData();
      formData.append('file', fileInput.files[0]);
      await fetch(`${API}/productos/${productoId}/imagen`, {
        method: 'POST',
        body: formData,
      });
    }

    closeModal('modal-producto');
    resetImagenModal();
    loadAdminProductos();
  } catch (_) {}
}

async function eliminarProducto(id) {
  if (!confirm('¿Eliminar este producto?')) return;
  try {
    await api('DELETE', `/productos/${id}`);
    eliminarImagenLocal(id);
    showToast('Producto eliminado', 'success');
    loadAdminProductos();
  } catch (_) {}
}

/* ============================
   ADMIN: CATEGORÍAS
============================ */
async function loadAdminCategorias() {
  try {
    const cats = await api('GET', '/categorias/');
    state.categorias = cats;
    const tbody = document.getElementById('admin-categorias-body');
    tbody.innerHTML = cats.map(c => `
      <tr>
        <td>${c.id}</td>
        <td>${c.nombre}</td>
        <td>
          <div class="table-actions">
            <button class="btn-icon btn-edit" onclick="editarCategoria(${c.id})">✏️ Editar</button>
            <button class="btn-icon btn-delete" onclick="eliminarCategoria(${c.id})">🗑️ Eliminar</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (_) {}
}

function editarCategoria(id) {
  const c = state.categorias.find(c => c.id === id);
  if (!c) return;
  document.getElementById('cat-id').value = c.id;
  document.getElementById('cat-nombre').value = c.nombre;
  document.getElementById('modal-cat-title').textContent = 'Editar Categoría';
  showModal('modal-categoria');
}

async function guardarCategoria() {
  const id = document.getElementById('cat-id').value;
  const nombre = document.getElementById('cat-nombre').value.trim();
  if (!nombre) return showToast('Escribe el nombre de la categoría', 'error');
  try {
    if (id) { await api('PUT', `/categorias/${id}`, { nombre }); showToast('Categoría actualizada ✅', 'success'); }
    else { await api('POST', '/categorias/', { nombre }); showToast('Categoría creada ✅', 'success'); }
    document.getElementById('cat-id').value = '';
    document.getElementById('cat-nombre').value = '';
    document.getElementById('modal-cat-title').textContent = 'Nueva Categoría';
    closeModal('modal-categoria');
    loadAdminCategorias();
    loadCategoriasParaSelect();
  } catch (_) {}
}

async function eliminarCategoria(id) {
  if (!confirm('¿Eliminar esta categoría?')) return;
  try {
    await api('DELETE', `/categorias/${id}`);
    showToast('Categoría eliminada', 'success');
    loadAdminCategorias();
  } catch (_) {}
}

/* ============================
   ADMIN: PEDIDOS
============================ */
async function loadAdminPedidos() {
  const list = document.getElementById('admin-pedidos-list');
  try {
    const pedidos = await api('GET', '/pedidos/');
    if (!pedidos.length) { list.innerHTML = '<div class="empty-state">📦 No hay pedidos aún</div>'; return; }
    pedidos.sort((a, b) => b.id - a.id);
    list.innerHTML = pedidos.map(p => pedidoCardHTML(p, true)).join('');
  } catch (_) {}
}

/* ============================
   ADMIN: USUARIOS
============================ */
async function loadAdminUsuarios() {
  try {
    const usuarios = await api('GET', '/usuarios/');
    const tbody = document.getElementById('admin-usuarios-body');
    tbody.innerHTML = usuarios.map(u => `
      <tr>
        <td>${u.id}</td>
        <td>${u.nombre}</td>
        <td>${u.email}</td>
        <td><span class="estado-tag ${u.rol === 'admin' ? 'estado-pagado' : 'estado-pendiente'}">${u.rol}</span></td>
      </tr>
    `).join('');
  } catch (_) {}
}

async function crearAdmin() {
  const nombre = document.getElementById('admin-nombre').value.trim();
  const email = document.getElementById('admin-email').value.trim();
  const pass = document.getElementById('admin-pass').value;
  if (!nombre || !email || !pass) return showToast('Completa todos los campos', 'error');
  try {
    await api('POST', '/usuarios/', { nombre, email, contraseña: pass, rol: 'admin' });
    showToast('Admin creado exitosamente ✅', 'success');
    closeModal('modal-crear-admin');
    document.getElementById('admin-nombre').value = '';
    document.getElementById('admin-email').value = '';
    document.getElementById('admin-pass').value = '';
    loadAdminUsuarios();
  } catch (_) {}
}

/* ============================
   INIT
============================ */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.add('hidden');
        state.pedidoActivo = null;
      }
    });
  });
});