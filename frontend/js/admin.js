// Check authentication
if (!requireAuth(['admin'])) {
    throw new Error('Unauthorized');
}

const user = TokenManager.getUserData();
let charts = {};

// Initialize
async function init() {
    displayUserInfo();
    setupNavigation();
    await loadDashboard();
}

function displayUserInfo() {
    document.getElementById('adminName').textContent = user.full_name;
}

function setupNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const tab = btn.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.getElementById(tab).classList.add('active');

            // Load content for tab
            if (tab === 'dashboard') loadDashboard();
            else if (tab === 'beverages') loadBeverages();
            else if (tab === 'users') loadUsers();
            else if (tab === 'orders') loadOrders();
            else if (tab === 'reports') loadReports();
        });
    });
}

// DASHBOARD
async function loadDashboard() {
    try {
        const [statsResult, popularResult, inventoryResult, consumptionResult] = await Promise.allSettled([
            API.getDashboardStats(),
            API.getPopularBeverages(),
            API.getInventoryStatus(),
            API.getConsumptionTrends(),
        ]);

        // Extract data or use defaults if failed
        const stats = statsResult.status === 'fulfilled' ? statsResult.value : { dailyOrdersCount: 0, lowStockCount: 0, outOfStockCount: 0, totalBeverages: 0 };
        const popular = popularResult.status === 'fulfilled' ? popularResult.value : { popularBeverages: [] };
        const inventory = inventoryResult.status === 'fulfilled' ? inventoryResult.value : { inventoryData: [] };
        const consumption = consumptionResult.status === 'fulfilled' ? consumptionResult.value : { consumptionData: [] };

        // Update stats
        document.getElementById('dashTotalBeverages').textContent = inventory.inventoryData?.length || stats.totalBeverages || 0;
        document.getElementById('dashTodayOrders').textContent = stats.dailyOrdersCount || 0;
        document.getElementById('dashLowStock').textContent = stats.lowStockCount || 0;
        document.getElementById('dashOutOfStock').textContent = stats.outOfStockCount || 0;

        // Render charts
        renderPieChart(popular.popularBeverages || []);
        renderBarChart(inventory.inventoryData || []);
        renderLineChart(consumption.consumptionData || []);
    } catch (error) {
        Toast.error('فشل تحميل لوحة المعلومات');
        console.error(error);
    }
}

function renderPieChart(data) {
    const ctx = document.getElementById('consumptionPieChart');
    if (charts.pie) charts.pie.destroy();

    charts.pie = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: data.map(d => d.beverage.name),
            datasets: [{
                data: data.map(d => d.count),
                backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'],
            }],
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
            },
        },
    });
}

function renderBarChart(data) {
    const ctx = document.getElementById('inventoryBarChart');
    if (charts.bar) charts.bar.destroy();

    const sorted = [...data].sort((a, b) => a.stock_quantity - b.stock_quantity).slice(0, 10);

    charts.bar = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sorted.map(d => d.name),
            datasets: [{
                label: 'الكمية المتاحة',
                data: sorted.map(d => d.stock_quantity),
                backgroundColor: sorted.map(d => {
                    if (d.status === 'out') return '#ef4444';
                    if (d.status === 'low') return '#f59e0b';
                    return '#10b981';
                }),
            }],
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
            },
            scales: {
                y: { beginAtZero: true },
            },
        },
    });
}

function renderLineChart(data) {
    const ctx = document.getElementById('consumptionLineChart');
    if (charts.line) charts.line.destroy();

    charts.line = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => new Date(d.order_date).toLocaleDateString('ar-EG')),
            datasets: [{
                label: 'عدد الطلبات',
                data: data.map(d => d.count),
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                fill: true,
            }],
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
            },
            scales: {
                y: { beginAtZero: true },
            },
        },
    });
}

// BEVERAGES
let beverages = [];

async function loadBeverages() {
    try {
        const data = await API.getBeverages();
        beverages = data.beverages;
        renderBeveragesTable();
    } catch (error) {
        Toast.error('فشل تحميل المشروبات');
    }
}

