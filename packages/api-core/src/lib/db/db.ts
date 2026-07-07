import mongoose from 'mongoose';

export async function connectDB(uri: string): Promise<void> {
  try {
    await mongoose.connect(uri);
    console.log('[db] MongoDB connected successfully');
  } catch (error) {
    console.error('[db] MongoDB connection failed:', error);
    process.exit(1);
  }
}