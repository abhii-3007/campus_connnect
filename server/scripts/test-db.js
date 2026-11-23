import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';

async function testConnection() {
  console.log('Testing live MongoDB connection via MongoMemoryServer...');
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  process.env.MONGO_URI = uri;

  try {
    const conn = await connectDB();
    console.log('SUCCESS: Connected to database at', conn.connection.host);
    console.log('ReadyState:', mongoose.connection.readyState === 1 ? 'Connected (1)' : 'Not connected');
    await mongoose.disconnect();
    await mongod.stop();
    console.log('Test completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('FAILURE:', error);
    await mongod.stop();
    process.exit(1);
  }
}

testConnection();
