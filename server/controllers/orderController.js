const Order = require('../models/Order');
const Product = require('../models/Product');
const Rental = require('../models/Rental');
const sendResponse = require('../utils/sendResponse');

// Helper to add months to a date
const addMonths = (date, months) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
};

// @desc    Create new order
// @route   POST /api/v1/orders
// @access  Private
exports.createOrder = async (req, res, next) => {
    try {
        const { items, deliveryAddress, scheduledDelivery, paymentMethod } = req.body;

        // 1. Validation
        if (!items || !Array.isArray(items) || items.length === 0) {
            return sendResponse(res, 400, false, 'Cart is empty');
        }

        if (!deliveryAddress || !deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.pincode) {
            return sendResponse(res, 400, false, 'Delivery address is required');
        }

        const deliveryDate = new Date(scheduledDelivery.date);
        const minDate = new Date();
        minDate.setDate(minDate.getDate() + 2); // At least 2 days from now

        if (deliveryDate < minDate) {
            return sendResponse(res, 400, false, 'Delivery must be scheduled at least 2 days in advance');
        }

        // 2. Server-side validation and pricing calculation
        let subtotal = 0;
        let totalDeposit = 0;
        const validatedItems = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return sendResponse(res, 400, false, `Product not found: ${item.name}`);
            }

            if (product.availableUnits < item.quantity) {
                return sendResponse(res, 400, false, `Only ${product.availableUnits} units available for ${product.name}`);
            }

            // Find the selected plan in the product's plans to verify price
            const plan = product.rentalPlans.find(p => p.duration === item.selectedPlan.duration);
            if (!plan) {
                return sendResponse(res, 400, false, `Invalid plan selected for ${product.name}`);
            }

            subtotal += plan.monthlyPrice * item.quantity;
            totalDeposit += product.securityDeposit * item.quantity;

            validatedItems.push({
                product: product._id,
                productName: product.name,
                productImage: product.images[0],
                selectedPlan: {
                    duration: plan.duration,
                    label: plan.label,
                    monthlyPrice: plan.monthlyPrice,
                    totalPrice: plan.totalPrice
                },
                quantity: item.quantity,
                securityDeposit: product.securityDeposit
            });
        }

        const deliveryCharge = subtotal > 2000 ? 0 : 499;
        const grandTotal = subtotal + totalDeposit + deliveryCharge;

        // 3. Create Order
        const order = new Order({
            user: req.user._id,
            items: validatedItems,
            pricing: {
                subtotal,
                totalDeposit,
                deliveryCharge,
                grandTotal
            },
            deliveryAddress,
            scheduledDelivery,
            paymentMethod,
            paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
            statusHistory: [{
                status: 'placed',
                timestamp: new Date(),
                note: 'Order placed by user',
                updatedBy: req.user._id
            }]
        });

        await order.save();

        // 4. Update Stock and Create Rentals
        for (const item of validatedItems) {
            // Decrease stock
            await Product.findByIdAndUpdate(item.product, {
                $inc: { availableUnits: -item.quantity }
            });

            // Create Rental record
            const startDate = new Date(scheduledDelivery.date);
            const endDate = addMonths(startDate, item.selectedPlan.duration);

            await Rental.create({
                order: order._id,
                user: req.user._id,
                product: item.product,
                rentalPlan: item.selectedPlan,
                startDate,
                endDate,
                status: 'active',
                nextPaymentDate: addMonths(startDate, 1)
            });
        }

        sendResponse(res, 201, true, 'Order placed successfully', {
            order: {
                _id: order._id,
                orderNumber: order.orderNumber,
                pricing: order.pricing,
                scheduledDelivery: order.scheduledDelivery
            }
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get user's orders
// @route   GET /api/v1/orders/my-orders
// @access  Private
exports.getMyOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .sort('-createdAt')
            .populate('items.product', 'name images brand')
            .select('-__v');

        sendResponse(res, 200, true, 'Orders fetched successfully', { orders });
    } catch (error) {
        next(error);
    }
};
