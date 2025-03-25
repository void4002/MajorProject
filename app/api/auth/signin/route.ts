import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { email, password } = await req.json();

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
    }

    // ✅ Ensure user object matches AuthProvider structure
    return NextResponse.json({
      user: {
        _id: user._id.toString(), // ✅ Ensure MongoDB _id is a string
        name: user.name,
        email: user.email,
        itineraries: user.itineraries || [], // ✅ Ensure itineraries exist
      },
    });
  } catch (error) {
    console.error("❌ Signin error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
