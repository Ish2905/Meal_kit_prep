// frontend/assets/js/app.js
// SPA logic, state, rendering, and event handlers

const state = {
  currentUser: JSON.parse(localStorage.getItem('mkp_user') || 'null'),
  masterData: { allergies: [], preferences: [], plans: [] },
};
const ADMIN_EMAIL = window.ADMIN_EMAIL_OVERRIDE || 'admin@mealkit.local';

// Elements
const pages = {
  welcome: document.getElementById('welcome-page'),
  register: document.getElementById('register-page'),
  login: document.getElementById('login-page'),
  dashboard: document.getElementById('dashboard-page'),
  orders: document.getElementById('order-history-page'),
  admin: document.getElementById('admin-page'),
};
const navLinks = {
  home: document.getElementById('home-btn'),
  login: document.getElementById('login-nav-btn'),
  register: document.getElementById('register-nav-btn'),
  getStarted: document.getElementById('get-started-btn'),
  dashboard: document.getElementById('dashboard-nav-btn'),
  orders: document.getElementById('orders-nav-btn'),
  admin: document.getElementById('admin-nav-btn'),
  logout: document.getElementById('logout-btn'),
};
const dashboardContent = document.getElementById('dashboard-content');
const userGreeting = document.getElementById('user-greeting');
const orderHistoryContent = document.getElementById('order-history-content');

function showPage(pageId) {
  Object.values(pages).forEach(p => p.classList.remove('active'));
  if (pages[pageId]) pages[pageId].classList.add('active');
}

async function fetchMasterData() {
  try {
    const data = await apiFetch('/master-data');
    let plans = [];
    try { plans = await apiFetch('/plans'); } catch (_) { plans = []; }
    state.masterData = { ...data, plans };
  } catch (err) {
    console.error('Failed to fetch master data', err);
  }
}

function renderRegisterPage() {
  pages.register.innerHTML = `
    <div class="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg">
      <h2 class="text-3xl font-bold text-center mb-6">Create Your Account</h2>
      <form id="registration-form">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input type="text" name="name" placeholder="Full Name" class="w-full p-3 border rounded-lg" required>
          <input type="email" name="email" placeholder="Email Address" class="w-full p-3 border rounded-lg" required>
          <input type=\"text\" name=\"username\" placeholder=\"Username\" class=\"w-full p-3 border rounded-lg\">
          <input type=\"password\" name=\"password\" placeholder=\"Password\" class=\"w-full p-3 border rounded-lg\">
          <input type="tel" name="phone" placeholder="Phone Number" class="w-full p-3 border rounded-lg">
          <input type="text" name="address" placeholder="Address" class="w-full p-3 border rounded-lg" required>
          <input type="text" name="city" placeholder="City" class="w-full p-3 border rounded-lg" required>
          <input type="text" name="state" placeholder="State" class="w-full p-3 border rounded-lg" required>
          <input type="text" name="pincode" placeholder="Pincode" class="w-full p-3 border rounded-lg" required>
        </div>
        <div class="mb-6">
          <h3 class="font-semibold text-lg mb-2">Allergies?</h3>
          <div id="allergies-container" class="grid grid-cols-2 md:grid-cols-4 gap-2"></div>
        </div>
        <div class="mb-6">
          <h3 class="font-semibold text-lg mb-2">Preferences?</h3>
          <div id="preferences-container" class="grid grid-cols-2 md:grid-cols-4 gap-2"></div>
        </div>
        <button type="submit" class="w-full btn-primary">Register</button>
      </form>
      <div id="form-message" class="mt-4 text-center"></div>
      <p class="text-center mt-4 text-sm text-gray-600">
        Already have an account? <button id="register-to-login-btn" class="link">Login here</button>
      </p>
    </div>
  `;
  renderCheckboxes('allergies', state.masterData.allergies, 'Allergy_ID', 'Allergy_Name');
  renderCheckboxes('preferences', state.masterData.preferences, 'Preference_ID', 'Preference_Name');
  document.getElementById('registration-form')?.addEventListener('submit', handleRegister);
  document.getElementById('register-to-login-btn')?.addEventListener('click', () => {
    showPage('login');
  });
}

