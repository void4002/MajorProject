import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const { userId, itineraryText } = await req.json(); 

    // Debugging logs
    console.log("🚀 Received userId:", userId);
    console.log("📜 Received itineraryText:", itineraryText);

    // Check for missing fields
    if (!userId || !itineraryText) {
      console.error("❌ Error: Missing required fields.");
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Convert userId to ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error("❌ Error: Invalid userId format.");
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const objectId = new mongoose.Types.ObjectId(userId);
    console.log("🛠 Converted userId to ObjectId:", objectId);

    // Use findByIdAndUpdate with proper validation
    const result = await User.findByIdAndUpdate(
      objectId,
      { $push: { itineraries: { itinerary: itineraryText, rating: 1 } } },
      { new: true, runValidators: true }
    );

    if (!result) {
      console.error("❌ Error: User not found or update failed.");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("✅ Itinerary saved successfully.");
    return NextResponse.json({ message: "Itinerary saved successfully" }, { status: 200 });
  } catch (error) {
    console.error("❌ Internal Server Error:", error);
    if (error instanceof mongoose.Error.ValidationError) {
      console.error("❌ Validation Error Details:", error.errors);
      return NextResponse.json({ error: "Validation error: " + JSON.stringify(error.errors) }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}