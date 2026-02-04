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
app.use(bodyParser.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(auth); // Add user to req if logged in

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
    base_theme: 49,
    feature_gallery: 19,
    feature_music: 19,
    feature_timeline: 29,
    feature_quiz: 19,
    feature_gift: 29,
    feature_countdown: 9,
    feature_password: 9,
    feature_scratch: 39,
    feature_spin: 39,
    feature_memory: 39,
    feature_video: 49,
    feature_confetti: 9
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

// API: Create Order
app.post('/api/create-order', async (req, res) => {
    try {
        const { features, theme, config, customerName } = req.body;

        let total = PRICING.base_theme;
        if (features && Array.isArray(features)) {
            features.forEach(f => {
                if (PRICING[f]) total += PRICING[f];
            });
        }

        const orderId = 'VAL-' + generateId();
        const upiLink = `upi://pay?pa=${UPI_ID}&pn=ValentineGift&am=${total}&tn=Order_${orderId}&cu=INR`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`;

        // Save order
        if (process.env.MONGODB_URI) {
            await Order.create({
                orderId,
                user: req.user?._id,
                amount: total,
                theme,
                features,
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

// API: Confirm Payment
app.post('/api/confirm-payment', async (req, res) => {
    try {
        const { orderId, transactionId, config } = req.body;

        if (!transactionId || transactionId.length < 6) {
            return res.status(400).json({ error: 'Invalid transaction ID' });
        }

        const valentineId = generateId();

        if (process.env.MONGODB_URI) {
            // Find and update order
            const order = await Order.findOne({ orderId });
            if (!order) {
                return res.status(404).json({ error: 'Order not found' });
            }

            order.status = 'paid';
            order.transactionId = transactionId;
            order.valentineId = valentineId;
            order.paidAt = new Date();
            await order.save();

            // Create valentine
            await Valentine.create({
                valentineId,
                user: req.user?._id,
                orderId,
                theme: order.theme,
                config: config || {},
                features: order.features
            });
        }

        console.log(`[PAID] ${orderId} → Valentine: ${valentineId}`);

        res.json({
            success: true,
            orderId,
            valentineId,
            shareUrl: `/v/${valentineId}`,
            message: 'Payment confirmed! Share this link with your loved one! 💕'
        });
    } catch (error) {
        console.error('Confirm payment error:', error);
        res.status(500).json({ error: 'Payment confirmation failed' });
    }
});

// SERVE VALENTINE PAGE
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
                    <p>This link may have expired or is invalid.</p>
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
            const totalValentines = await Valentine.countDocuments();
            const totalUsers = await User.countDocuments();

            const paidOrdersData = await Order.find({ status: 'paid' });
            const totalRevenue = paidOrdersData.reduce((sum, o) => sum + o.amount, 0);

            const valentines = await Valentine.find();
            const totalViews = valentines.reduce((sum, v) => sum + (v.views || 0), 0);

            res.json({
                totalOrders,
                paidOrders,
                pendingOrders: totalOrders - paidOrders,
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
