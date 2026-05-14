const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_mock');
const Order = require('../models/Order');
const User = require('../models/User');
const sendResponse = require('../utils/sendResponse');

// @desc    Create Stripe Checkout Session
// @route   POST /api/v1/payments/create-checkout
// @access  Private
exports.createCheckoutSession = async (req, res, next) => {
    try {
        const { orderId } = req.body;
        const order = await Order.findById(orderId).populate('items.product');

        if (!order) {
            return sendResponse(res, 404, false, 'Order not found');
        }

        // Use mock data if Stripe key is not set
        if (!process.env.STRIPE_SECRET_KEY) {
            return sendResponse(res, 200, true, 'Mock checkout created', {
                checkoutUrl: `/pages/checkout-success.html?orderId=${orderId}`,
                isMock: true
            });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: order.items.map(item => ({
                price_data: {
                    currency: 'inr',
                    product_data: {
                        name: item.product.name,
                        images: item.product.images
                    },
                    unit_amount: item.price * 100 // Stripe expects amount in paise
                },
                quantity: item.quantity
            })),
            mode: 'payment',
            success_url: `${req.headers.origin}/pages/checkout-success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin}/pages/cart.html`,
            client_reference_id: orderId.toString(),
            customer_email: req.user.email
        });

        sendResponse(res, 200, true, 'Checkout session created', { checkoutUrl: session.url });
    } catch (error) {
        next(error);
    }
};

// @desc    Stripe Webhook
// @route   POST /api/v1/payments/webhook
// @access  Public
exports.handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const orderId = session.client_reference_id;

        await Order.findByIdAndUpdate(orderId, { 
            paymentStatus: 'paid',
            status: 'processing'
        });
    }

    res.json({ received: true });
};
