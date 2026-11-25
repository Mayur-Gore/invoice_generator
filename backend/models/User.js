const mongoose = require('mongoose');

// Schema for login credentials
// NOTE: Plain text password storage is implemented as specifically requested by user:
// "dont add any incepretion we'll add the id and pass by our self into the database directly"
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    // Also support 'id' alias if the user enters 'id' directly into the collection
    id: {
      type: String,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    // Also support 'pass' alias if the user enters 'pass' directly into the collection
    pass: {
      type: String
    },
    name: {
      type: String,
      default: 'Administrator'
    },
    role: {
      type: String,
      default: 'admin'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', userSchema);
