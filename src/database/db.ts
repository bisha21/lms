import mongoose from 'mongoose';

export const createConnection = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  try {
    return await mongoose.connect(process.env.MONGOOSE_URI as string);
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};
