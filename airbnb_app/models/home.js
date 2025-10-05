const mongoose = require("mongoose");
const favourite = require("./favourite");

const homeSchema = new mongoose.Schema({
  houseName: { type: String, required: true },
  price: { type: Number, required: true },
  location: { type: String, required: true },
  rating: { type: Number, required: true },
  photo: String,
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
photoPublicId: {
  type: String,
  required: false
}
});

homeSchema.pre('findOneAndDelete', async function(next) {
  const homeId = this.getQuery()._id;
  await favourite.deleteMany({ homeId: homeId });
  next();
});

module.exports = mongoose.model('Home', homeSchema);