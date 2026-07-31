import mongoose from 'mongoose';

export default async function globalTeardown() {
  const uri = process.env.MONGOOSE_URI;
  if (!uri) return;

  await mongoose.connect(uri);
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}
