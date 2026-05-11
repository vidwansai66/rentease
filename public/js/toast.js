const Toast = (() => {
    let container = null;
    const ICONS = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    const COLORS = { success: '#27AE60', error: '#E74C3C', warning: '#E67E22', info: '#2980B9' };

    function ensureContainer() {
        if (!container || !document.body.contains(container)) {
            container = document.createElement('div');
            container.id = 'toast-container';
            Object.assign(container.style, {
                position: 'fixed',
                top: '16px',
                right: '16px',
                zIndex: '400',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                maxWidth: '380px',
                pointerEvents: 'none'
            });
            document.body.appendChild(container);
        }
        return container;
    }

    function show(type, message, duration = 4000) {
        const c = ensureContainer();
        const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
        const toast = document.createElement('div');
        toast.id = id;
        Object.assign(toast.style, {
            background: '#FFFFFF',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            transform: 'translateX(110%)',
            transition: 'transform 0.3s ease',
            pointerEvents: 'auto',
            minWidth: '280px',
            borderLeft: '4px solid ' + COLORS[type],
            position: 'relative',
            overflow: 'hidden'
        });

        toast.innerHTML = `
            <span style="font-size:18px;color:${COLORS[type]};flex-shrink:0;font-weight:bold">${ICONS[type]}</span>
            <span style="font-size:14px;color:#1A202C;flex:1;line-height:1.5;word-break:break-word">${message}</span>
            <button onclick="Toast.dismiss('${id}')" style="background:none;border:none;cursor:pointer;color:#A0AEC0;font-size:18px;line-height:1;padding:0;flex-shrink:0" aria-label="Close toast">×</button>
            <div style="position:absolute;bottom:0;left:0;height:3px;background:${COLORS[type]};animation:toastProgress ${duration}ms linear forwards"></div>
        `;

        if (!document.getElementById('toast-styles')) {
            const s = document.createElement('style');
            s.id = 'toast-styles';
            s.textContent = '@keyframes toastProgress{from{width:100%}to{width:0%}}';
            document.head.appendChild(s);
        }

        c.appendChild(toast);
        requestAnimationFrame(() => requestAnimationFrame(() => { toast.style.transform = 'translateX(0)'; }));

        const timer = setTimeout(() => dismiss(id), duration);
        toast._timer = timer;
        return id;
    }

    function dismiss(id) {
        const toast = document.getElementById(id);
        if (!toast) return;
        clearTimeout(toast._timer);
        toast.style.transform = 'translateX(110%)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 320);
    }

    return {
        success: (m, d) => show('success', m, d),
        error: (m, d) => show('error', m, d),
        warning: (m, d) => show('warning', m, d),
        info: (m, d) => show('info', m, d),
        dismiss
    };
})();

window.Toast = Toast;
