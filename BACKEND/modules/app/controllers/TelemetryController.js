const database = require('../../../config/db');
const { ObjectId } = require("mongodb");

/**
 * Get the most recent telemetry data for all devices or a specific device
 * Data is updated every 8 seconds from MQTT
 */
const getRecentTelemetry = async (req, res) => {
    try {
        const { deviceId, limit = 10 } = req.query;
        
        const db = await database.connectToDatabase();
        const featureValuesCollection = db.collection('device_feature_values');
        
        let query = { topicType: 'telemetry' };
        
        // If deviceId is provided, filter by specific device
        if (deviceId) {
            query.deviceId = deviceId;
        }
        
        // Get the most recent telemetry data
        const telemetryData = await featureValuesCollection
            .find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .toArray();
        
        if (!telemetryData || telemetryData.length === 0) {
            return res.status(404).json({
                status: 'Failed',
                message: 'No telemetry data found'
            });
        }
        
        return res.status(200).json({
            status: 'Success',
            message: 'Recent telemetry data fetched successfully',
            data: telemetryData,
            count: telemetryData.length
        });
        
    } catch (error) {
        console.error('Error in getRecentTelemetry:', error);
        return res.status(500).json({
            status: 'Failed',
            message: 'Internal Server Error'
        });
    }
};

/**
 * Get the latest telemetry data for each unique device
 * Returns one record per device (the most recent one)
 */
const getLatestTelemetryPerDevice = async (req, res) => {
    try {
        const db = await database.connectToDatabase();
        const featureValuesCollection = db.collection('device_feature_values');
        
        // Aggregation pipeline to get the latest telemetry for each device
        const pipeline = [
            {
                $match: { topicType: 'telemetry' }
            },
            {
                $sort: { deviceId: 1, timestamp: -1 }
            },
            {
                $group: {
                    _id: '$deviceId',
                    latestData: { $first: '$$ROOT' }
                }
            },
            {
                $replaceRoot: { newRoot: '$latestData' }
            },
            {
                $sort: { timestamp: -1 }
            }
        ];
        
        const latestTelemetryData = await featureValuesCollection
            .aggregate(pipeline)
            .toArray();
        
        if (!latestTelemetryData || latestTelemetryData.length === 0) {
            return res.status(404).json({
                status: 'Failed',
                message: 'No telemetry data found'
            });
        }
        
        return res.status(200).json({
            status: 'Success',
            message: 'Latest telemetry data per device fetched successfully',
            data: latestTelemetryData,
            count: latestTelemetryData.length
        });
        
    } catch (error) {
        console.error('Error in getLatestTelemetryPerDevice:', error);
        return res.status(500).json({
            status: 'Failed',
            message: 'Internal Server Error'
        });
    }
};

/**
 * Get telemetry data for a specific device within a time range
 */
const getTelemetryByTimeRange = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { startDate, endDate, limit = 100 } = req.query;
        
        if (!deviceId) {
            return res.status(400).json({
                status: 'Failed',
                message: 'Device ID is required'
            });
        }
        
        const db = await database.connectToDatabase();
        const featureValuesCollection = db.collection('device_feature_values');
        
        let query = {
            deviceId: deviceId,
            topicType: 'telemetry'
        };
        
        // Add time range filter if provided
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) {
                query.timestamp.$gte = new Date(startDate);
            }
            if (endDate) {
                query.timestamp.$lte = new Date(endDate);
            }
        }
        
        const telemetryData = await featureValuesCollection
            .find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .toArray();
        
        if (!telemetryData || telemetryData.length === 0) {
            return res.status(404).json({
                status: 'Failed',
                message: `No telemetry data found for device ${deviceId}`
            });
        }
        
        return res.status(200).json({
            status: 'Success',
            message: `Telemetry data for device ${deviceId} fetched successfully`,
            data: telemetryData,
            count: telemetryData.length,
            deviceId: deviceId
        });
        
    } catch (error) {
        console.error('Error in getTelemetryByTimeRange:', error);
        return res.status(500).json({
            status: 'Failed',
            message: 'Internal Server Error'
        });
    }
};

/**
 * Get real-time telemetry status for dashboard
 * Returns current status of all active devices
 */
const getTelemetryDashboard = async (req, res) => {
    try {
        const db = await database.connectToDatabase();
        const deviceStatusCollection = db.collection('device_status');
        
        // Get current status of all devices with telemetry data
        const dashboardData = await deviceStatusCollection
            .find({ 
                topicType: 'telemetry',
                timestamp: { 
                    $gte: new Date(Date.now() - 60000) // Last 1 minute
                }
            })
            .sort({ timestamp: -1 })
            .toArray();
        
        // Calculate summary statistics
        const summary = {
            totalDevices: dashboardData.length,
            activeDevices: dashboardData.filter(d => d.status === 'NORMAL').length,
            devicesWithAlerts: dashboardData.filter(d => d.errorCode !== 'NoError').length,
            averageWaterUsage: dashboardData.length > 0 ? 
                (dashboardData.reduce((sum, d) => sum + (d.totalWaterUsed || 0), 0) / dashboardData.length).toFixed(2) : 0
        };
        
        return res.status(200).json({
            status: 'Success',
            message: 'Telemetry dashboard data fetched successfully',
            summary: summary,
            devices: dashboardData,
            lastUpdated: new Date()
        });
        
    } catch (error) {
        console.error('Error in getTelemetryDashboard:', error);
        return res.status(500).json({
            status: 'Failed',
            message: 'Internal Server Error'
        });
    }
};

/**
 * Get the latest single telemetry record for a specific device
 * Returns only 1 record - the most recent data for the device
 */
const getLatestSingleTelemetry = async (req, res) => {
    try {
        const { deviceId } = req.params;
        
        if (!deviceId) {
            return res.status(400).json({
                status: 'Failed',
                message: 'Device ID is required'
            });
        }
        
        const db = await database.connectToDatabase();
        const featureValuesCollection = db.collection('device_feature_values');
        
        // Get the most recent single record for the specific device
        const latestRecord = await featureValuesCollection
            .findOne(
                { 
                    deviceId: deviceId, 
                    topicType: 'telemetry' 
                },
                { 
                    sort: { timestamp: -1 } 
                }
            );
        
        if (!latestRecord) {
            return res.status(404).json({
                status: 'Failed',
                message: `No telemetry data found for device ${deviceId}`
            });
        }
        
        return res.status(200).json({
            status: 'Success',
            message: `Latest telemetry data for device ${deviceId} fetched successfully`,
            data: latestRecord,
            deviceId: deviceId,
            timestamp: latestRecord.timestamp
        });
        
    } catch (error) {
        console.error('Error in getLatestSingleTelemetry:', error);
        return res.status(500).json({
            status: 'Failed',
            message: 'Internal Server Error'
        });
    }
};

module.exports = {
    getRecentTelemetry,
    getLatestTelemetryPerDevice,
    getTelemetryByTimeRange,
    getTelemetryDashboard,
    getLatestSingleTelemetry
};