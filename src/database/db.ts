import mongoose from "mongoose";

export const createConnection = async () => {
    try {
      const connection = await mongoose.connect(process.env.MONGOOSE_URI);
      console.log('Database is connected');
      return connection;
    } catch (error) {
      console.error('Database connection failed:', error);
      process.exit(1);
    }
  }