function renderCheckboxes(type, items, idKey, nameKey) {
  const container = document.getElementById(`${type}-container`);
  if (!container) return;
  container.innerHTML = items.map(item => `
    <label class="flex items-center space-x-2 p-2 rounded-lg border hover:bg-gray-100 cursor-pointer">
      <input type="checkbox" name="${type}" value="${item[idKey]}" class="h-4 w-4 rounded text-teal-600">
      <span>${item[nameKey]}</span>
    </label>
  `).join('');
}

async function fetchAndRenderDashboard(customerId) {
  dashboardContent.innerHTML = `<p>Loading your data...</p>`;
  try {
    const data = await apiFetch(`/dashboard/${customerId}`);
    if (data && data.summary && data.summary.Email) {
      state.currentUser = { ...(state.currentUser || {}), email: data.summary.Email };
      localStorage.setItem('mkp_user', JSON.stringify(state.currentUser));
      updateUIForLoggedInUser();
    }
    renderDashboard(data);
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    dashboardContent.innerHTML = `<p class="text-red-500">${error.message}</p>`;
  }
}

function renderDashboard({ summary, activeOrders }) {
  const recommendationsHtml = `<div id="recommendations-container" class="bg-white p-8 rounded-xl shadow-lg"><p>Loading recommendations...</p></div>`;
  const placeOrderHtml = `<div id="place-order-container" class="bg-white p-8 rounded-xl shadow-lg"><p>Loading order form...</p></div>`;
  const browseHtml = `<div id="browse-container" class="bg-white p-8 rounded-xl shadow-lg"><p>Loading meals...</p></div>`;

  dashboardContent.innerHTML = `
    <div class="bg-white p-8 rounded-xl shadow-lg mb-8">
      <div class="flex items-center justify-between">
        <h3 class="text-2xl font-semibold">${summary.Customer_Name}</h3>
        <span class="text-sm text-gray-500">Customer #${summary.Customer_ID || ''}</span>
      </div>
      <div class="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
        <div>
          <p class="text-sm text-gray-500">Total Orders</p>
          <p class="text-2xl font-bold">${summary.TotalOrders}</p>
        </div>
        <div>
          <p class="text-sm text-gray-500">Lifetime Value</p>
          <p class="text-2xl font-bold">$${parseFloat(summary.LifetimeValue || 0).toFixed(2)}</p>
        </div>
        <div>
          <p class="text-sm text-gray-500">Active Orders</p>
          <p class="text-2xl font-bold">${(activeOrders || []).length}</p>
        </div>
      </div>
    </div>
    <div class="space-y-8">
      <div class="bg-white p-8 rounded-xl shadow-lg">
        <h4 class="text-xl font-semibold mb-4">Active Orders</h4>
        ${Array.isArray(activeOrders) && activeOrders.length > 0 ? `
          <ul class="divide-y">
            ${activeOrders.map(o => `<li class="py-2 flex items-center justify-between">
              <span>Order #${o.Order_ID} - ${o.Status || 'Active'}</span>
              <span class="text-sm text-gray-500">${fmtDateTime(o.Order_Date)}</span>
            </li>`).join('')}
          </ul>
        ` : `<p class="text-gray-500">No active orders.</p>`}
      </div>
      ${recommendationsHtml}
      ${placeOrderHtml}
      ${browseHtml}
    </div>
  `;
  fetchAndRenderRecommendations(state.currentUser.customerId);
  fetchAndRenderBrowseByPreference();
}

