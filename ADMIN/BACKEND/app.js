require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/AuthRoutes'));
app.use('/api/products', require('./routes/ProductRoutes'));
app.use('/api/subscription-plans', require('./routes/SubscriptionRoutes'));
app.use('/api/orders', require('./routes/OrderRoutes'));
app.use('/api/contact', require('./routes/ContactusRoutes'));
app.use('/api/callRequest',require('./routes/CallRequestRoutes'));

module.exports = app;
