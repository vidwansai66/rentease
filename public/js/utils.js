// SKELETON GENERATORS
function skeletonProductCard() {
    return `
        <div class="product-card" style="pointer-events:none">
            <div style="aspect-ratio:4/3;border-radius:12px 12px 0 0" class="skeleton"></div>
            <div style="padding:12px">
                <div class="skeleton" style="height:12px;width:50%;margin-bottom:8px;border-radius:4px"></div>
                <div class="skeleton" style="height:18px;width:85%;margin-bottom:6px;border-radius:4px"></div>
                <div class="skeleton" style="height:14px;width:40%;margin-bottom:14px;border-radius:4px"></div>
                <div class="skeleton" style="height:38px;width:100%;border-radius:8px"></div>
            </div>
        </div>
    `;
}

function skeletonDashboardStat() {
    return `
        <div class="card" style="pointer-events:none">
            <div class="skeleton" style="height:40px;width:55%;margin-bottom:10px;border-radius:6px"></div>
            <div class="skeleton" style="height:16px;width:75%;border-radius:4px"></div>
        </div>
    `;
}

function skeletonTableRow(cols = 5) {
    return `<tr>${Array(cols).fill(0).map(() => '<td><div class="skeleton" style="height:16px;border-radius:4px"></div></td>').join('')}</tr>`;
}

function skeletonRentalCard() {
    return `
        <div class="card" style="pointer-events:none;padding:16px">
            <div style="display:flex;gap:12px">
                <div class="skeleton" style="width:80px;height:80px;border-radius:8px;flex-shrink:0"></div>
                <div style="flex:1">
                    <div class="skeleton" style="height:18px;width:70%;margin-bottom:10px;border-radius:4px"></div>
                    <div class="skeleton" style="height:14px;width:50%;margin-bottom:14px;border-radius:4px"></div>
                    <div class="skeleton" style="height:8px;width:100%;margin-bottom:8px;border-radius:4px"></div>
                    <div class="skeleton" style="height:14px;width:40%;border-radius:4px"></div>
                </div>
            </div>
        </div>
    `;
}

// SCROLL ANIMATOR
function initScrollAnimator() {
    const css = `
        [data-animate]{opacity:0;transition:opacity 0.6s ease,transform 0.6s ease}
        [data-animate="fade-up"]{transform:translateY(40px)}
        [data-animate="fade-left"]{transform:translateX(-40px)}
        [data-animate="fade-right"]{transform:translateX(40px)}
        [data-animate="scale-in"]{transform:scale(0.88)}
        [data-animate].is-visible{opacity:1;transform:none}
    `;
    if (!document.getElementById('scroll-anim-styles')) {
        const s = document.createElement('style');
        s.id = 'scroll-anim-styles';
        s.textContent = css;
        document.head.appendChild(s);
    }
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('is-visible');
                obs.unobserve(e.target);
            }
        });
    }, { threshold: 0.12 });
    document.querySelectorAll('[data-animate]').forEach(el => obs.observe(el));
}

// MOBILE MENU
function initMobileMenu() {
    const btn = document.getElementById('hamburger');
    const menu = document.getElementById('mobileMenu');
    if (!btn || !menu) return;

    function open() {
        menu.classList.add('is-open');
        btn.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    }

    function close() {
        menu.classList.remove('is-open');
        btn.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    btn.addEventListener('click', () => menu.classList.contains('is-open') ? close() : open());
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && menu.classList.contains('is-open')) close();
    });
}