async function fetchAndRenderRecommendations(customerId) {
  const container = document.getElementById('recommendations-container');
  const orderContainer = document.getElementById('place-order-container');
  try {
    const recommendations = await apiFetch(`/mealkits/recommendations/${customerId}`);
    container.innerHTML = `
      <h4 class="text-xl font-semibold mb-4">Meal Kits Recommended For You</h4>
      ${recommendations.length > 0 ? `
        <div class="grid md:grid-cols-3 gap-4">
          ${recommendations.map(kit => `
            <div class="card">
              <div>
                <p class="font-bold">${kit.Name}</p>
                <p class="text-sm text-gray-500">${kit.Cuisine} - ${kit.Calories} cal</p>
              </div>
            </div>`).join('')}
        </div>
      ` : `<p class="text-gray-500">No specific recommendations found.</p>`}
    `;
    renderOrderForm(recommendations);
  } catch (error) {
    container.innerHTML = `<p class="text-red-500">Could not load recommendations.</p>`;
    orderContainer.innerHTML = `<p class="text-red-500">Could not load order form.</p>`;
  }
}

async function fetchAndRenderBrowseByPreference() {
  const container = document.getElementById('browse-container');
  if (!container) return;
  // UI: preference selector
  container.innerHTML = `
    <div class="flex items-end justify-between mb-4">
      <div class="w-full md:w-1/2">
        <label class="block font-medium mb-1">Browse Meals by Preference</label>
        <select id="browse-pref" class="w-full p-2 border rounded-lg">
          ${state.masterData.preferences.map(p => `<option value="${p.Preference_ID}">${p.Preference_Name}</option>`).join('')}
        </select>
      </div>
    </div>
    <div id="browse-results" class="grid md:grid-cols-3 gap-4"></div>
  `;
  const select = document.getElementById('browse-pref');
  const results = document.getElementById('browse-results');

  async function load(prefId) {
    results.innerHTML = '<p class="text-sm text-gray-500">Loading...</p>';
    try {
      const meals = await apiFetch(`/mealkits/by-preference/${prefId}`);
      if (!Array.isArray(meals) || meals.length === 0) {
        results.innerHTML = '<p class="text-sm text-gray-500">No meals found for this preference.</p>';
        return;
      }
      results.innerHTML = meals.map(m => `
        <div class="card bg-white">
          <div>
            <p class="font-bold">${m.Name}</p>
            <p class="text-sm text-gray-500">${m.Cuisine || ''} ${m.Calories ? `- ${m.Calories} cal` : ''}</p>
          </div>
          <button class="btn-primary" data-kit-id="${m.MealKit_ID}" data-kit-name="${m.Name}">Order</button>
        </div>
      `).join('');
      // Attach order buttons
      results.querySelectorAll('button[data-kit-id]')?.forEach(btn => {
        btn.addEventListener('click', () => openQuickOrder(btn.dataset.kitId, btn.dataset.kitName));
      });
    } catch (e) {
      results.innerHTML = `<p class="text-red-500 text-sm">${e.message}</p>`;
    }
  }
  select.addEventListener('change', (e) => load(e.target.value));
  if (select.value) await load(select.value);
}

async function openQuickOrder(mealKitId, mealName) {
  const container = document.getElementById('place-order-container');
  if (!container) return;
  // Render a compact quick-order form
  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  container.innerHTML = `
    <h4 class="text-xl font-semibold mb-4">Quick Order: ${mealName}</h4>
    <form id="quick-order-form">
      <input type="hidden" name="mealkit_id" value="${mealKitId}">
      <div class="mb-4">
        <label class="block font-medium mb-1">Select a Plan</label>
        <select name="plan_id" class="w-full p-2 border rounded-lg">
          ${state.masterData.plans.map(p => `<option value="${p.Plan_ID}">${p.Plan_Name}</option>`).join('')}
        </select>
      </div>
      <button type="submit" class="btn-success w-full">Place Order</button>
    </form>
    <div id="quick-order-message" class="mt-3 text-center text-sm"></div>
  `;
  document.getElementById('quick-order-form')?.addEventListener('submit', (e) => handleQuickOrder(e));
}

