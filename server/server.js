const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

// MongoDB
const connectDB = require('./config/db');
const User = require('./models/User');
const Order = require('./models/Order');
const Valentine = require('./models/Valentine');

// Routes
const authRoutes = require('./routes/auth');
const { auth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Check required env vars
const UPI_ID = process.env.UPI_ID;
const JWT_SECRET = process.env.JWT_SECRET || 'valentine-secret-2024';
const ADMIN_KEY = process.env.ADMIN_KEY || 'admin-secret-2024';

if (!UPI_ID) {
    console.error('❌ UPI_ID not set!');
    process.exit(1);
}

// Connect to MongoDB
if (process.env.MONGODB_URI) {
    connectDB();
} else {
    console.log('⚠️ MONGODB_URI not set, using file-based storage');
}

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(auth);

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${req.user ? `(${req.user.email})` : ''}`);
    next();
});

app.use(express.static(path.join(__dirname, '../public')));

const templatesPath = path.resolve(__dirname, 'templates');
app.use('/templates', express.static(templatesPath));

// Auth Routes
app.use('/api/auth', authRoutes);

// PRICING
const PRICING = {
    base_theme: 20,
    feature_gallery: 9,
    feature_music: 9,
    feature_timeline: 15,
    feature_quiz: 9,
    feature_gift: 15,
    feature_countdown: 5,
    feature_password: 5,
    feature_scratch: 19,
    feature_spin: 19,
    feature_memory: 19,
    feature_video: 25,
    feature_confetti: 5
};

// Helper: Generate ID
function generateId() {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
}

// API: Health
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        db: process.env.MONGODB_URI ? 'mongodb' : 'file',
        user: req.user ? req.user.email : null
    });
});

// API: Create Order (Just creates order, no valentine yet)
app.post('/api/create-order', async (req, res) => {
    try {
        const { features, theme, config } = req.body;

        let total = PRICING.base_theme;
        if (features && Array.isArray(features)) {
            features.forEach(f => {
                if (PRICING[f]) total += PRICING[f];
            });
        }

        const orderId = 'VAL-' + generateId();
        const upiLink = `upi://pay?pa=${UPI_ID}&pn=ValentineGift&am=${total}&tn=Order_${orderId}&cu=INR`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`;

        // Save order (pending, no valentine created yet)
        if (process.env.MONGODB_URI) {
            await Order.create({
                orderId,
                user: req.user?._id,
                amount: total,
                theme,
                features,
                config, // Save config with order for later
                status: 'pending'
            });
        }

        console.log(`[ORDER] ${orderId} - ₹${total} ${req.user ? `by ${req.user.email}` : ''}`);

        res.json({ orderId, amount: total, upiId: UPI_ID, upiLink, qrUrl });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Order creation failed' });
    }
});

// API: Submit Payment (User claims they paid - goes to PENDING VERIFICATION)
app.post('/api/confirm-payment', async (req, res) => {
    try {
        const { orderId, transactionId, config } = req.body;

        if (!transactionId || transactionId.length < 6) {
            return res.status(400).json({ error: 'Invalid transaction ID' });
        }

        if (process.env.MONGODB_URI) {
            const order = await Order.findOne({ orderId });
            if (!order) {
                return res.status(404).json({ error: 'Order not found' });
            }

            // Mark as "awaiting verification" NOT "paid"
            order.status = 'awaiting_verification';
            order.transactionId = transactionId;
            order.config = config || order.config;
            order.submittedAt = new Date();
            await order.save();
        }

        console.log(`[PENDING] ${orderId} - Transaction: ${transactionId} (awaiting verification)`);

        // Show user that payment is being verified
        res.json({
            success: true,
            status: 'pending_verification',
            orderId,
            message: '✅ Payment submitted! Your Valentine link will be sent to your email within 1 hour after verification. You can also check status on our WhatsApp: +91 8709157822'
        });
    } catch (error) {
        console.error('Confirm payment error:', error);
        res.status(500).json({ error: 'Payment submission failed' });
    }
});

