// Check authentication
if (!requireAuth(['office_boy', 'admin'])) {
  throw new Error('Unauthorized');
}

const user = TokenManager.getUserData();
let orders = [];
let lastPendingCount = 0;
let notificationsEnabled = false;

// Initialize page
async function init() {
  displayUserInfo();
  await loadTodayOrders();
  requestNotificationPermission();
  startOrderPolling();
}

// Request browser notification permission
async function requestNotificationPermission() {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    notificationsEnabled = permission === 'granted';
    if (notificationsEnabled) {
      console.log('Notifications enabled');
    }
  }
}

// Show browser notification
function showNotification(title, body, icon = '☕') {
  if (notificationsEnabled && document.hidden) {
    new Notification(title, {
      body,
      icon: `/images/${icon}.png`,
      tag: 'new-order'
    });
  }
  // Also show in-app toast
  Toast.info(body);
}

// Poll for new orders every 30 seconds
function startOrderPolling() {
  setInterval(async () => {
    try {
      const data = await API.getTodayOrders();
      const newPendingCount = data.orders.filter(o => o.status === 'pending').length;

      // Check if there are new pending orders
      if (newPendingCount > lastPendingCount) {
        const newOrdersCount = newPendingCount - lastPendingCount;
        showNotification(
          '🔔 طلب جديد!',
          `لديك ${newOrdersCount} طلب${newOrdersCount > 1 ? 'ات' : ''} جديد${newOrdersCount > 1 ? 'ة' : ''}`
        );
      }

      lastPendingCount = newPendingCount;
      orders = data.orders;
      renderOrders();
      updateStats();
    } catch (error) {
      console.error('Error polling orders:', error);
    }
  }, 30000); // Poll every 30 seconds
}

function displayUserInfo() {
  document.getElementById('userName').textContent = user.full_name;
}

async function loadTodayOrders() {
  try {
    const data = await API.getTodayOrders();
    orders = data.orders;
    // Set initial pending count to avoid false notifications
    lastPendingCount = orders.filter(o => o.status === 'pending').length;
    renderOrders();
    updateStats();
  } catch (error) {
    Toast.error('فشل تحميل الطلبات');
    console.error('Error loading orders:', error);
  }
}

function renderOrders() {
  const pending = orders.filter(o => o.status === 'pending');
  const fulfilled = orders.filter(o => o.status === 'fulfilled');

  renderPendingOrders(pending);
  renderFulfilledOrders(fulfilled);
}

function renderPendingOrders(pending) {
  const container = document.getElementById('pendingOrders');

  if (pending.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎉</div>
        <p>لا توجد طلبات قيد الانتظار!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = pending.map(order => `
    <div class="order-card pending">
      <div class="order-header">
        <h3 class="employee-name">${order.employee_id.full_name}</h3>
        <span class="department-badge">${order.employee_id.department || 'لا يوجد قسم'}</span>
      </div>
      
      <div class="beverage-info">
        <div class="beverage-name">${order.beverage_id.name}</div>
        <div class="order-customization">
          <span>🥤 ${order.cup_size === 'small' ? 'صغير' : 'كبير'}</span>
          <span>🍬 ${getSugarName(order.sugar_quantity)}</span>
          ${order.beverage_id.stock_quantity ? `<span>📦 متوفر: ${order.beverage_id.stock_quantity}</span>` : ''}
        </div>
        ${order.add_ons && order.add_ons.length > 0 ? `
          <div style="margin-top: 0.5rem;">
            <strong>إضافات:</strong> ${order.add_ons.join(', ')}
          </div>
        ` : ''}
        ${order.remarks ? `
          <div class="order-remarks">
            <strong>📝 ملاحظات:</strong> ${order.remarks}
          </div>
        ` : ''}
      </div>
      
      <div class="order-footer">
        <span class="order-time">⏰ ${formatDateTime(order.createdAt)}</span>
        <button class="btn-fulfill" onclick="fulfillOrder('${order._id}')" id="fulfill-${order._id}">
          تنفيذ الطلب
        </button>
      </div>
    </div>
  `).join('');
}

function renderFulfilledOrders(fulfilled) {
  const container = document.getElementById('fulfilledOrders');

  if (fulfilled.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>لا توجد طلبات منفذة بعد اليوم</p>
      </div>
    `;
    return;
  }

  container.innerHTML = fulfilled.map(order => `
    <div class="order-card fulfilled">
      <div class="order-header">
        <h3 class="employee-name">${order.employee_id.full_name}</h3>
        <span class="department-badge">${order.employee_id.department || 'لا يوجد قسم'}</span>
      </div>
      
      <div class="beverage-info">
        <div class="beverage-name">${order.beverage_id.name}</div>
        <div class="order-customization">
          <span>🥤 ${order.cup_size === 'small' ? 'صغير' : 'كبير'}</span>
          <span>🍬 ${getSugarName(order.sugar_quantity)}</span>
        </div>
        ${order.add_ons && order.add_ons.length > 0 ? `
          <div style="margin-top: 0.5rem;">
            <strong>إضافات:</strong> ${order.add_ons.join(', ')}
          </div>
        ` : ''}
      </div>
      
      <div class="order-footer">
        <span class="order-time">✅ ${formatDateTime(order.fulfilled_at)}</span>
        <span class="fulfilled-badge">تم التنفيذ</span>
      </div>
    </div>
  `).join('');
}

function getSugarName(quantity) {
  const names = {
    'none': 'بدون سكر',
    '1': 'سكر واحد',
    '2': 'سكرين'
  };
  return names[quantity] || quantity;
}

function updateStats() {
  const pending = orders.filter(o => o.status === 'pending').length;
  const fulfilled = orders.filter(o => o.status === 'fulfilled').length;

  document.getElementById('pendingCount').textContent = pending;
  document.getElementById('fulfilledCount').textContent = fulfilled;
}

async function fulfillOrder(orderId) {
  const btn = document.getElementById(`fulfill-${orderId}`);
  // if (!btn) return;

  // const confirmed = confirm('هل أنت متأكد من تنفيذ هذا الطلب؟\nسيتم خصم المشروب من المخزون تلقائياً.');
  // if (!confirmed) return;

  try {
    btn.disabled = true;
    btn.textContent = 'جاري التنفيذ...';

    await API.fulfillOrder(orderId);

    Toast.success('تم تنفيذ الطلب بنجاح وخصم المشروب من المخزون');

    // Reload orders
    await loadTodayOrders();
  } catch (error) {
    Toast.error(error.message || 'فشل تنفيذ الطلب');
    console.error('Error fulfilling order:', error);
    btn.disabled = false;
    btn.textContent = 'تنفيذ الطلب';
  }
}


function logout() {
  TokenManager.removeToken();
  TokenManager.clearUserData();
  window.location.href = '/login.html';
}

// Initialize
init();

// Auto-refresh every 30 seconds
setInterval(loadTodayOrders, 30000);
