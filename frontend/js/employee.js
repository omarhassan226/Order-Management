// Check authentication
if (!requireAuth(['employee'])) {
    throw new Error('Unauthorized');
}

const user = TokenManager.getUserData();
let beverages = [];
let hasOrderedToday = false;
let notificationsEnabled = false;
let lastFulfilledCount = 0;

// Initialize page
async function init() {
    displayUserInfo();
    await checkTodayOrder();
    await loadBeverages();
    await loadOrderHistory();
    setupEventListeners();
    requestNotificationPermission();
    startOrderStatusPolling();
}

// Request browser notification permission
async function requestNotificationPermission() {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        notificationsEnabled = permission === 'granted';
    }
}

// Show browser notification
function showNotification(title, body) {
    if (notificationsEnabled && document.hidden) {
        new Notification(title, {
            body,
            icon: '/images/coffee.png',
            tag: 'order-fulfilled'
        });
    }
    Toast.success(body);
}

// Poll for order status updates every 30 seconds
function startOrderStatusPolling() {
    setInterval(async () => {
        try {
            const { orders } = await API.getMyOrderHistory();
            const today = new Date().toISOString().split('T')[0];
            const todayFulfilledOrders = orders.filter(
                o => o.order_date.split('T')[0] === today && o.status === 'fulfilled'
            );

            // Check if any order was just fulfilled
            if (todayFulfilledOrders.length > lastFulfilledCount && lastFulfilledCount > 0) {
                showNotification(
                    '☕ طلبك جاهز!',
                    'تم تجهيز مشروبك. يمكنك استلامه الآن!'
                );
            }

            lastFulfilledCount = todayFulfilledOrders.length;

            // Refresh the order history
            await loadOrderHistory();
            await checkTodayOrder();
        } catch (error) {
            console.error('Error polling order status:', error);
        }
    }, 30000);
}

function displayUserInfo() {
    document.getElementById('userName').textContent = user.full_name;
    document.getElementById('userDepartment').textContent = user.department || 'لا يوجد قسم';
}

async function checkTodayOrder() {
    const MAX_ORDERS_PER_DAY = 3;
    try {
        const { orders } = await API.getMyOrderHistory();
        const today = new Date().toISOString().split('T')[0];
        const todayOrders = orders.filter(o => o.order_date.split('T')[0] === today && o.status !== 'cancelled');
        const remainingOrders = MAX_ORDERS_PER_DAY - todayOrders.length;

        if (remainingOrders <= 0) {
            hasOrderedToday = true;
            showOrderStatus('لقد استنفذت جميع طلباتك اليوم (3 طلبات)', 'warning');
        } else {
            hasOrderedToday = false;
            showOrderStatus(`يمكنك طلب ${remainingOrders} مشروب${remainingOrders > 1 ? 'ات' : ''} اليوم`, 'success');
        }
    } catch (error) {
        console.error('Error checking today order:', error);
    }
}

function showOrderStatus(message, type) {
    const statusEl = document.getElementById('orderStatus');
    statusEl.textContent = message;
    statusEl.className = `alert alert-${type}`;
    statusEl.style.display = 'block';
}

async function loadBeverages() {
    try {
        const data = await API.getBeverages(true);
        beverages = data.beverages;
        renderBeverages();
    } catch (error) {
        Toast.error('فشل تحميل المشروبات');
        console.error('Error loading beverages:', error);
    }
}

function renderBeverages(category = 'all') {
    const grid = document.getElementById('beveragesGrid');
    const filtered = category === 'all' ? beverages : beverages.filter(b => b.category === category);

    if (filtered.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: var(--text-light);">لا توجد مشروبات متاحة</p>';
        return;
    }

    grid.innerHTML = filtered.map(beverage => {
        const isOutOfStock = beverage.stock_quantity === 0;
        const stockClass = isOutOfStock ? 'stock-out' : (!beverage.stock_quantity || beverage.stock_quantity <= beverage.min_stock_alert ? 'stock-low' : 'stock-good');
        const stockText = isOutOfStock ? 'غير متوفر' : (beverage.stock_quantity <= beverage.min_stock_alert ? 'قليل' : 'متوفر');

        return `
      <div class="beverage-card ${isOutOfStock || hasOrderedToday ? 'out-of-stock' : ''}" 
           onclick="${!isOutOfStock && !hasOrderedToday ? `openOrderModal('${beverage._id}', '${beverage.name}')` : ''}">
        <div class="beverage-header">
          <h3 class="beverage-name">${beverage.name}</h3>
          <span class="stock-badge ${stockClass}">${stockText}</span>
        </div>
        <p class="beverage-description">${beverage.description || ''}</p>
        <div class="beverage-meta">
          <span>📦 ${beverage.unit || 'كوب'}</span>
          <span>💰 ${beverage.unit_price || 0} جنيه</span>
          <span>☕ ${getCaffeineName(beverage.caffeine_level)}</span>
        </div>
      </div>
    `;
    }).join('');
}

