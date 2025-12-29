// Check if already logged in
if (TokenManager.isAuthenticated()) {
    const user = TokenManager.getUserData();
    redirectToDashboard(user.role);
}

const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const errorMessage = document.getElementById('errorMessage');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
        showError('الرجاء إدخال اسم المستخدم وكلمة المرور');
        return;
    }

    try {
        setLoading(true);
        hideError();

        const response = await API.login(username, password);

        // Store token and user data
        TokenManager.setToken(response.token);
        TokenManager.setUserData(response.user);

        Toast.success('تم تسجيل الدخول بنجاح!');

        // Redirect based on role
        setTimeout(() => {
            redirectToDashboard(response.user.role);
        }, 500);

    } catch (error) {
        showError(error.message || 'فشل تسجيل الدخول. تحقق من بياناتك.');
        setLoading(false);
    }
});

function setLoading(loading) {
    const btnText = loginBtn.querySelector('.btn-text');
    const btnLoader = loginBtn.querySelector('.btn-loader');

    if (loading) {
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-block';
        loginBtn.disabled = true;
    } else {
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        loginBtn.disabled = false;
    }
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function hideError() {
    errorMessage.style.display = 'none';
}
