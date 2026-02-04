const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const UPI_ID = process.env.UPI_ID;
if (!UPI_ID) {
    console.error('❌ ERROR: UPI_ID not set!');
    process.exit(1);
}

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.use(express.static(path.join(__dirname, '../public')));

const templatesPath = path.resolve(__dirname, 'templates');
app.use('/templates', express.static(templatesPath));

// LOWER PRICES (More affordable!)
const PRICING = {
    base_theme: 49,          // Was 199 → Now ₹49
    feature_gallery: 19,     // Photo Gallery
    feature_music: 19,       // Custom Music
    feature_timeline: 29,    // Relationship Timeline
    feature_quiz: 19,        // Love Quiz
    feature_gift: 29,        // Virtual Gift
    feature_countdown: 9,    // Countdown Timer
    feature_password: 9,     // Password Protection
    feature_scratch: 39,     // Scratch Card
    feature_spin: 39,        // Spin Wheel
    feature_memory: 39,      // Memory Game
    feature_video: 49,       // Video Message
    feature_confetti: 9      // Confetti Burst
};

// Helper: Generate short unique ID
function generateId() {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
}

// Helper: Get DB path
function getDbPath(name) {
    return path.join(__dirname, `${name}.json`);
}

// Helper: Read JSON file
function readDb(name) {
    const dbPath = getDbPath(name);
    if (fs.existsSync(dbPath)) {
        try { return JSON.parse(fs.readFileSync(dbPath, 'utf8')); }
        catch (e) { return []; }
    }
    return [];
}

// Helper: Write JSON file
function writeDb(name, data) {
    fs.writeFileSync(getDbPath(name), JSON.stringify(data, null, 2));
}

// API: Health
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', env: process.env.NODE_ENV || 'development' });
});

// API: Create Order & Get UPI QR
app.post('/api/create-order', (req, res) => {
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

    const orders = readDb('orders');
    orders.push({
        orderId,
        amount: total,
        customerName: customerName || 'Guest',
        theme,
        features,
        config,
        status: 'pending',
        createdAt: new Date()
    });
    writeDb('orders', orders);

    console.log(`[ORDER] ${orderId} - ₹${total}`);

    res.json({ orderId, amount: total, upiId: UPI_ID, upiLink, qrUrl });
});

// API: Confirm Payment & Generate Share Link
app.post('/api/confirm-payment', (req, res) => {
    const { orderId, transactionId } = req.body;

    if (!transactionId || transactionId.length < 6) {
        return res.status(400).json({ error: 'Invalid transaction ID' });
    }

    const orders = readDb('orders');
    const orderIndex = orders.findIndex(o => o.orderId === orderId);

    if (orderIndex < 0) {
        return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[orderIndex];

    // Generate unique valentine ID
    const valentineId = generateId();

    // Save valentine page
    const valentines = readDb('valentines');
    valentines.push({
        id: valentineId,
        orderId: orderId,
        theme: order.theme,
        config: order.config,
        features: order.features,
        createdAt: new Date(),
        views: 0
    });
    writeDb('valentines', valentines);

    // Update order
    orders[orderIndex].status = 'paid';
    orders[orderIndex].transactionId = transactionId;
    orders[orderIndex].valentineId = valentineId;
    orders[orderIndex].paidAt = new Date();
    writeDb('orders', orders);

    console.log(`[PAID] ${orderId} → Valentine: ${valentineId}`);

    res.json({
        success: true,
        orderId,
        valentineId,
        shareUrl: `/v/${valentineId}`,
        message: 'Payment confirmed! Share this link with your loved one! 💕'
    });
});

// SERVE VALENTINE PAGE
app.get('/v/:id', (req, res) => {
    const valentines = readDb('valentines');
    const valentine = valentines.find(v => v.id === req.params.id);

    if (!valentine) {
        return res.status(404).send('<h1>Valentine not found 💔</h1><p>This link may have expired or is invalid.</p>');
    }

    // Increment view count
    const index = valentines.findIndex(v => v.id === req.params.id);
    valentines[index].views = (valentines[index].views || 0) + 1;
    writeDb('valentines', valentines);

    // Serve template with embedded config
    const templatePath = path.join(templatesPath, valentine.theme, 'index.html');
    if (fs.existsSync(templatePath)) {
        let html = fs.readFileSync(templatePath, 'utf8');

        // Inject the saved config
        const configScript = `<script>
            window.VALENTINE_CONFIG = ${JSON.stringify(valentine.config)};
            window.VALENTINE_FEATURES = ${JSON.stringify(valentine.features)};
        </script>`;

        html = html.replace('</head>', configScript + '</head>');
        res.send(html);
    } else {
        res.redirect(`/templates/${valentine.theme}/index.html`);
    }
});

// API: Admin - Get all orders
app.get('/api/orders', (req, res) => {
    res.json(readDb('orders'));
});

// API: Admin - Get stats
app.get('/api/stats', (req, res) => {
    const orders = readDb('orders');
    const valentines = readDb('valentines');
    const paidOrders = orders.filter(o => o.status === 'paid');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.amount, 0);

    res.json({
        totalOrders: orders.length,
        paidOrders: paidOrders.length,
        pendingOrders: orders.length - paidOrders.length,
        totalValentines: valentines.length,
        totalRevenue: totalRevenue,
        totalViews: valentines.reduce((sum, v) => sum + (v.views || 0), 0)
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Valentine Platform running on port ${PORT}`);
    console.log(`💰 UPI: ${UPI_ID.substring(0, 4)}****`);
    console.log(`📊 Pricing: Base ₹${PRICING.base_theme}`);
});