async function handleQuickOrder(e) {
  e.preventDefault();
  const msg = document.getElementById('quick-order-message');
  msg.textContent = 'Placing order...';
  const fd = Object.fromEntries(new FormData(e.target).entries());
  const payload = {
    customer_id: state.currentUser.customerId,
    plan_id: fd.plan_id,
    mealkit_ids: fd.mealkit_id,
    payment_method: 'Credit Card'
  };
  try {
    const result = await apiFetch('/orders', { method: 'POST', body: JSON.stringify(payload) });
    // fetch address to craft driver link
    const profile = await apiFetch(`/customers/${state.currentUser.customerId}`);
    const addr = encodeURIComponent(`${profile.Address || ''} ${profile.City || ''} ${profile.State || ''} ${profile.Pincode || ''}`.trim());
    const mapsLink = `https://www.google.com/maps/dir/?api=1&destination=${addr}`;
    msg.innerHTML = `Order #${result.orderId} placed! <a class="link" href="${mapsLink}" target="_blank">Driver link</a>`;
    setTimeout(() => fetchAndRenderDashboard(state.currentUser.customerId), 1200);
  } catch (err) {
    msg.textContent = `Error: ${err.message}`;
  }
}
function renderOrderForm(availableKits) {
  const container = document.getElementById('place-order-container');
  container.innerHTML = `
    <h4 class="text-xl font-semibold mb-4">Place a New Order</h4>
    <form id="order-form">
      <div class="mb-4">
        <label class="block font-medium mb-1">Select a Plan</label>
        <select name="plan_id" class="w-full p-2 border rounded-lg">
          ${state.masterData.plans.map(p => `<option value="${p.Plan_ID}">${p.Plan_Name}</option>`).join('')}
        </select>
      </div>
      <div class="mb-4">
        <label class="block font-medium mb-1">Choose your Meal Kits</label>
        <div class="grid grid-cols-2 gap-2">
          ${availableKits.map(kit => `
            <label class="flex items-center space-x-2 p-2 rounded-lg border hover:bg-gray-100 cursor-pointer">
              <input type="checkbox" name="mealkit_ids" value="${kit.MealKit_ID}" class="h-4 w-4 rounded text-teal-600">
              <span>${kit.Name}</span>
            </label>`).join('')}
        </div>
      </div>
      <button type="submit" class="w-full btn-success">Place Order</button>
    </form>
    <div id="order-message" class="mt-4 text-center"></div>
  `;
  document.getElementById('order-form')?.addEventListener('submit', handlePlaceOrder);
}

