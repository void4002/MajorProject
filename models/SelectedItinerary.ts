import mongoose from "mongoose";

const SelectedItinerarySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true, // User ID who selected the itinerary
  },
  itineraryId: {
    type: String,
    required: true, // Unique ID of the itinerary
  },
  itineraryDetails: {
    type: String,
    required: true, // Details of the selected itinerary
  },
  createdAt: {
    type: Date,
    default: Date.now, // Timestamp of when the itinerary was selected
  },
});

export default mongoose.models.SelectedItinerary ||
  mongoose.model("SelectedItinerary", SelectedItinerarySchema);
