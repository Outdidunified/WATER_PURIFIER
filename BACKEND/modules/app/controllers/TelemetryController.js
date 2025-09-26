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
//  */
// const getLatestSingleTelemetry = async (req, res) => {
//     try {
//         const { deviceId } = req.params;
        
//         if (!deviceId) {
//             return res.status(400).json({
//                 status: 'Failed',
//                 message: 'Device ID is required'
//             });
//         }
        
//         const db = await database.connectToDatabase();
//         const featureValuesCollection = db.collection('device_feature_values');
        
//         // Get the most recent single record for the specific device
//         const latestRecord = await featureValuesCollection
//             .findOne(
//                 { 
//                     deviceId: deviceId, 
//                     topicType: 'telemetry' 
//                 },
//                 { 
//                     sort: { timestamp: -1 } 
//                 }
//             );
        
//         if (!latestRecord) {
//             return res.status(404).json({
//                 status: 'Failed',
//                 message: `No telemetry data found for device ${deviceId}`
//             });
//         }
        
//         return res.status(200).json({
//             status: 'Success',
//             message: `Latest telemetry data for device ${deviceId} fetched successfully`,
//             data: latestRecord,
//             deviceId: deviceId,
//             timestamp: latestRecord.timestamp
//         });
        
//     } catch (error) {
//         console.error('Error in getLatestSingleTelemetry:', error);
//         return res.status(500).json({
//             status: 'Failed',
//             message: 'Internal Server Error'
//         });
//     }
// };

// const getLatestSingleTelemetry = async (req, res) => {
//     try {
//         const { deviceId } = req.params;

//         if (!deviceId) {
//             return res.status(400).json({
//                 status: 'Failed',
//                 message: 'Device ID is required'
//             });
//         }

//         const db = await database.connectToDatabase();
//         const featureValuesCollection = db.collection('device_feature_values');
//         const waterUsageCollection = db.collection('dailyBasedWaterUsage');

//         // Get the most recent telemetry record from device_feature_values
//         const latestTelemetryRecord = await featureValuesCollection
//             .findOne(
//                 { 
//                     deviceId: deviceId, 
//                     topicType: 'telemetry' 
//                 },
//                 { 
//                     sort: { timestamp: -1 } 
//                 }
//             );

//         if (!latestTelemetryRecord) {
//             return res.status(404).json({
//                 status: 'Failed',
//                 message: `No telemetry data found for device ${deviceId}`
//             });
//         }

//         const today = new Date();
//         today.setHours(0, 0, 0, 0);

//         // Calculate totalWaterUsed for different periods from dailyBasedWaterUsage
//         // Daily: Today's data
//         const dailyQuery = {
//             wp_device_id: deviceId,
//             date: today.toISOString().split('T')[0]
//         };
//         const dailyData = await waterUsageCollection
//             .aggregate([
//                 { $match: dailyQuery },
//                 {
//                     $group: {
//                         _id: null,
//                         totalWaterUsed: { $sum: '$totalWaterUsed' }
//                     }
//                 }
//             ])
//             .toArray();
//         const dailyTotalWaterUsed = dailyData[0]?.totalWaterUsed || 0;

//         // Weekly: Current week's data
//         const weekStart = new Date(today);
//         weekStart.setDate(today.getDate() - today.getDay());
//         const weeklyData = await waterUsageCollection
//             .aggregate([
//                 {
//                     $match: {
//                         wp_device_id: deviceId,
//                         date: {
//                             $gte: weekStart.toISOString().split('T')[0],
//                             $lte: today.toISOString().split('T')[0]
//                         }
//                     }
//                 },
//                 {
//                     $group: {
//                         _id: null,
//                         totalWaterUsed: { $sum: '$totalWaterUsed' }
//                     }
//                 }
//             ])
//             .toArray();
//         const weeklyTotalWaterUsed = weeklyData[0]?.totalWaterUsed || 0;

//         // Monthly: Current month's data
//         const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
//         const monthlyData = await waterUsageCollection
//             .aggregate([
//                 {
//                     $match: {
//                         wp_device_id: deviceId,
//                         date: {
//                             $gte: monthStart.toISOString().split('T')[0],
//                             $lte: today.toISOString().split('T')[0]
//                         }
//                     }
//                 },
//                 {
//                     $group: {
//                         _id: null,
//                         totalWaterUsed: { $sum: '$totalWaterUsed' }
//                     }
//                 }
//             ])
//             .toArray();
//         const monthlyTotalWaterUsed = monthlyData[0]?.totalWaterUsed || 0;