// Handlers
async function handleRegister(e) {
  e.preventDefault();
  const formMessage = document.getElementById('form-message');
  formMessage.textContent = 'Registering...';
  const formData = Object.fromEntries(new FormData(e.target).entries());
  formData.allergy_ids = Array.from(e.target.querySelectorAll('input[name="allergies"]:checked')).map(el => el.value).join(',');
  formData.preference_ids = Array.from(e.target.querySelectorAll('input[name="preferences"]:checked')).map(el => el.value).join(',');
  try {
    const result = await apiFetch('/register', { method: 'POST', body: JSON.stringify(formData) });
    formMessage.textContent = `Success! Welcome, ${formData.name}.`;
    state.currentUser = { customerId: result.customerId, name: formData.name };
    localStorage.setItem('mkp_user', JSON.stringify(state.currentUser));
    updateUIForLoggedInUser();
    setTimeout(() => { showPage('dashboard'); fetchAndRenderDashboard(state.currentUser.customerId); }, 800);
  } catch (error) {
    formMessage.textContent = `Error: ${error.message}`;
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const loginMessage = document.getElementById('login-message');
  loginMessage.textContent = 'Logging in...';
  const fd = Object.fromEntries(new FormData(e.target).entries());
  const payload = { identifier: fd.identifier, password: fd.password };
  try {
    const result = await apiFetch('/login', { method: 'POST', body: JSON.stringify(payload) });
    loginMessage.textContent = `Success! Welcome back, ${result.name}.`;
    state.currentUser = { customerId: result.customerId, name: result.name };
    localStorage.setItem('mkp_user', JSON.stringify(state.currentUser));
    updateUIForLoggedInUser();
    setTimeout(() => { showPage('dashboard'); fetchAndRenderDashboard(state.currentUser.customerId); }, 800);
  } catch (error) {
    loginMessage.textContent = `Error: ${error.message}`;
  }
}

async function handlePlaceOrder(e) {
  e.preventDefault();
  const orderMessage = document.getElementById('order-message');
  orderMessage.textContent = 'Placing order...';
  const formData = Object.fromEntries(new FormData(e.target).entries());
  const selectedKits = Array.from(e.target.querySelectorAll('input[name="mealkit_ids"]:checked')).map(el => el.value);
  if (selectedKits.length === 0) {
    orderMessage.textContent = 'Please select at least one meal kit.';
    return;
  }
  const payload = {
    customer_id: state.currentUser.customerId,
    plan_id: formData.plan_id,
    mealkit_ids: selectedKits.join(','),
    payment_method: 'Credit Card',
  };
  try {
    const result = await apiFetch('/orders', { method: 'POST', body: JSON.stringify(payload) });
    orderMessage.textContent = `Order #${result.orderId} placed successfully!`;
    setTimeout(() => fetchAndRenderDashboard(state.currentUser.customerId), 1000);
  } catch (error) {
    orderMessage.textContent = `Error: ${error.message}`;
  }
}

function updateUIForLoggedInUser() {
  if (state.currentUser) {
    navLinks.login.style.display = 'none';
    navLinks.register.style.display = 'none';
    navLinks.dashboard.style.display = 'inline-block';
    navLinks.orders.style.display = 'inline-block';
    navLinks.logout.style.display = 'inline-block';
    // Admin visibility
    if (navLinks.admin) {
      if (state.currentUser.email && state.currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        navLinks.admin.style.display = 'inline-block';
      } else {
        navLinks.admin.style.display = 'none';
      }
    }
    if (userGreeting) {
      userGreeting.textContent = `Hi, ${state.currentUser.name}`;
      userGreeting.classList.remove('hidden');
    }
  } else {
    navLinks.login.style.display = 'inline-block';
    navLinks.register.style.display = 'inline-block';
    navLinks.dashboard.style.display = 'none';
    navLinks.orders.style.display = 'none';
    navLinks.logout.style.display = 'none';
    if (navLinks.admin) navLinks.admin.style.display = 'none';
    if (userGreeting) {
      userGreeting.textContent = '';
      userGreeting.classList.add('hidden');
    }
  }
}

function initNav() {
  navLinks.home?.addEventListener('click', () => showPage('welcome'));
  navLinks.login?.addEventListener('click', () => showPage('login'));
  navLinks.register?.addEventListener('click', () => { renderRegisterPage(); showPage('register'); });
  navLinks.getStarted?.addEventListener('click', () => { renderRegisterPage(); showPage('register'); });
  navLinks.dashboard?.addEventListener('click', () => {
    if (state.currentUser) { showPage('dashboard'); fetchAndRenderDashboard(state.currentUser.customerId); }
  });
  navLinks.orders?.addEventListener('click', () => {
    if (state.currentUser) { showPage('orders'); fetchAndRenderOrderHistory(state.currentUser.customerId); }
  });
  navLinks.admin?.addEventListener('click', async () => {
    showPage('admin');
    await renderAdminPreferences();
    await renderAdminRecentOrders();
  });
  navLinks.logout?.addEventListener('click', () => {
    state.currentUser = null;
    localStorage.removeItem('mkp_user');
    updateUIForLoggedInUser();
    showPage('welcome');
  });
}

async function bootstrap() {
  initNav();
  const health = await apiHealth();
  if (!health.ok) {
    console.warn('Backend health check failed:', health.error);
  }
  await fetchMasterData();
  updateUIForLoggedInUser();
  // Default view
  showPage(state.currentUser ? 'dashboard' : 'welcome');
  if (state.currentUser) fetchAndRenderDashboard(state.currentUser.customerId);

  // Hook login form
  document.getElementById('login-form')?.addEventListener('submit', handleLogin);
  document.getElementById('login-to-register-btn')?.addEventListener('click', () => { renderRegisterPage(); showPage('register'); });
}

document.addEventListener('DOMContentLoaded', bootstrap);

// Helpers
function fmtDateTime(value) {
  if (!value) return '';
  // MySQL DATETIME -> 'YYYY-MM-DD HH:MM:SS'; make it ISO-ish for safe parsing
  const s = typeof value === 'string' ? value.replace(' ', 'T') : value;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString();
}

// Orders History
async function fetchAndRenderOrderHistory(customerId) {
  orderHistoryContent.innerHTML = '<p>Loading order history...</p>';
  try {
    const rows = await apiFetch(`/orders/history/${customerId}`);
    if (!Array.isArray(rows) || rows.length === 0) {
      orderHistoryContent.innerHTML = '<p class="text-gray-500">No past orders found.</p>';
      return;
    }
    orderHistoryContent.innerHTML = `
      <ul class="divide-y">
        ${rows.map(o => `
          <li class="py-3 flex items-center justify-between">
            <div>
              <p class="font-medium">Order #${o.Order_ID}</p>
              <p class="text-sm text-gray-500">Status: ${o.Status || 'N/A'}</p>
            </div>
            <span class="text-sm text-gray-500">${fmtDateTime(o.Order_Date)}</span>
          </li>
        `).join('')}
      </ul>
    `;
  } catch (err) {
    orderHistoryContent.innerHTML = `<p class="text-red-500">${err.message}</p>`;
  }
}

// Admin Preferences
async function renderAdminPreferences() {
  const list = document.getElementById('preferences-list');
  const msg = document.getElementById('preference-msg');
  msg.textContent = '';
  list.innerHTML = '<li class="py-2 text-sm text-gray-500">Loading...</li>';
  try {
    const prefs = await apiFetch('/preferences');
    list.innerHTML = prefs.map(p => `<li class="py-2">${p.Preference_Name}</li>`).join('');
  } catch (e) {
    list.innerHTML = '<li class="py-2 text-red-500">Failed to load preferences.</li>';
  }
  const form = document.getElementById('add-preference-form');
  form?.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const fd = Object.fromEntries(new FormData(form).entries());
    msg.textContent = 'Adding...';
    try {
      await apiFetch('/admin/preferences', { method: 'POST', body: JSON.stringify(fd), headers: { 'X-Customer-Id': state.currentUser?.customerId } });
      msg.textContent = 'Preference added!';
      form.reset();
      await renderAdminPreferences();
      // Refresh master data so register page picks up the new preference
      await fetchMasterData();
    } catch (e) {
      msg.textContent = `Error: ${e.message}`;
    }
  }, { once: true });
}

