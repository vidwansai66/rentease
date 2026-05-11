(function() {
    const userStr = localStorage.getItem('rentease_user');
    if (!userStr) {
        window.location.href = '/pages/auth/login.html';
        return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== 'vendor' && user.role !== 'admin') {
        // Double check with server before redirecting (might be stale localStorage)
        fetch('/api/v1/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.success && (data.data.user.role === 'vendor' || data.data.user.role === 'admin')) {
                    // Update localStorage and stay
                    localStorage.setItem('rentease_user', JSON.stringify(data.data.user));
                } else {
                    window.location.href = '/pages/dashboard.html';
                }
            })
            .catch(() => {
                window.location.href = '/pages/dashboard.html';
            });
    }
})();
