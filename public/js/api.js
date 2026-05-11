const API = (() => {
    const BASE = '/api/v1';

    async function request(method, endpoint, data = null, isFormData = false) {
        const config = {
            method,
            credentials: 'include'
        };

        if (!isFormData) {
            config.headers = {
                'Content-Type': 'application/json'
            };
        }

        if (data && method !== 'GET') {
            config.body = isFormData ? data : JSON.stringify(data);
        }

        let response;
        try {
            response = await fetch(BASE + endpoint, config);
        } catch (networkError) {
            throw new Error('Network error. Please check your connection and try again.');
        }

        let json;
        try {
            json = await response.json();
        } catch (e) {
            throw new Error('Server returned invalid response (status ' + response.status + ')');
        }

        if (response.status === 401) {
            const currentPage = window.location.pathname.split('/').pop();
            const authPages = ['login.html', 'register.html'];
            if (!authPages.includes(currentPage)) {
                window.location.href = '/pages/login.html?from=' + encodeURIComponent(window.location.pathname);
            }
            throw new Error(json.message || 'Authentication required');
        }

        if (!response.ok) {
            throw new Error(json.message || 'Request failed with status ' + response.status);
        }

        return json;
    }

    return {
        get: (ep) => request('GET', ep),
        post: (ep, data, fd = false) => request('POST', ep, data, fd),
        put: (ep, data, fd = false) => request('PUT', ep, data, fd),
        delete: (ep) => request('DELETE', ep),
    };
})();

window.API = API;
