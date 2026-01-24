function checkAuth() {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = '/signin';
        return false;
    }

    // Decode JWT to check expiration (simple check)
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000; // Convert to milliseconds

        if (Date.now() >= exp) {
            // Token expired
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/signin';
            return false;
        }
    } catch (error) {
        // Invalid token format
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/signin';
        return false;
    }

    return true;
}