//         // Yearly: Current year's data
//         const yearStart = new Date(today.getFullYear(), 0, 1);
//         const yearlyData = await waterUsageCollection
//             .aggregate([
//                 {
//                     $match: {
//                         wp_device_id: deviceId,
//                         date: {
//                             $gte: yearStart.toISOString().split('T')[0],
//                             $lte: today.toISOString().split('T')[0]
//                         }
//                     }
//                 },
//                 {
//                     $group: {
//                         _id: null,
//                         totalWaterUsed: { $sum: '$totalWaterUsed' }
//                     }
//                 }
//             ])
//             .toArray();
//         const yearlyTotalWaterUsed = yearlyData[0]?.totalWaterUsed || 0;

//         return res.status(200).json({
//             status: 'Success',
//             message: `Latest telemetry and water usage data for device ${deviceId} fetched successfully`,
//             data: {
//                 telemetry: latestTelemetryRecord,
//                 waterUsage: {
//                     daily: dailyTotalWaterUsed,
//                     weekly: weeklyTotalWaterUsed,
//                     monthly: monthlyTotalWaterUsed,
//                     yearly: yearlyTotalWaterUsed
//                 }
//             },
//             deviceId: deviceId,
//             timestamp: latestTelemetryRecord.timestamp
//         });

//     } catch (error) {
//         console.error('Error in getLatestSingleTelemetry:', error);
//         return res.status(500).json({
//             status: 'Failed',
//             message: 'Internal Server Error'
//         });
//     }
// };

// Utility function to fetch water usage data for a given period
// Utility function to fetch water usage data for a given period using updatedAt
const getWaterUsage = async (collection, deviceId, startDateObj, endDateObj, limit = 0) => {
    const query = {
        wp_device_id: deviceId,
        updatedAt: { $gte: startDateObj, $lte: endDateObj }
    };

    const pipeline = [
        { $match: query },
        { $sort: { updatedAt: 1 } }, // ascending by time
    ];

    if (limit > 0) pipeline.push({ $limit: limit });

    const records = await collection.aggregate(pipeline).toArray();
    const count = records.length;
    const totalWaterUsed = records.reduce((sum, r) => sum + (r.totalWaterUsed || 0), 0);

    // Use first and last record to create range
    const timeline = records.length
        ? `${records[0].date || records[0].updatedAt.toISOString().split('T')[0]} to ${records[records.length - 1].date || records[records.length - 1].updatedAt.toISOString().split('T')[0]}`
        : null;

    return { records, count, totalWaterUsed, timeline };
};


const getLatestSingleTelemetry = async (req, res) => {
    try {
        const { deviceId } = req.params;
        if (!deviceId) return res.status(400).json({ status: 'Failed', message: 'Device ID is required' });

        const db = await database.connectToDatabase();
        const featureValuesCollection = db.collection('device_feature_values');
        const waterUsageCollection = db.collection('dailyBasedWaterUsage');

        // Latest telemetry
        const latestTelemetryRecord = await featureValuesCollection.findOne(
            { deviceId, topicType: 'telemetry' },
            { sort: { timestamp: -1 } }
        );

        if (!latestTelemetryRecord) {
            return res.status(404).json({ status: 'Failed', message: `No telemetry data found for device ${deviceId}` });
        }

        const today = new Date();
        const startOfDay = new Date(today); startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date(today); endOfDay.setHours(23,59,59,999);
        const startOfWeek = new Date(startOfDay); startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfYear = new Date(today.getFullYear(), 0, 1);

        const daily = await getWaterUsage(waterUsageCollection, deviceId, startOfDay, endOfDay);
        const weekly = await getWaterUsage(waterUsageCollection, deviceId, startOfWeek, endOfDay);
        const monthly = await getWaterUsage(waterUsageCollection, deviceId, startOfMonth, endOfDay);
        const yearly = await getWaterUsage(waterUsageCollection, deviceId, startOfYear, endOfDay);

        return res.status(200).json({
            status: 'Success',
            message: `Latest telemetry and water usage data for device ${deviceId} fetched successfully`,
            data: {
                ...latestTelemetryRecord,       // <-- flatten telemetry fields
                waterUsage: { daily, weekly, monthly, yearly }
            },
            deviceId,
            timestamp: latestTelemetryRecord.timestamp
        });

    } catch (error) {
        console.error('Error in getLatestSingleTelemetry:', error);
        return res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
    }
};




module.exports = {
    getRecentTelemetry,
    getLatestTelemetryPerDevice,
    getTelemetryByTimeRange,
    getTelemetryDashboard,
    getLatestSingleTelemetry
};