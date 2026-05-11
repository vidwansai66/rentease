(function() {
    const userStr = localStorage.getItem('rentease_user');
    if (!userStr) {
        window.location.href = '/pages/auth/login.html';
        return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== 'admin') {
        window.location.href = '/pages/dashboard.html';
    }
})();
