import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get the userId from the URL query parameters
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    
    console.log("🔍 Fetching itineraries for userId:", userId);

    // Check for missing userId
    if (!userId) {
      console.error("❌ Error: Missing userId parameter");
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
    }

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error("❌ Error: Invalid userId format");
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 });
    }

    // Find the user and select only the itineraries field
    const objectId = new mongoose.Types.ObjectId(userId);
    const user = await User.findById(objectId).select("itineraries");

    if (!user) {
      console.error("❌ Error: User not found");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(`✅ Successfully retrieved ${user.itineraries.length} itineraries`);
    
    // Return the itineraries array
    return NextResponse.json({ itineraries: user.itineraries }, { status: 200 });
  } catch (error) {
    console.error("❌ Internal Server Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}