const PageLoader = (() => {
    let overlay = null;

    function show(message = 'Loading...') {
        if (overlay) return;
        overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed',
            inset: '0',
            background: 'rgba(248,249,252,0.92)',
            zIndex: '9999',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 0.3s ease',
            opacity: '0'
        });

        overlay.innerHTML = `
            <div style="width:44px;height:44px;border:3px solid #E2E8F0;border-top-color:#1A3C5E;border-radius:50%;animation:spin 0.8s linear infinite"></div>
            <p style="margin-top:14px;font-size:14px;color:#4A5568;font-family:sans-serif">${message}</p>
        `;

        if (!document.getElementById('loader-spin-style')) {
            const s = document.createElement('style');
            s.id = 'loader-spin-style';
            s.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
            document.head.appendChild(s);
        }

        document.body.appendChild(overlay);
        requestAnimationFrame(() => requestAnimationFrame(() => overlay.style.opacity = '1'));
    }

    function hide() {
        if (!overlay) return;
        overlay.style.opacity = '0';
        setTimeout(() => {
            if (overlay) overlay.remove();
            overlay = null;
        }, 320);
    }

    return { show, hide };
})();

function btnLoader(btn) {
    if (!btn) return;
    btn._savedHTML = btn.innerHTML;
    btn._savedWidth = btn.offsetWidth + 'px';
    btn.style.width = btn._savedWidth;
    btn.style.minWidth = btn._savedWidth;
    btn.innerHTML = '<span style="display:inline-block;width:18px;height:18px;border:2px solid rgba(255,255,255,0.4);border-top-color:white;border-radius:50%;animation:spin 0.7s linear infinite;vertical-align:middle"></span>';
    btn.disabled = true;
}

function btnLoaderDone(btn, success = true) {
    if (!btn) return;
    btn.innerHTML = success ? '✓' : '✕';
    btn.style.color = success ? '#27AE60' : '#E74C3C';
    setTimeout(() => {
        btn.innerHTML = btn._savedHTML;
        btn.style.color = '';
        btn.style.width = '';
        btn.style.minWidth = '';
        btn.disabled = false;
    }, 700);
}

window.PageLoader = PageLoader;
window.btnLoader = btnLoader;
window.btnLoaderDone = btnLoaderDone;