function renderBeveragesTable() {
    const container = document.getElementById('beveragesTable');
    container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>الاسم</th>
          <th>الفئة</th>
          <th>الكمية</th>
          <th>الوحدة</th>
          <th>الحالة</th>
          <th>الإجراءات</th>
        </tr>
      </thead>
      <tbody>
        ${beverages.map(b => `
          <tr>
            <td>${b.name}</td>
            <td>${getCategoryName(b.category)}</td>
            <td>${b.stock_quantity}</td>
            <td>${b.unit}</td>
            <td><span class="badge badge-${b.is_active ? 'active' : 'inactive'}">${b.is_active ? 'نشط' : 'غير نشط'}</span></td>
            <td>
              <button class="btn-action edit" onclick="editBeverage('${b._id}')">تعديل</button>
              <button class="btn-action delete" onclick="deleteBeverage('${b._id}')">حذف</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function getCategoryName(cat) {
    const names = { coffee: 'قهوة', tea: 'شاي', juice: 'عصير', smoothie: 'سموذي', other: 'أخرى' };
    return names[cat] || cat;
}

function openBeverageModal(id = null) {
    document.getElementById('beverageModal').classList.add('show');
    if (id) {
        const beverage = beverages.find(b => b._id === id);
        document.getElementById('beverageModalTitle').textContent = 'تعديل مشروب';
        document.getElementById('beverageId').value = beverage._id;
        document.getElementById('beverageName').value = beverage.name;
        document.getElementById('beverageCategory').value = beverage.category;
        document.getElementById('beverageDescription').value = beverage.description || '';
        document.getElementById('beverageStock').value = beverage.stock_quantity;
        document.getElementById('beverageUnit').value = beverage.unit || '';
        document.getElementById('beverageMinAlert').value = beverage.min_stock_alert;
        document.getElementById('beveragePrice').value = beverage.unit_price;
        document.getElementById('beverageCaffeine').value = beverage.caffeine_level;
    } else {
        document.getElementById('beverageModalTitle').textContent = 'إضافة مشروب';
        document.getElementById('beverageForm').reset();
    }
}

function closeBeverageModal() {
    document.getElementById('beverageModal').classList.remove('show');
}

function editBeverage(id) {
    openBeverageModal(id);
}

async function deleteBeverage(id) {
    if (!confirm('هل أنت متأكد من حذف هذا المشروب؟')) return;

    try {
        await API.deleteBeverage(id);
        Toast.success('تم حذف المشروب');
        await loadBeverages();
    } catch (error) {
        Toast.error('فشل حذف المشروب');
    }
}

document.getElementById('beverageForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('beverageId').value;
    const data = {
        name: document.getElementById('beverageName').value,
        category: document.getElementById('beverageCategory').value,
        description: document.getElementById('beverageDescription').value,
        stock_quantity: parseInt(document.getElementById('beverageStock').value),
        unit: document.getElementById('beverageUnit').value,
        min_stock_alert: parseInt(document.getElementById('beverageMinAlert').value),
        unit_price: parseFloat(document.getElementById('beveragePrice').value),
        caffeine_level: document.getElementById('beverageCaffeine').value,
    };

    try {
        if (id) {
            await API.updateBeverage(id, data);
            Toast.success('تم تحديث المشروب');
        } else {
            await API.createBeverage(data);
            Toast.success('تم إضافة المشروب');
        }
        closeBeverageModal();
        await loadBeverages();
    } catch (error) {
        Toast.error('فشل حفظ المشروب');
    }
});

// USERS
let users = [];

async function loadUsers() {
    try {
        const data = await API.getUsers();
        users = data.users;
        renderUsersTable();
    } catch (error) {
        Toast.error('فشل تحميل المستخدمين');
    }
}

function renderUsersTable() {
    const container = document.getElementById('usersTable');
    container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>الاسم</th>
          <th>اسم المستخدم</th>
          <th>البريد</th>
          <th>القسم</th>
          <th>الدور</th>
          <th>الحالة</th>
          <th>الإجراءات</th>
        </tr>
      </thead>
      <tbody>
        ${users.map(u => `
          <tr>
            <td>${u.full_name}</td>
            <td>${u.username}</td>
            <td>${u.email}</td>
            <td>${u.department || '-'}</td>
            <td>${getRoleName(u.role)}</td>
            <td><span class="badge badge-${u.is_active ? 'active' : 'inactive'}">${u.is_active ? 'نشط' : 'غير نشط'}</span></td>
            <td>
              <button class="btn-action edit" onclick="editUser('${u._id}')">تعديل</button>
              <button class="btn-action delete" onclick="deleteUser('${u._id}')">حذف</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function getRoleName(role) {
    const names = { admin: 'Admin', employee: 'موظف', office_boy: 'Office Boy' };
    return names[role] || role;
}

function openUserModal(id = null) {
    document.getElementById('userModal').classList.add('show');
    if (id) {
        const user = users.find(u => u._id === id);
        document.getElementById('userModalTitle').textContent = 'تعديل مستخدم';
        document.getElementById('userId').value = user._id;
        document.getElementById('username').value = user.username;
        document.getElementById('fullName').value = user.full_name;
        document.getElementById('email').value = user.email;
        document.getElementById('department').value = user.department || '';
        document.getElementById('role').value = user.role;
        document.getElementById('password').value = '';
        document.getElementById('password').placeholder = 'اتركه فارغاً للاحتفاظ بالحالي';
    } else {
        document.getElementById('userModalTitle').textContent = 'إضافة مستخدم';
        document.getElementById('userForm').reset();
        document.getElementById('password').placeholder = '';
    }
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('show');
}

function editUser(id) {
    openUserModal(id);
}

async function deleteUser(id) {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;

    try {
        await API.deleteUser(id);
        Toast.success('تم حذف المستخدم');
        await loadUsers();
    } catch (error) {
        Toast.error('فشل حذف المستخدم');
    }
}

document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('userId').value;
    const password = document.getElementById('password').value;

    const data = {
        username: document.getElementById('username').value,
        full_name: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        department: document.getElementById('department').value,
        role: document.getElementById('role').value,
    };

    if (password) {
        data.password = password;
    }

    try {
        if (id) {
            await API.updateUser(id, data);
            Toast.success('تم تحديث المستخدم');
        } else {
            if (!password) {
                Toast.error('كلمة المرور مطلوبة للمستخدم الجديد');
                return;
            }
            await API.createUser(data);
            Toast.success('تم إضافة المستخدم');
        }
        closeUserModal();
        await loadUsers();
    } catch (error) {
        Toast.error('فشل حفظ المستخدم');
    }
});

// ORDERS
let orders = [];

async function loadOrders() {
    try {
        const status = document.getElementById('statusFilter').value;
        const date = document.getElementById('dateFilter').value;

        const filters = {};
        if (status) filters.status = status;
        if (date) filters.date = date;

        const data = await API.getOrders(filters);
        orders = data.orders;
        renderOrdersTable();
    } catch (error) {
        Toast.error('فشل تحميل الطلبات');
    }
}

function renderOrdersTable() {
    const container = document.getElementById('ordersTable');
    container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>الموظف</th>
          <th>القسم</th>
          <th>المشروب</th>
          <th>التخصيص</th>
          <th>التاريخ</th>
          <th>الحالة</th>
        </tr>
      </thead>
      <tbody>
        ${orders.map(o => `
          <tr>
            <td>${o.employee_id.full_name}</td>
            <td>${o.employee_id.department || '-'}</td>
            <td>${o.beverage_id.name}</td>
            <td>
              ${o.cup_size === 'small' ? 'صغير' : 'كبير'} | 
              ${o.sugar_quantity === 'none' ? 'بدون سكر' : o.sugar_quantity + ' سكر'}
            </td>
            <td>${formatDate(o.order_date)}</td>
            <td><span class="badge badge-${o.status}">${getStatusName(o.status)}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function getStatusName(status) {
    const names = { pending: 'قيد الانتظار', fulfilled: 'تم التنفيذ', cancelled: 'ملغي' };
    return names[status] || status;
}

// REPORTS
async function loadReports() {
    document.getElementById('reportsContent').innerHTML = '<p style="text-align: center; padding: 3rem;">استخدم أزرار التصدير لإنشاء التقارير</p>';
}

function exportPDF() {
    const date = new Date().toISOString().split('T')[0];
    API.exportPDF(date);
    Toast.success('جاري تنزيل التقرير PDF');
}

function exportExcel() {
    const date = new Date().toISOString().split('T')[0];
    API.exportExcel(date);
    Toast.success('جاري تنزيل التقرير Excel');
}

function logout() {
    TokenManager.removeToken();
    TokenManager.clearUserData();
    window.location.href = '/login.html';
}

// Initialize
init();
