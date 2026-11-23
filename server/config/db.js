import mongoose from 'mongoose';

/**
 * Reusable function to connect to MongoDB using Mongoose.
 * Reads connection URI from process.env.MONGO_URI and handles errors.
 */
const connectDB = async () => {
  try {
    const connUri = process.env.MONGO_URI;

    if (!connUri) {
      throw new Error('MONGO_URI is not defined in environment variables. Please check your .env file.');
    }

    const conn = await mongoose.connect(connUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
