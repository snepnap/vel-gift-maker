const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// UPI ID from environment variable (SECURE - not in code!)
const UPI_ID = process.env.UPI_ID;

if (!UPI_ID) {
    console.error('❌ ERROR: UPI_ID not set! Add it to .env file or Render environment.');
    process.exit(1);
}

app.use(cors());
app.use(bodyParser.json());

// Logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.use(express.static(path.join(__dirname, '../public')));

// Serve Templates
const templatesPath = path.resolve(__dirname, 'templates');
app.use('/templates', express.static(templatesPath));

// PRICING
const PRICING = {
    base_theme: 199,
    feature_gallery: 69,
    feature_music: 49,
    feature_timeline: 79,
    feature_quiz: 59,
    feature_gift: 89,
    feature_countdown: 39,
    feature_password: 29,
    feature_scratch: 99,
    feature_spin: 119,
    feature_memory: 109,
    feature_video: 149,
    feature_confetti: 49
};

// API: Health
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', env: process.env.NODE_ENV || 'development' });
});

// API: Get UPI Payment QR
app.post('/api/create-order', (req, res) => {
    const { features, theme, config, customerName, customerEmail } = req.body;

    // Calculate total
    let total = PRICING.base_theme;
    if (features && Array.isArray(features)) {
        features.forEach(f => {
            if (PRICING[f]) total += PRICING[f];
        });
    }

    // Generate order ID
    const orderId = 'VAL-' + Date.now().toString(36).toUpperCase();

    // Create UPI payment link
    const upiLink = `upi://pay?pa=${UPI_ID}&pn=ValentineGift&am=${total}&tn=Order_${orderId}&cu=INR`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`;

    // Save order as pending
    const dbPath = path.join(__dirname, 'orders.json');
    let orders = [];
    if (fs.existsSync(dbPath)) {
        try { orders = JSON.parse(fs.readFileSync(dbPath, 'utf8')); } catch (e) { }
    }

    orders.push({
        orderId,
        amount: total,
        customerName,
        customerEmail,
        theme,
        features,
        status: 'pending',
        createdAt: new Date()
    });

    fs.writeFileSync(dbPath, JSON.stringify(orders, null, 2));
    console.log(`[ORDER] Created ${orderId} - ₹${total}`);

    res.json({
        orderId,
        amount: total,
        upiId: UPI_ID,
        upiLink,
        qrUrl
    });
});

// API: Confirm Payment
app.post('/api/confirm-payment', (req, res) => {
    const { orderId, transactionId } = req.body;

    const dbPath = path.join(__dirname, 'orders.json');
    let orders = [];
    if (fs.existsSync(dbPath)) {
        orders = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    }

    const orderIndex = orders.findIndex(o => o.orderId === orderId);
    if (orderIndex >= 0) {
        orders[orderIndex].status = 'paid';
        orders[orderIndex].transactionId = transactionId;
        orders[orderIndex].paidAt = new Date();
        fs.writeFileSync(dbPath, JSON.stringify(orders, null, 2));

        console.log(`[PAID] Order ${orderId} confirmed with txn ${transactionId}`);
        res.json({ success: true, orderId });
    } else {
        res.status(404).json({ error: 'Order not found' });
    }
});

// API: Get orders (admin)
app.get('/api/orders', (req, res) => {
    const dbPath = path.join(__dirname, 'orders.json');
    if (fs.existsSync(dbPath)) {
        res.json(JSON.parse(fs.readFileSync(dbPath, 'utf8')));
    } else {
        res.json([]);
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Valentine Platform running on port ${PORT}`);
    console.log(`💰 UPI ID: ${UPI_ID.substring(0, 4)}****${UPI_ID.slice(-4)}`); // Partially hidden in logs
});