// CONFIRM MODAL — returns Promise<boolean>
function confirmModal({ title = 'Confirm', message = 'Are you sure?', confirmText = 'Confirm', cancelText = 'Cancel', type = 'warning' } = {}) {
    return new Promise(resolve => {
        const typeColors = { danger: '#E74C3C', warning: '#E67E22' };
        const color = typeColors[type] || typeColors.warning;
        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed',
            inset: '0',
            background: 'rgba(0,0,0,0.5)',
            zIndex: '350',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease'
        });

        overlay.innerHTML = `
            <div style="background:white;border-radius:16px;padding:28px;max-width:420px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.2)">
                <h3 style="margin:0 0 10px;font-size:18px;color:#1A202C">${title}</h3>
                <p style="margin:0 0 24px;font-size:14px;color:#4A5568;line-height:1.6">${message}</p>
                <div style="display:flex;gap:10px;justify-content:flex-end">
                    <button id="cm-cancel" style="padding:10px 20px;border:1px solid #E2E8F0;border-radius:8px;background:white;cursor:pointer;font-size:14px">${cancelText}</button>
                    <button id="cm-confirm" style="padding:10px 20px;border:none;border-radius:8px;background:${color};color:white;cursor:pointer;font-size:14px;font-weight:500">${confirmText}</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        overlay.querySelector('#cm-confirm').addEventListener('click', () => { overlay.remove(); resolve(true); });
        overlay.querySelector('#cm-cancel').addEventListener('click', () => { overlay.remove(); resolve(false); });
        overlay.addEventListener('click', e => { if (e.target === overlay) { overlay.remove(); resolve(false); } });

        const handler = (e) => {
            if (e.key === 'Escape') {
                overlay.remove();
                resolve(false);
                document.removeEventListener('keydown', handler);
            }
        };
        document.addEventListener('keydown', handler);
    });
}

// LAZY IMAGE LOADER
function initLazyImages() {
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                const img = e.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.onload = () => img.classList.add('loaded');
                    img.onerror = () => { img.src = '/images/placeholder.jpg'; img.classList.add('loaded'); };
                    obs.unobserve(img);
                }
            }
        });
    }, { rootMargin: '150px' });
    document.querySelectorAll('img.lazy-img[data-src]').forEach(img => obs.observe(img));
}

// ERROR AND EMPTY STATES
function renderError(container, message = 'Something went wrong.', retryFn = null) {
    if (!container) return;
    container.innerHTML = `
        <div style="text-align:center;padding:48px 24px">
            <div style="font-size:48px;margin-bottom:12px">⚠️</div>
            <p style="font-size:16px;color:#4A5568;margin:0 0 16px">${message}</p>
            ${retryFn ? `<button id="retry-btn" style="padding:10px 24px;background:#1A3C5E;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px">Try Again</button>` : ''}
        </div>
    `;
    if (retryFn) {
        container.querySelector('#retry-btn').onclick = retryFn;
    }
}

function renderEmpty(container, { icon = '📭', title = 'Nothing here yet', subtitle = '', ctaText = '', ctaHref = '' } = {}) {
    if (!container) return;
    container.innerHTML = `
        <div style="text-align:center;padding:64px 24px">
            <div style="font-size:56px;margin-bottom:16px">${icon}</div>
            <h3 style="font-size:20px;margin:0 0 8px;color:#1A202C">${title}</h3>
            <p style="color:#4A5568;margin:0 0 24px;font-size:15px">${subtitle}</p>
            ${ctaText && ctaHref ? `<a href="${ctaHref}" style="display:inline-block;padding:12px 28px;background:#F4A623;color:white;border-radius:8px;text-decoration:none;font-weight:500">${ctaText}</a>` : ''}
        </div>
    `;
}

// PAGINATION
function renderPagination(container, { currentPage, totalPages, onPageChange }) {
    if (!container || totalPages <= 1) {
        if (container) container.innerHTML = '';
        return;
    }

    const pages = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        pages.push(1);
        if (currentPage > 3) pages.push('...');
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
        if (currentPage < totalPages - 2) pages.push('...');
        pages.push(totalPages);
    }

    const btnStyle = 'padding:8px 14px;border:1px solid #E2E8F0;border-radius:8px;background:white;cursor:pointer;font-size:14px;min-width:40px';
    const activeStyle = 'padding:8px 14px;border:1px solid #F4A623;border-radius:8px;background:#F4A623;color:white;font-size:14px;font-weight:500;min-width:40px';
    const disabledStyle = 'padding:8px 14px;border:1px solid #E2E8F0;border-radius:8px;background:#F8F9FC;color:#A0AEC0;font-size:14px;min-width:40px;cursor:not-allowed';

    container.innerHTML = `
        <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;padding:20px 0">
            <button id="prev-page" style="${currentPage <= 1 ? disabledStyle : btnStyle}" ${currentPage <= 1 ? 'disabled' : ''}>←</button>
            ${pages.map(p => p === '...' ? `<span style="padding:8px 4px;font-size:14px;color:#A0AEC0">…</span>` : `<button class="page-btn" data-page="${p}" style="${p === currentPage ? activeStyle : btnStyle}">${p}</button>`).join('')}
            <button id="next-page" style="${currentPage >= totalPages ? disabledStyle : btnStyle}" ${currentPage >= totalPages ? 'disabled' : ''}>→</button>
        </div>
    `;

    container.querySelectorAll('.page-btn').forEach(btn => {
        btn.onclick = () => onPageChange(parseInt(btn.dataset.page));
    });
    if (currentPage > 1) {
        container.querySelector('#prev-page').onclick = () => onPageChange(currentPage - 1);
    }
    if (currentPage < totalPages) {
        container.querySelector('#next-page').onclick = () => onPageChange(currentPage + 1);
    }
}

function initGlobalSearch() {
    const overlay = document.getElementById('searchOverlay');
    const input = document.getElementById('globalSearchInput');
    const dropdown = document.getElementById('searchDropdown');
    const trigger = document.getElementById('searchTrigger');
    if (!overlay || !input) return;

    let debounceTimer;
    const openSearch = () => {
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';
        input.focus();
        document.body.style.overflow = 'hidden';
    };
    const closeSearch = () => {
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
        document.body.style.overflow = '';
        dropdown.style.display = 'none';
        input.value = '';
    };

    trigger?.addEventListener('click', openSearch);
    document.getElementById('searchClose')?.addEventListener('click', closeSearch);
    overlay?.addEventListener('click', e => { if (e.target === overlay) closeSearch(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.style.pointerEvents !== 'none') closeSearch(); });

    input?.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const q = input.value.trim();
        if (q.length < 2) { dropdown.style.display = 'none'; return; }
        debounceTimer = setTimeout(async () => {
            try {
                const { data } = await API.get('/products/search?q=' + encodeURIComponent(q) + '&type=all&limit=5');
                renderSearchResults(data, q);
            } catch (e) {
                dropdown.innerHTML = '<div style="padding:20px;text-align:center;color:#718096;font-size:14px">Search unavailable</div>';
                dropdown.style.display = 'block';
            }
        }, 300);
    });

    function renderSearchResults({ products, categories }, q) {
        if (!products.length && !categories.length) {
            dropdown.innerHTML = `<div style="padding:32px;text-align:center"><p style="color:#718096;font-size:14px">No results for "<strong>${q}</strong>". Try different keywords.</p></div>`;
            dropdown.style.display = 'block'; return;
        }
        let html = '';
        if (products.length) {
            html += `<div style="padding:10px 16px 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#A0AEC0;display:flex;justify-content:space-between"><span>Products</span><a href="/pages/products.html?search=${encodeURIComponent(q)}" style="color:#F4A623;text-decoration:none;font-size:11px" onclick="closeSearch?.()">View all →</a></div>`;
            html += products.map(p => `
                <a href="/pages/product-detail.html?slug=${p.slug}" onclick="closeSearch?.()" style="display:flex;align-items:center;gap:12px;padding:10px 16px;text-decoration:none;color:inherit;cursor:pointer" onmouseover="this.style.background='#F8F9FC'" onmouseout="this.style.background=''">
                    <img src="${p.images?.[0] || '/images/placeholder.jpg'}" alt="${p.name}" style="width:44px;height:44px;object-fit:cover;border-radius:8px;flex-shrink:0">
                    <div><div style="font-size:14px;font-weight:500;color:#1A202C">${p.name}</div><div style="font-size:12px;color:#718096">${p.category?.name || ''} · from ₹${p.rentalPlans?.[0]?.monthlyPrice || 0}/mo</div></div>
                </a>
            `).join('');
        }
        if (categories.length) {
            html += `<div style="padding:10px 16px 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#A0AEC0;border-top:1px solid #F1F4F9">Categories</div>`;
            html += categories.map(c => `
                <a href="/pages/products.html?category=${c.slug}" onclick="closeSearch?.()" style="display:flex;align-items:center;gap:12px;padding:10px 16px;text-decoration:none;color:inherit;cursor:pointer" onmouseover="this.style.background='#F8F9FC'" onmouseout="this.style.background=''">
                    <span style="font-size:22px;width:44px;text-align:center">${c.icon || '📦'}</span>
                    <div style="font-size:14px;font-weight:500;color:#1A202C">${c.name}</div>
                </a>
            `).join('');
        }
        dropdown.innerHTML = html; dropdown.style.display = 'block';
    }
}

function initNavbarScroll() {
    const nav = document.getElementById('mainNavbar');
    if (!nav) return;
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            nav.classList.add('navbar--scrolled');
        } else {
            nav.classList.remove('navbar--scrolled');
        }
    });
}

// AUTO-INIT ON EVERY PAGE
document.addEventListener('DOMContentLoaded', () => {
    if (window.cartUtils) cartUtils.syncCartBadge();
    initScrollAnimator();
    initMobileMenu();
    initLazyImages();
    initGlobalSearch();
    initNavbarScroll();
});

// EXPOSE GLOBALLY
const utils = {
    skeletonProductCard,
    skeletonDashboardStat,
    skeletonTableRow,
    skeletonRentalCard,
    confirmModal,
    renderError,
    renderEmpty,
    renderPagination,
    initScrollAnimator,
    initMobileMenu,
    initLazyImages,
    initGlobalSearch,
    initNavbarScroll
};

window.utils = utils;

// Also expose individual functions for backward compatibility if needed
window.skeletonProductCard = skeletonProductCard;
window.skeletonDashboardStat = skeletonDashboardStat;
window.skeletonTableRow = skeletonTableRow;
window.skeletonRentalCard = skeletonRentalCard;
window.confirmModal = confirmModal;
window.renderError = renderError;
window.renderEmpty = renderEmpty;
window.renderPagination = renderPagination;
window.initScrollAnimator = initScrollAnimator;
window.initMobileMenu = initMobileMenu;
window.initLazyImages = initLazyImages;
window.initGlobalSearch = initGlobalSearch;
