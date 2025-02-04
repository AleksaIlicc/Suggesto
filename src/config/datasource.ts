import mongoose from 'mongoose';

const connectToDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(
      'mongodb+srv://cofyye:ngWb7QphatsAXhKF@cluster0.qep1e.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
    );
    console.log('Connected to MongoDB successfully!');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

export default connectToDatabase;
