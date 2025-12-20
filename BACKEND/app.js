// Load environment variables from .env file
const dotenv = require('dotenv');
dotenv.config();

// Core Modules and Dependencies
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./middlewares/requestLogger');
const { connectToDatabase } = require('./config/db');
const cron = require('node-cron');
const { autoAssignPendingTasks, autoAssignPendingInstallations, autoReassignOverdueTasks, autoReassignRejectedTasksImmediate, autoReassignForwardedTasksImmediate, autoReassignTimeBasedTasks } = require('./modules/admin/services/autoAssignmentService');
const fs = require('fs'); //  Add this line
// require('./mqtt/publisher');

// Import Routes
const adminRoutes = require('./routes/adminRoutes');
const websiteRoutes = require('./routes/websiteRoutes');
const appRoutes = require('./routes/appRoutes');

// Initialize MQTT Client for telemetry data collection
const mqttClient = require('./mqtt/mqttClient');
const logRoutes = require('./mqtt/routes/logs');
const uploadRoutes = require('./mqtt/routes/upload');

const path = require('path');

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

// Serve static files from public directory
app.use('/upload', cors(), express.static(path.join(__dirname, '..', 'upload')));

// Logger Middleware for Incoming Requests
app.use((req, res, next) => {
    console.log(`${req.method} request for '${req.url}'`);
    next();
});

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/website', websiteRoutes);
app.use('/api/app',appRoutes);


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

// MQTT start
app.use(express.static('public'));

//  Serve firmware files locally
app.use('/firmware', express.static(path.join(__dirname, './mqtt/firmware')));

app.use('/api', logRoutes);
app.use('/api', uploadRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'mqtt', 'public', 'index.html'));
});

app.get('/view/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'firmware', req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).send('File not found');

    const data = fs.readFileSync(filePath);
    res.setHeader('Content-Type', 'text/plain');
    res.send(data.toString('hex')); // shows binary as hex
});

mqttClient.on('connect', () => console.log('Connected to MQTT broker'));
// mqtt end

// Start Server with Database Connection
connectToDatabase()
    .then(async () => {
        httpServer.listen(HTTP_PORT, "0.0.0.0", () => {
            const logMessage = `HTTP Server listening on port ${HTTP_PORT}`;
            console.log(logMessage);
            logger.info(logMessage);
        });

        // Run auto-assign pending tasks once on startup
        console.log('Running initial auto-assign pending tasks on startup...');
        await autoAssignPendingTasks();

        // Run auto-assign pending installations once on startup
        console.log('Running initial auto-assign pending installations on startup...');
        await autoAssignPendingInstallations();

        // Schedule auto-assignment of pending tasks every 5 minutes
        cron.schedule('0 */5 * * * *', async () => {
            console.log('Running auto-assignment cycle...');

            try {
                console.log('  → autoAssignPendingTasks');
                await autoAssignPendingTasks();

                console.log('  → autoAssignPendingInstallations');
                await autoAssignPendingInstallations();

                console.log('  → autoReassignTimeBasedTasks');
                await autoReassignTimeBasedTasks();

                console.log('  → autoReassignOverdueTasks');
                await autoReassignOverdueTasks();

                console.log('  → autoReassignRejectedTasksImmediate');
                await autoReassignRejectedTasksImmediate();

                console.log('  → autoReassignForwardedTasksImmediate');
                await autoReassignForwardedTasksImmediate();

                console.log('✅ Completed auto-assignment cycle');
            } catch (cronError) {
                console.error('❌ Auto-assignment cycle failed:', cronError);
            }
        });
    })
    .catch(err => {
        console.error('Failed to connect to the database:', err);
        process.exit(1);
    });
