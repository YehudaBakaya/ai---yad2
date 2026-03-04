import mongoose from 'mongoose';

/**
 * User Model
 * תומך בהתחברות רגילה (email+password) ו-Google OAuth
 */
const userSchema = new mongoose.Schema({
  // Google OAuth
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },

  // Firebase Auth UID
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true,
  },

  // פרטים בסיסיים
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    // לא required — Google users אין להם password
  },
  avatar: {
    type: String,
    default: null,
  },

  // מטא-דאטה
  provider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  phone: {
    type: String,
    default: null,
  },
}, {
  timestamps: true, // createdAt, updatedAt אוטומטי
});

// הסר password מה-JSON שיוצא החוצה
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model('User', userSchema);
