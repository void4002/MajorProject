import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  try {
    // Get userId from query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log(`Fetching recommended itineraries for user: ${userId}`);

    // Path to your Excel file
    const filePath = path.join(process.cwd(), "data", "itinerary_recommendations.xlsx");
    const buffer = await readFile(filePath);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Filter recommendations only for the specific user
    const userRecommendations = data.filter((row: any) => row.userId === userId);

    // Sort by matchScore in descending order (if available)
    userRecommendations.sort((a: any, b: any) => {
      if (a.matchScore && b.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return 0;
    });

    // Transform the data to match frontend expectations
    const recommendations = userRecommendations.map((item: any) => ({
      itinerary: item.itinerary,
      matchScore: item.matchScore || null
    }));

    console.log("Recommended itineraries:", JSON.stringify(recommendations, null, 2));
    console.log(`Found ${recommendations.length} itineraries.`);

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("Error fetching recommended itineraries:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommended itineraries" },
      { status: 500 }
    );
  }
}