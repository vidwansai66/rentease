const Order = require('../models/Order');
const User = require('../models/User');
const Rental = require('../models/Rental');
const Product = require('../models/Product');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const PlatformSetting = require('../models/PlatformSetting');
const Category = require('../models/Category');
const sendResponse = require('../utils/sendResponse');

// @desc    Get admin dashboard stats
// @route   GET /api/v1/admin/stats
// @access  Private/Admin
exports.getStats = async (req, res, next) => {
    try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [
            totalUsers, 
            newUsers, 
            activeRentals, 
            totalRentals, 
            totalOrders, 
            ordersThisMonth, 
            revenueAll, 
            revenueMonth, 
            openTickets, 
            lowInventory, 
            recentOrders,
            recentTickets,
            orderCounts
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ createdAt: { $gte: startOfMonth } }),
            Rental.countDocuments({ status: 'active' }),
            Rental.countDocuments(),
            Order.countDocuments(),
            Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
            Order.aggregate([{ $group: { _id: null, total: { $sum: '$pricing.grandTotal' } } }]),
            Order.aggregate([
                { $match: { createdAt: { $gte: startOfMonth } } },
                { $group: { _id: null, total: { $sum: '$pricing.grandTotal' } } }
            ]),
            MaintenanceRequest.countDocuments({ status: { $nin: ['resolved', 'closed'] } }),
            Product.find({ availableUnits: { $lt: 3 } }).select('name availableUnits isAvailable').limit(5),
            Order.find().sort('-createdAt').limit(10).populate('user', 'name email'),
            MaintenanceRequest.find().sort('-createdAt').limit(5).populate('user', 'name email').populate('product', 'name'),
            Order.aggregate([
                { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
            ])
        ]);

        const statusCounts = orderCounts.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {
            placed: 0,
            confirmed: 0,
            'out-for-delivery': 0,
            delivered: 0,
            cancelled: 0,
            active: 0
        });

        sendResponse(res, 200, true, 'Admin stats fetched', {
            totalUsers,
            newUsers,
            activeRentals,
            totalRentals,
            totalOrders,
            ordersThisMonth,
            totalRevenue: revenueAll[0]?.total || 0,
            revenueThisMonth: revenueMonth[0]?.total || 0,
            openTickets: openTickets || 0,
            lowInventory,
            recentOrders,
            recentTickets: recentTickets || [],
            statusCounts
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get revenue chart data (12 months)
// @route   GET /api/v1/admin/revenue-chart
// @access  Private/Admin
exports.getRevenueChart = async (req, res, next) => {
    try {
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
        twelveMonthsAgo.setDate(1);
        twelveMonthsAgo.setHours(0, 0, 0, 0);

        const data = await Order.aggregate([
            {
                $match: { createdAt: { $gte: twelveMonthsAgo } }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    revenue: { $sum: '$pricing.grandTotal' },
                    orders: { $count: {} }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // Create a map of existing data
        const dataMap = {};
        data.forEach(d => {
            dataMap[`${d._id.year}-${d._id.month}`] = {
                revenue: d.revenue,
                orders: d.orders
            };
        });

        // Fill in all 12 months
        const chartData = [];
        let current = new Date(twelveMonthsAgo);
        const now = new Date();

        // Use a loop to get exactly 12 months including the current one
        for (let i = 0; i < 12; i++) {
            const year = current.getFullYear();
            const month = current.getMonth() + 1;
            const key = `${year}-${month}`;
            
            chartData.push({
                month: monthNames[current.getMonth()],
                year: year,
                revenue: dataMap[key]?.revenue || 0,
                orders: dataMap[key]?.orders || 0
            });

            current.setMonth(current.getMonth() + 1);
        }

        sendResponse(res, 200, true, 'Revenue chart data fetched', { chartData });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all products for admin
// @route   GET /api/v1/admin/products
// @access  Private/Admin
exports.adminGetProducts = async (req, res, next) => {
    try {
        const { search, category, status, page = 1, limit = 20 } = req.query;
        let query = {};
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (category) query.category = category;
        if (status === 'approved') query.isApproved = true;
        if (status === 'pending') query.isApproved = false;

        const skip = (page - 1) * limit;
        const [products, total] = await Promise.all([
            Product.find(query).sort('-createdAt').skip(skip).limit(+limit).populate('category', 'name').populate('vendor', 'name vendorProfile.companyName'),
            Product.countDocuments(query)
        ]);

        sendResponse(res, 200, true, 'Products fetched', { 
            products, 
            totalCount: total, 
            totalPages: Math.ceil(total / limit), 
            currentPage: +page 
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new product
// @route   POST /api/v1/admin/products
// @access  Private/Admin
exports.adminCreateProduct = async (req, res, next) => {
    try {
        const { name, category, brand, description, securityDeposit, rentalPlans } = req.body;

        if (!name || !category || !brand || !description || !securityDeposit) {
            return sendResponse(res, 400, false, 'Required fields missing');
        }

        const images = req.files?.map(f => '/images/uploads/' + f.filename) || [];
        
        // Generate Slug
        let slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        let finalSlug = slug;
        let counter = 2;
        while (await Product.exists({ slug: finalSlug })) {
            finalSlug = `${slug}-${counter}`;
            counter++;
        }

        const parsedPlans = JSON.parse(rentalPlans);
        if (!parsedPlans || parsedPlans.length === 0) {
            return sendResponse(res, 400, false, 'At least one rental plan is required');
        }

        const product = new Product({
            ...req.body,
            slug: finalSlug,
            images,
            rentalPlans: parsedPlans,
            tags: req.body.tags ? JSON.parse(req.body.tags) : []
        });

        await product.save();
        sendResponse(res, 201, true, 'Product created successfully', { product });
    } catch (error) {
        next(error);
    }
};

// @desc    Update product
// @route   PUT /api/v1/admin/products/:id
// @access  Private/Admin
exports.adminUpdateProduct = async (req, res, next) => {
    try {
        const existingProduct = await Product.findById(req.params.id);
        if (!existingProduct) {
            return sendResponse(res, 404, false, 'Product not found');
        }

        const updates = { ...req.body };
        
        if (req.body.rentalPlans) updates.rentalPlans = JSON.parse(req.body.rentalPlans);
        if (req.body.tags) updates.tags = JSON.parse(req.body.tags);

        if (req.files?.length) {
            const newImages = req.files.map(f => '/images/uploads/' + f.filename);
            updates.images = req.body.replaceImages === 'true' ? newImages : [...(existingProduct.images || []), ...newImages];
        }

        if (updates.name && updates.name !== existingProduct.name) {
            let slug = updates.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            let finalSlug = slug;
            let counter = 2;
            while (await Product.exists({ slug: finalSlug, _id: { $ne: req.params.id } })) {
                finalSlug = `${slug}-${counter}`;
                counter++;
            }
            updates.slug = finalSlug;
        }

        const product = await Product.findByIdAndUpdate(req.params.id, updates, { 
            new: true, 
            runValidators: true 
        });

        sendResponse(res, 200, true, 'Product updated successfully', { product });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete/Deactivate product
// @route   DELETE /api/v1/admin/products/:id
// @access  Private/Admin
exports.adminDeleteProduct = async (req, res, next) => {
    try {
        const activeRentals = await Rental.countDocuments({ product: req.params.id, status: 'active' });
        if (activeRentals > 0) {
            return sendResponse(res, 400, false, `Cannot delete: ${activeRentals} active rental(s) exist for this product`);
        }

        await Product.findByIdAndUpdate(req.params.id, { isAvailable: false, isActive: false });
        sendResponse(res, 200, true, 'Product deactivated successfully');
    } catch (error) {
        next(error);
    }
};

// @desc    Update product stock
// @route   PUT /api/v1/admin/products/:id/stock
// @access  Private/Admin
exports.adminUpdateStock = async (req, res, next) => {
    try {
        const { availableUnits, totalUnits } = req.body;
        const product = await Product.findByIdAndUpdate(
            req.params.id, 
            { 
                availableUnits: +availableUnits, 
                totalUnits: +totalUnits, 
                isAvailable: +availableUnits > 0 
            }, 
            { new: true }
        );
        sendResponse(res, 200, true, 'Stock updated successfully', { product });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all orders for admin
// @route   GET /api/v1/admin/orders
// @access  Private/Admin
exports.adminGetOrders = async (req, res, next) => {
    try {
        const { status, search, startDate, endDate, city, page = 1, limit = 20 } = req.query;
        let query = {};

        if (status) query.orderStatus = status;
        if (startDate || endDate) query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate + 'T23:59:59');
        if (city) query['deliveryAddress.city'] = { $regex: city, $options: 'i' };

        let ordersQuery = Order.find(query)
            .sort('-createdAt')
            .skip((page - 1) * limit)
            .limit(+limit)
            .populate('user', 'name email phone')
            .populate('items.product', 'name images');

        if (search) {
            const allOrders = await ordersQuery;
            const regex = new RegExp(search, 'i');
            const filtered = allOrders.filter(o => 
                regex.test(o.orderNumber) || 
                regex.test(o.user?.name) || 
                regex.test(o.user?.email)
            );
            return sendResponse(res, 200, true, 'Orders fetched', { 
                orders: filtered, 
                totalCount: filtered.length 
            });
        }

        const [orders, total] = await Promise.all([
            ordersQuery, 
            Order.countDocuments(query)
        ]);

        sendResponse(res, 200, true, 'Orders fetched', { 
            orders, 
            totalCount: total, 
            totalPages: Math.ceil(total / limit) 
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get order details for admin
// @route   GET /api/v1/admin/orders/:id
// @access  Private/Admin
exports.adminGetOrderById = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email phone')
            .populate('items.product', 'name images brand');

        if (!order) return sendResponse(res, 404, false, 'Order not found');

        const rentals = await Rental.find({ order: req.params.id }).populate('product', 'name');
        sendResponse(res, 200, true, 'Order details fetched', { order, rentals });
    } catch (error) {
        next(error);
    }
};

// @desc    Update order status
// @route   PUT /api/v1/admin/orders/:id/status
// @access  Private/Admin
exports.adminUpdateOrderStatus = async (req, res, next) => {
    try {
        const transitions = {
            'placed': ['confirmed', 'cancelled'],
            'confirmed': ['out-for-delivery', 'cancelled'],
            'out-for-delivery': ['delivered', 'cancelled'],
            'delivered': ['active'],
            'active': ['cancelled']
        };

        const order = await Order.findById(req.params.id);
        if (!order) return sendResponse(res, 404, false, 'Order not found');

        const { newStatus, note } = req.body;
        if (!transitions[order.orderStatus]?.includes(newStatus)) {
            return sendResponse(res, 400, false, `Invalid transition from ${order.orderStatus} to ${newStatus}`);
        }

        order.orderStatus = newStatus;
        order.statusHistory.push({
            status: newStatus,
            timestamp: new Date(),
            note: note || '',
            updatedBy: req.user._id
        });

        if (newStatus === 'delivered') {
            await Rental.updateMany(
                { order: order._id },
                { status: 'active', startDate: new Date() }
            );
        }

        if (newStatus === 'cancelled') {
            for (const item of order.items) {
                await Product.findByIdAndUpdate(item.product, {
                    $inc: { availableUnits: item.quantity }
                });
            }
            await Rental.updateMany(
                { order: order._id },
                { status: 'returned' }
            );
        }

        await order.save();
        sendResponse(res, 200, true, 'Order status updated successfully', { order });
    } catch (error) {
        next(error);
    }
};

// @desc    Approve vendor product
// @route   PUT /api/v1/admin/products/:id/approve
// @access  Private/Admin
exports.adminApproveProduct = async (req, res, next) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { isApproved: true, isAvailable: true },
            { new: true }
        );

        if (!product) return sendResponse(res, 404, false, 'Product not found');
        
        sendResponse(res, 200, true, 'Product approved and live', { product });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all users for admin
// @route   GET /api/v1/admin/users
// @access  Private/Admin
exports.adminGetUsers = async (req, res, next) => {
    try {
        const { role, search, page = 1, limit = 20 } = req.query;
        let query = {};
        
        if (role) query.role = role;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            User.find(query).select('-password').sort('-createdAt').skip(skip).limit(+limit),
            User.countDocuments(query)
        ]);

        sendResponse(res, 200, true, 'Users fetched', { 
            users, 
            totalCount: total, 
            totalPages: Math.ceil(total / limit) 
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user role
// @route   PUT /api/v1/admin/users/:id/role
// @access  Private/Admin
exports.adminUpdateUserRole = async (req, res, next) => {
    try {
        const { role } = req.body;
        if (!['customer', 'vendor', 'admin'].includes(role)) {
            return sendResponse(res, 400, false, 'Invalid role');
        }

        const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
        if (!user) return sendResponse(res, 404, false, 'User not found');

        sendResponse(res, 200, true, `User role updated to ${role}`, { user });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete user
// @route   DELETE /api/v1/admin/users/:id
// @access  Private/Admin
exports.adminDeleteUser = async (req, res, next) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return sendResponse(res, 404, false, 'User not found');
        sendResponse(res, 200, true, 'User deleted successfully');
    } catch (error) {
        next(error);
    }
};

// @desc    Get all maintenance requests
// @route   GET /api/v1/admin/maintenance
// @access  Private/Admin
exports.adminGetMaintenanceRequests = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        let query = {};
        if (status) query.status = status;

        const skip = (page - 1) * limit;
        const [requests, total] = await Promise.all([
            MaintenanceRequest.find(query)
                .populate('user', 'name email phone')
                .populate('product', 'name images')
                .sort('-createdAt')
                .skip(skip)
                .limit(+limit),
            MaintenanceRequest.countDocuments(query)
        ]);

        sendResponse(res, 200, true, 'Maintenance requests fetched', { 
            requests, 
            totalCount: total, 
            totalPages: Math.ceil(total / limit) 
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update maintenance request status
// @route   PUT /api/v1/admin/maintenance/:id/status
// @access  Private/Admin
exports.adminUpdateMaintenanceStatus = async (req, res, next) => {
    try {
        const { status, assignedTechnician, scheduledVisit, resolution, adminNotes } = req.body;

        const ticket = await MaintenanceRequest.findById(req.params.id);
        if (!ticket) {
            return sendResponse(res, 404, false, 'Maintenance ticket not found');
        }

        if (status && status !== ticket.status) {
            ticket.status = status;
            ticket.statusHistory.push({
                status,
                timestamp: new Date(),
                note: adminNotes || `Status updated to ${status.replace('-', ' ')} by Admin`
            });

            if (status === 'resolved') {
                ticket.resolution = {
                    notes: resolution?.notes || adminNotes || 'Issue resolved',
                    resolvedAt: new Date()
                };
            }
        }

        if (assignedTechnician) ticket.assignedTechnician = assignedTechnician;
        if (scheduledVisit) ticket.scheduledVisit = scheduledVisit;
        if (adminNotes) ticket.adminNotes = adminNotes;

        await ticket.save();

        sendResponse(res, 200, true, 'Maintenance ticket updated successfully', { ticket });
    } catch (error) {
        next(error);
    }
};

// @desc    Get platform settings
// @route   GET /api/v1/admin/settings
// @access  Private/Admin
exports.adminGetSettings = async (req, res, next) => {
    try {
        let settings = await PlatformSetting.findOne();
        if (!settings) {
            settings = await PlatformSetting.create({});
        }
        sendResponse(res, 200, true, 'Platform settings fetched', { settings });
    } catch (error) {
        next(error);
    }
};

// @desc    Update platform settings
// @route   PUT /api/v1/admin/settings
// @access  Private/Admin
exports.adminUpdateSettings = async (req, res, next) => {
    try {
        let settings = await PlatformSetting.findOne();
        if (!settings) {
            settings = new PlatformSetting(req.body);
        } else {
            Object.assign(settings, req.body);
        }
        await settings.save();
        sendResponse(res, 200, true, 'Platform settings updated', { settings });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new category
// @route   POST /api/v1/admin/categories
// @access  Private/Admin
exports.adminCreateCategory = async (req, res, next) => {
    try {
        const { name, description, icon } = req.body;
        const slug = name.toLowerCase().replace(/ /g, '-');
        const category = await Category.create({ name, description, icon, slug });
        sendResponse(res, 201, true, 'Category created', { category });
    } catch (error) {
        next(error);
    }
};

// @desc    Update category
// @route   PUT /api/v1/admin/categories/:id
// @access  Private/Admin
exports.adminUpdateCategory = async (req, res, next) => {
    try {
        const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!category) return sendResponse(res, 404, false, 'Category not found');
        sendResponse(res, 200, true, 'Category updated', { category });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete category
// @route   DELETE /api/v1/admin/categories/:id
// @access  Private/Admin
exports.adminDeleteCategory = async (req, res, next) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) return sendResponse(res, 404, false, 'Category not found');
        sendResponse(res, 200, true, 'Category deleted');
    } catch (error) {
        next(error);
    }
};