// API: ADMIN - Verify payment and create valentine
app.post('/api/admin/verify-payment', async (req, res) => {
    try {
        const { orderId, adminKey } = req.body;

        // Simple admin key check
        if (adminKey !== ADMIN_KEY) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (process.env.MONGODB_URI) {
            const order = await Order.findOne({ orderId });
            if (!order) {
                return res.status(404).json({ error: 'Order not found' });
            }

            if (order.status === 'paid') {
                return res.json({ success: true, message: 'Already verified', valentineId: order.valentineId });
            }

            // Generate valentine link
            const valentineId = generateId();

            // Create valentine
            await Valentine.create({
                valentineId,
                user: order.user,
                orderId,
                theme: order.theme,
                config: order.config || {},
                features: order.features
            });

            // Update order
            order.status = 'paid';
            order.valentineId = valentineId;
            order.paidAt = new Date();
            await order.save();

            console.log(`[VERIFIED] ${orderId} → Valentine: ${valentineId}`);

            res.json({
                success: true,
                orderId,
                valentineId,
                shareUrl: `/v/${valentineId}`,
                message: 'Payment verified! Valentine link created.'
            });
        } else {
            res.status(500).json({ error: 'MongoDB required' });
        }
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
});

// API: ADMIN - Test publish (bypass payment for testing)
app.post('/api/admin/test-publish', async (req, res) => {
    try {
        const { features, theme, config, adminKey } = req.body;

        if (adminKey !== ADMIN_KEY) {
            return res.status(401).json({ error: 'Unauthorized - Invalid admin key' });
        }

        const valentineId = 'TEST-' + generateId();
        const baseUrl = `${req.protocol}://${req.get('host')}`;

        if (process.env.MONGODB_URI) {
            // Create valentine directly (no order/payment)
            await Valentine.create({
                valentineId,
                user: req.user?._id,
                orderId: 'ADMIN-TEST',
                theme: theme || 'universal',
                config: config || {},
                features: features || []
            });
        }

        console.log(`[ADMIN-TEST] Created test valentine: ${valentineId}`);

        res.json({
            success: true,
            valentineId,
            valentineUrl: `${baseUrl}/v/${valentineId}`,
            shareUrl: `/v/${valentineId}`,
            message: '🧪 Test valentine created!'
        });
    } catch (error) {
        console.error('Admin test publish error:', error);
        res.status(500).json({ error: 'Test publish failed: ' + error.message });
    }
});


// API: ADMIN - Get pending payments
app.get('/api/admin/pending', async (req, res) => {
    const adminKey = req.query.key || req.headers['x-admin-key'];

    if (adminKey !== ADMIN_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        if (process.env.MONGODB_URI) {
            const pendingOrders = await Order.find({ status: 'awaiting_verification' }).sort({ submittedAt: -1 });
            res.json(pendingOrders);
        } else {
            res.json([]);
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch pending orders' });
    }
});

// API: Check order status (for user to check)
app.get('/api/order-status/:orderId', async (req, res) => {
    try {
        if (process.env.MONGODB_URI) {
            const order = await Order.findOne({ orderId: req.params.orderId });
            if (!order) {
                return res.status(404).json({ error: 'Order not found' });
            }

            res.json({
                orderId: order.orderId,
                status: order.status,
                amount: order.amount,
                valentineId: order.valentineId || null,
                shareUrl: order.valentineId ? `/v/${order.valentineId}` : null
            });
        } else {
            res.status(404).json({ error: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to check status' });
    }
});

// SERVE VALENTINE PAGE (Only for verified/paid orders)
app.get('/v/:id', async (req, res) => {
    try {
        let valentine;

        if (process.env.MONGODB_URI) {
            valentine = await Valentine.findOne({ valentineId: req.params.id });
            if (valentine) {
                valentine.views += 1;
                await valentine.save();
            }
        }

        if (!valentine) {
            return res.status(404).send(`
                <html>
                <head><title>Valentine Not Found</title></head>
                <body style="font-family: system-ui; text-align: center; padding: 100px; background: linear-gradient(135deg, #0f0c29, #302b63); color: white;">
                    <h1>💔 Valentine Not Found</h1>
                    <p>This link may not be verified yet or is invalid.</p>
                    <p style="color: #a1a1aa; font-size: 14px;">If you just paid, please wait for verification (up to 1 hour).</p>
                    <a href="/" style="color: #f43f5e;">Create Your Own →</a>
                </body>
                </html>
            `);
        }

        const templatePath = path.join(templatesPath, valentine.theme, 'index.html');
        if (fs.existsSync(templatePath)) {
            let html = fs.readFileSync(templatePath, 'utf8');

            const configScript = `<script>
                window.VALENTINE_CONFIG = ${JSON.stringify(valentine.config)};
                window.VALENTINE_FEATURES = ${JSON.stringify(valentine.features)};
            </script>`;

            html = html.replace('</head>', configScript + '</head>');
            res.send(html);
        } else {
            res.redirect(`/templates/${valentine.theme}/index.html`);
        }
    } catch (error) {
        console.error('Valentine page error:', error);
        res.status(500).send('Error loading valentine');
    }
});

// API: Get user's valentines
app.get('/api/my-valentines', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Login required' });
    }

    try {
        const valentines = await Valentine.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(valentines);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch valentines' });
    }
});

// API: Get user's orders
app.get('/api/my-orders', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Login required' });
    }

    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// API: Admin stats
app.get('/api/stats', async (req, res) => {
    try {
        if (process.env.MONGODB_URI) {
            const totalOrders = await Order.countDocuments();
            const paidOrders = await Order.countDocuments({ status: 'paid' });
            const pendingOrders = await Order.countDocuments({ status: 'awaiting_verification' });
            const totalValentines = await Valentine.countDocuments();
            const totalUsers = await User.countDocuments();

            const paidOrdersData = await Order.find({ status: 'paid' });
            const totalRevenue = paidOrdersData.reduce((sum, o) => sum + o.amount, 0);

            const valentines = await Valentine.find();
            const totalViews = valentines.reduce((sum, v) => sum + (v.views || 0), 0);

            res.json({
                totalOrders,
                paidOrders,
                pendingOrders,
                totalValentines,
                totalUsers,
                totalRevenue,
                totalViews
            });
        } else {
            res.json({ message: 'Stats require MongoDB' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Stats failed' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Valentine Platform running on port ${PORT}`);
    console.log(`💰 UPI: ${UPI_ID.substring(0, 4)}****`);
    console.log(`🔐 JWT: ${JWT_SECRET ? 'Configured' : 'Using default'}`);
    console.log(`📊 DB: ${process.env.MONGODB_URI ? 'MongoDB' : 'File-based'}`);
});
