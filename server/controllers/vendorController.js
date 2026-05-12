const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const Rental = require('../models/Rental');
const sendResponse = require('../utils/sendResponse');

// @desc    Upgrade user to vendor
// @route   POST /api/v1/vendor/register
exports.registerVendor = async (req, res) => {
    const { companyName, businessType, taxId, businessAddress, description } = req.body;

    if (!companyName || !taxId) {
        return sendResponse(res, 400, false, 'Please provide company name and tax ID');
    }

    const user = await User.findById(req.user._id);
    
    user.role = 'vendor';
    user.vendorProfile = {
        companyName,
        businessType,
        taxId,
        businessAddress,
        description,
        isStorePublic: true
    };

    await user.save();

    return sendResponse(res, 200, true, 'Successfully registered as vendor', {
        user: {
            id: user._id,
            name: user.name,
            role: user.role,
            vendorProfile: user.vendorProfile
        }
    });
};

// @desc    Get vendor stats
// @route   GET /api/v1/vendor/stats
exports.getVendorStats = async (req, res) => {
    try {
        const products = await Product.find({ vendor: req.user._id });
        const productIds = products.map(p => p._id);

        // Get orders containing vendor's products
        const orders = await Order.find({ 'items.product': { $in: productIds } });
        
        // Calculate total revenue from these orders (only vendor's portion)
        let totalRevenue = 0;
        orders.forEach(order => {
            order.items.forEach(item => {
                if (productIds.some(id => id.equals(item.product))) {
                    // Use totalPrice from the selected plan
                    totalRevenue += (item.selectedPlan?.totalPrice || 0) * (item.quantity || 1);
                }
            });
        });

        const activeRentals = await Rental.countDocuments({ 
            product: { $in: productIds },
            status: 'active'
        });

        const pendingApprovals = products.filter(p => !p.isApproved).length;

        return sendResponse(res, 200, true, 'Vendor stats', {
            totalProducts: products.length,
            totalOrders: orders.length,
            totalRevenue,
            activeRentals,
            pendingApprovals,
            recentProducts: products.slice(0, 5),
            recentOrders: orders.slice(0, 5).map(o => ({
                orderNumber: o.orderNumber,
                createdAt: o.createdAt,
                grandTotal: o.pricing.grandTotal,
                orderStatus: o.orderStatus
            }))
        });
    } catch (error) {
        console.error('Vendor Stats Error:', error);
        return sendResponse(res, 500, false, 'Failed to fetch vendor stats');
    }
};

// @desc    Get vendor products
// @route   GET /api/v1/vendor/products
exports.getVendorProducts = async (req, res) => {
    const products = await Product.find({ vendor: req.user._id }).populate('category', 'name');
    return sendResponse(res, 200, true, 'Vendor products', { products });
};

// @desc    Create vendor product
// @route   POST /api/v1/vendor/products
exports.createVendorProduct = async (req, res) => {
    req.body.vendor = req.user._id;
    req.body.isApproved = false; // Requires admin approval

    // Generate slug
    if (req.body.name) {
        req.body.slug = req.body.name
            .toLowerCase()
            .split(' ')
            .join('-')
            .replace(/[^\w-]+/g, '') + '-' + Date.now().toString().slice(-4);
    }

    const product = await Product.create(req.body);

    return sendResponse(res, 201, true, 'Product created and pending approval', { product });
};

// @desc    Update vendor product
// @route   PUT /api/v1/vendor/products/:id
exports.updateVendorProduct = async (req, res) => {
    let product = await Product.findById(req.params.id);

    if (!product) {
        return sendResponse(res, 404, false, 'Product not found');
    }

    if (product.vendor.toString() !== req.user._id.toString()) {
        return sendResponse(res, 401, false, 'Not authorized to update this product');
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    return sendResponse(res, 200, true, 'Product updated', { product });
};

// @desc    Delete vendor product
// @route   DELETE /api/v1/vendor/products/:id
exports.deleteVendorProduct = async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return sendResponse(res, 404, false, 'Product not found');
    }

    if (product.vendor.toString() !== req.user._id.toString()) {
        return sendResponse(res, 401, false, 'Not authorized to delete this product');
    }

    await product.remove();

    return sendResponse(res, 200, true, 'Product removed');
};

// @desc    Get orders for vendor's products
// @route   GET /api/v1/vendor/orders
exports.getVendorOrders = async (req, res) => {
    const products = await Product.find({ vendor: req.user._id });
    const productIds = products.map(p => p._id);

    const orders = await Order.find({ 'items.product': { $in: productIds } })
        .populate('user', 'name email')
        .populate('items.product', 'name images')
        .sort('-createdAt');

    // Filter order items to only include vendor's products for each order
    const vendorOrders = orders.map(order => {
        const vendorItems = order.items.filter(item => 
            productIds.some(id => id.equals(item.product._id))
        );
        const vendorTotal = vendorItems.reduce((acc, item) => 
            acc + ((item.selectedPlan?.totalPrice || 0) * (item.quantity || 1)), 0);
        
        return {
            _id: order._id,
            orderNumber: order.orderNumber,
            user: order.user,
            createdAt: order.createdAt,
            items: vendorItems,
            vendorTotal,
            orderStatus: order.orderStatus
        };
    });

    return sendResponse(res, 200, true, 'Vendor orders', { orders: vendorOrders });
};