async function renderAdminRecentOrders() {
  const container = document.getElementById('admin-page');
  if (!container) return;
  // Create or find a recent orders section
  let section = container.querySelector('#admin-recent-orders');
  if (!section) {
    section = document.createElement('div');
    section.id = 'admin-recent-orders';
  section.className = 'bg-white p-8 rounded-xl shadow-lg mt-6 md:col-span-2';
    section.innerHTML = '<h3 class="text-xl font-semibold mb-4">Recent Orders</h3><div id="admin-orders-content"><p>Loading...</p></div>';
    container.querySelector('.grid')?.appendChild(section);
  }
  const content = section.querySelector('#admin-orders-content');
  try {
    const rows = await apiFetch('/admin/orders', { headers: { 'X-Customer-Id': state.currentUser?.customerId } });
    if (!Array.isArray(rows) || rows.length === 0) {
      content.innerHTML = '<p class="text-gray-500 text-sm">No recent orders.</p>';
      return;
    }
    content.innerHTML = `
      <ul class="divide-y">
        ${rows.map(o => `
          <li class="py-3">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium">Order #${o.Order_ID} — ${o.Name || o.Customer_Name || 'Customer'}</p>
                <p class="text-sm text-gray-500">${o.Status || 'N/A'}</p>
              </div>
              <span class="text-sm text-gray-500">${fmtDateTime(o.Order_Date)}</span>
            </div>
            ${o.Address ? `<div class="mt-1 text-sm"><a class="link" target="_blank" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${o.Address || ''} ${o.City || ''}`)}">Open in Maps</a></div>` : ''}
          </li>
        `).join('')}
      </ul>
    `;
  } catch (e) {
    content.innerHTML = `<p class="text-red-500 text-sm">${e.message}</p>`;
  }
}
