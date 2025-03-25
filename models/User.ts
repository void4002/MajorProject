import mongoose from "mongoose";

const ItinerarySchema = new mongoose.Schema({
  itinerary: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    min: [1, "Rating must be at least 1"],
    max: [5, "Rating must be at most 5"],
    required: true,
    default: 1 // Add default value of 1
  },
});

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a name"],
    maxlength: [60, "Name cannot be more than 60 characters"],
  },
  email: {
    type: String,
    required: [true, "Please provide an email"],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: [6, "Password should be at least 6 characters long"],
  },
  itineraries: {
    type: [ItinerarySchema],
    default: [], // Itineraries are not required at signup but can be added later
  },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);