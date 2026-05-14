const CART_KEY = 'rentease_cart';

const cartUtils = (() => {
    const getCart = () => {
        const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
        // Filter out items with invalid IDs (not 24 chars) or missing critical data
        return cart.filter(item => item.productId && item.productId.length === 24 && item.selectedPlan);
    };
    
    const saveCart = (cart) => localStorage.setItem(CART_KEY, JSON.stringify(cart));

    const addItem = (item) => {
        let cart = getCart();
        const existing = cart.find(i => 
            i.productId === item.productId && 
            i.selectedPlan.duration === item.selectedPlan.duration &&
            JSON.stringify(i.customization || {}) === JSON.stringify(item.customization || {})
        );

        if (existing) {
            existing.quantity += item.quantity || 1;
        } else {
            cart.push({
                ...item,
                quantity: item.quantity || 1,
                addedAt: new Date().toISOString()
            });
        }
        saveCart(cart);
        syncCartBadge();
        return cart;
    };

    const removeItem = (productId, planDuration) => {
        const cart = getCart().filter(i => 
            !(i.productId === productId && i.selectedPlan.duration === planDuration)
        );
        saveCart(cart);
        syncCartBadge();
        return cart;
    };

    const updateQty = (productId, planDuration, qty) => {
        if (qty <= 0) {
            return removeItem(productId, planDuration);
        }
        const cart = getCart();
        const item = cart.find(i => 
            i.productId === productId && 
            i.selectedPlan.duration === planDuration
        );
        if (item) {
            item.quantity = qty;
            saveCart(cart);
            syncCartBadge();
        }
        return cart;
    };

    const clearCart = () => {
        localStorage.removeItem(CART_KEY);
        syncCartBadge();
    };

    const getCount = () => getCart().reduce((sum, i) => sum + i.quantity, 0);

    const getTotals = () => {
        const cart = getCart();
        const subtotal = cart.reduce((s, i) => s + (i.selectedPlan?.monthlyPrice || 0) * (i.quantity || 1), 0);
        const totalDeposit = cart.reduce((s, i) => s + (i.securityDeposit || 0) * (i.quantity || 1), 0);
        const deliveryCharge = subtotal > 2000 ? 0 : (subtotal === 0 ? 0 : 499);
        const grandTotal = subtotal + totalDeposit + deliveryCharge;
        return { subtotal, totalDeposit, deliveryCharge, grandTotal };
    };

    const syncCartBadge = () => {
        const count = getCount();
        document.querySelectorAll('.cart-count').forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? 'inline-flex' : 'none';
        });
        renderSidebar();
    };

    const openSidebar = () => {
        const sidebar = document.getElementById('cartSidebar');
        const backdrop = document.getElementById('cartBackdrop');
        if (sidebar && backdrop) {
            sidebar.classList.add('open');
            backdrop.style.display = 'block';
            renderSidebar();
        }
    };

    const closeSidebar = () => {
        const sidebar = document.getElementById('cartSidebar');
        const backdrop = document.getElementById('cartBackdrop');
        if (sidebar && backdrop) {
            sidebar.classList.remove('open');
            backdrop.style.display = 'none';
        }
    };

    const renderSidebar = () => {
        const container = document.getElementById('cartSidebarItems');
        if (!container) return;

        const cart = getCart();
        document.getElementById('cartSidebarCount').textContent = `(${cart.length})`;
        
        if (cart.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🛒</div>
                    <p class="text-muted">Your cart is empty</p>
                </div>
            `;
            document.getElementById('cartSidebarTotal').textContent = '₹0';
            return;
        }

        container.innerHTML = cart.map(i => `
            <div class="cart-item-mini">
                <img src="${i.productImage || (i.images && i.images[0]) || '/images/placeholder.png'}" alt="${i.productName || 'Product'}">
                <div style="flex-grow: 1;">
                    <h4 style="font-size: 0.875rem; margin-bottom: 2px;">${i.productName || 'Unknown Product'}</h4>
                    <p class="text-muted" style="font-size: 0.75rem;">${i.selectedPlan?.label || 'Default Plan'}</p>
                    <div class="flex-between mt-2">
                        <div class="flex-start gap-3">
                            <button class="btn-ghost p-1" style="font-size: 0.7rem;" onclick="cartUtils.updateQty('${i.productId}', ${i.selectedPlan?.duration || 0}, ${i.quantity - 1})">-</button>
                            <span style="font-size: 0.8rem; font-weight: 700;">${i.quantity}</span>
                            <button class="btn-ghost p-1" style="font-size: 0.7rem;" onclick="cartUtils.updateQty('${i.productId}', ${i.selectedPlan?.duration || 0}, ${i.quantity + 1})">+</button>
                        </div>
                        <span style="font-weight: 700; font-size: 0.875rem;">₹${((i.selectedPlan?.monthlyPrice || 0) * i.quantity).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        `).join('');

        const { subtotal } = getTotals();
        document.getElementById('cartSidebarTotal').textContent = `₹${subtotal.toLocaleString()}`;
    };

    const addToCart = (product, plan, quantity = 1, customization = {}) => {
        addItem({
            productId: product._id,
            productName: product.name,
            productImage: product.images[0],
            securityDeposit: product.securityDeposit,
            selectedPlan: plan,
            quantity: quantity,
            customization: customization
        });
        openSidebar();
        Toast.success('Added to cart');
    };

    return { 
        getCart, 
        saveCart, 
        addItem, 
        addToCart,
        removeItem, 
        updateQty, 
        clearCart, 
        getCount, 
        getTotals, 
        syncCartBadge,
        openSidebar,
        closeSidebar
    };
})();

window.cartUtils = cartUtils;
document.addEventListener('DOMContentLoaded', cartUtils.syncCartBadge);
