// Load environment variables from .env file
const dotenv = require('dotenv');
dotenv.config();

// Core Modules and Dependencies
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./middlewares/requestLogger');

// Import Routes
const adminRoutes = require('./routes/adminRoutes');

// Initialize Express App
const app = express();

// Middleware: Secure HTTP Headers
app.use(helmet());

// Middleware: CORS - Allow all origins (can be restricted later)
app.use(cors({
    origin: '*',
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
}));

// Middleware: Parse incoming JSON
app.use(express.json());

// Logger Middleware for Incoming Requests
app.use((req, res, next) => {
    console.log(`${req.method} request for '${req.url}'`);
    next();
});

// Routes
app.use('/api/admin', adminRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'An error occurred, please try again later.',
    });
});

// Create HTTP Server
const httpServer = http.createServer(app);

// Set Port
const HTTP_PORT = process.env.HTTP_PORT || 6767;

// Start Server
httpServer.listen(HTTP_PORT, () => {
    const logMessage = `HTTP Server listening on port ${HTTP_PORT}`;
    console.log(logMessage);
    logger.info(logMessage);
});
