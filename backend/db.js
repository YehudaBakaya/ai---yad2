import mongoose from 'mongoose';

/**
 * MongoDB Connection
 *
 * כדי לחבר:
 * 1. הוסף MONGODB_URI ל-.env:
 *    MONGODB_URI=mongodb://localhost:27017/yad2ai
 *    או Atlas: mongodb+srv://user:pass@cluster.mongodb.net/yad2ai
 * 2. השרת יתחבר אוטומטית בהפעלה
 */
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.log('⚠️  MONGODB_URI לא הוגדר — עובד עם נתוני זיכרון (in-memory)');
    return false;
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB מחובר:', mongoose.connection.host);
    return true;
  } catch (err) {
    console.error('❌ שגיאת חיבור MongoDB:', err.message);
    console.log('⚠️  ממשיך עם נתוני זיכרון (in-memory)');
    return false;
  }
};

export const isConnected = () => mongoose.connection.readyState === 1;
