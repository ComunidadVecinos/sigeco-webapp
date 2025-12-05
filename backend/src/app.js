const express = require('express');
const cookieParser = require('cookie-parser');

const authRoutes = require('./modules/auth/auth.routes');
const itemsRoutes = require('./modules/items/items.routes');

const app = express();

app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Modular routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);

// Fallback
app.get('/', (req, res) => {
  res.send('Backend is running');
});

module.exports = app;
