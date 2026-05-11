const Auth = (() => {
    let currentUser = null;

    async function handleLogin(e) {
        e.preventDefault();
        const btn = document.getElementById('submitBtn');
        btnLoader(btn);

        const email = document.getElementById('emailInput').value.trim();
        const password = document.getElementById('passwordInput').value;

        try {
            const res = await API.post('/auth/login', { email, password });
            localStorage.setItem('rentease_user', JSON.stringify(res.data.user));
            Toast.success('Welcome back, ' + res.data.user.name + '!');
            
            setTimeout(() => {
                window.location.href = res.data.user.role === 'admin' ? '/pages/admin/dashboard.html' : '/pages/dashboard.html';
            }, 800);
        } catch (err) {
            btnLoaderDone(btn, false);
            Toast.error(err.message);
        }
    }

    async function handleRegister(e) {
        e.preventDefault();
        const btn = document.getElementById('submitBtn');
        btnLoader(btn);

        const data = {
            name: document.getElementById('nameInput').value.trim(),
            email: document.getElementById('emailInput').value.trim(),
            phone: document.getElementById('phoneInput').value.trim(),
            password: document.getElementById('passwordInput').value,
            confirmPassword: document.getElementById('confirmPasswordInput').value
        };

        try {
            const res = await API.post('/auth/register', data);
            localStorage.setItem('rentease_user', JSON.stringify(res.data.user));
            Toast.success('Welcome to RentEase!');
            
            setTimeout(() => {
                window.location.href = '/pages/dashboard.html';
            }, 800);
        } catch (err) {
            btnLoaderDone(btn, false);
            Toast.error(err.message);
        }
    }

    async function checkAuth() {
        try {
            const res = await API.get('/auth/me');
            currentUser = res.data.user;
            // Sync localStorage
            localStorage.setItem('rentease_user', JSON.stringify(currentUser));
            return currentUser;
        } catch (err) {
            currentUser = null;
            // Clear if unauthorized
            if (err.status === 401) localStorage.removeItem('rentease_user');
            return null;
        }
    }

    async function logout() {
        try {
            await API.post('/auth/logout');
        } catch (e) {}
        localStorage.removeItem('rentease_user');
        window.location.href = '/pages/login.html';
    }

    function getStoredUser() {
        return JSON.parse(localStorage.getItem('rentease_user'));
    }

    const protectedPages = ['dashboard.html', 'active-rentals.html', 'rental-history.html', 'maintenance.html', 'cart.html', 'checkout.html'];
    const authPages = ['login.html', 'register.html'];
    const currentPage = window.location.pathname.split('/').pop();

    async function init() {
        const user = await checkAuth();

        if (!user && protectedPages.includes(currentPage)) {
            window.location.href = '/pages/login.html?from=' + encodeURIComponent(window.location.pathname);
            return;
        }

        if (user && authPages.includes(currentPage)) {
            window.location.href = user.role === 'admin' ? '/pages/admin/dashboard.html' : '/pages/dashboard.html';
            return;
        }

        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (loginForm) loginForm.addEventListener('submit', handleLogin);
        if (registerForm) registerForm.addEventListener('submit', handleRegister);
    }

    return {
        handleLogin,
        handleRegister,
        logout,
        checkAuth,
        getStoredUser,
        init
    };
})();

window.Auth = Auth;
document.addEventListener('DOMContentLoaded', Auth.init);
