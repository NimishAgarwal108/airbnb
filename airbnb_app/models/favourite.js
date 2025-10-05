const mongoose = require("mongoose");

const favouriteSchema = mongoose.Schema({
  homeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Home',
    required: true
  },
  userId: {  // 👈 ADD THIS FIELD
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// 👇 Create compound unique index (one user can favorite a home only once)
favouriteSchema.index({ homeId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Favourite', favouriteSchema);