const { MongoClient } = require('mongodb');

const url = 'mongodb+srv://outdid:outdid@cluster0.t16a63a.mongodb.net/';
const dbName = 'waterpurifier'; //For Testing

let client;

//database connection
async function connectToDatabase() {
    if (!client) {
        client = new MongoClient(url);
        try {
            await client.connect();
            console.log('Connected to the database');
            
            const db = client.db(dbName);

            // Handle process termination
            process.on("SIGINT", async () => {
                await client.close();
                console.log("Database connection closed.");
                process.exit(0);
            });
        } catch (error) {
            console.error('Error connecting to the database:', error);
            throw error;
        }
    }

    return client.db(dbName);
}

// Function to get the database instance
function getDB() {
    if (!client) {
        throw new Error('Database not connected. Call connectToDatabase first.');
    }
    return client.db(dbName);
}

module.exports = { connectToDatabase, getDB };