function getCaffeineName(level) {
    const names = {
        'none': 'بدون كافيين',
        'low': 'كافيين منخفض',
        'medium': 'كافيين متوسط',
        'high': 'كافيين عالي'
    };
    return names[level] || '';
}

function setupEventListeners() {
    // Category filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderBeverages(e.target.dataset.category);
        });
    });

    // Order form
    document.getElementById('orderForm').addEventListener('submit', handleOrderSubmit);
}

function openOrderModal(beverageId, beverageName) {
    if (hasOrderedToday) {
        Toast.warning('لقد قمت بالفعل بطلب مشروبك اليوم');
        return;
    }

    document.getElementById('selectedBeverageId').value = beverageId;
    document.getElementById('selectedBeverageName').textContent = beverageName;
    document.getElementById('orderModal').classList.add('show');
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('show');
    document.getElementById('orderForm').reset();
}

async function handleOrderSubmit(e) {
    e.preventDefault();

    const beverageId = document.getElementById('selectedBeverageId').value;
    const cupSize = document.querySelector('input[name="cup_size"]:checked').value;
    const sugarQuantity = document.querySelector('input[name="sugar_quantity"]:checked').value;
    const addOnsInput = document.getElementById('addOns').value.trim();
    const remarks = document.getElementById('remarks').value.trim();

    const addOns = addOnsInput ? addOnsInput.split(',').map(s => s.trim()).filter(Boolean) : [];

    try {
        await API.createOrder({
            beverage_id: beverageId,
            cup_size: cupSize,
            sugar_quantity: sugarQuantity,
            add_ons: addOns,
            remarks,
        });

        Toast.success('تم إرسال طلبك بنجاح!');
        closeOrderModal();
        hasOrderedToday = true;
        showOrderStatus('لقد قمت بالفعل بطلب مشروبك اليوم!', 'warning');
        renderBeverages(); // Re-render to disable cards
        await loadOrderHistory();
    } catch (error) {
        Toast.error(error.message || 'فشل إرسال الطلب');
        console.error('Error creating order:', error);
    }
}

async function loadOrderHistory() {
    try {
        const { orders } = await API.getMyOrderHistory();

        // Set initial fulfilled count to avoid false notifications
        const today = new Date().toISOString().split('T')[0];
        const todayFulfilledOrders = orders.filter(
            o => o.order_date.split('T')[0] === today && o.status === 'fulfilled'
        );
        if (lastFulfilledCount === 0) {
            lastFulfilledCount = todayFulfilledOrders.length;
        }

        renderOrderHistory(orders);
    } catch (error) {
        console.error('Error loading order history:', error);
    }
}

function renderOrderHistory(orders) {
    const container = document.getElementById('orderHistory');

    if (orders.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-light);">لا توجد طلبات سابقة</p>';
        return;
    }

    container.innerHTML = orders.map(order => `
    <div class="order-item">
      <div class="order-details">
        <h4>${order.beverage_id.name}</h4>
        <p>📅 ${formatDate(order.order_date)}</p>
        <p>🥤 ${order.cup_size === 'small' ? 'صغير' : 'كبير'} | 🍬 ${order.sugar_quantity === 'none' ? 'بدون سكر' : order.sugar_quantity + ' سكر'}</p>
        ${order.add_ons && order.add_ons.length > 0 ? `<p>➕ ${order.add_ons.join(', ')}</p>` : ''}
        ${order.remarks ? `<p>📝 ${order.remarks}</p>` : ''}
      </div>
      <span class="order-badge badge-${order.status}">
        ${getStatusName(order.status)}
      </span>
    </div>
  `).join('');
}

function getStatusName(status) {
    const names = {
        'pending': 'قيد الانتظار',
        'fulfilled': 'تم التنفيذ',
        'cancelled': 'ملغي'
    };
    return names[status] || status;
}

function logout() {
    TokenManager.removeToken();
    TokenManager.clearUserData();
    window.location.href = '/login.html';
}

// Initialize
init();
