// File: /app/api/signup/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import * as XLSX from 'xlsx';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { name, email, password } = await req.json();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      itineraries: [], // Initialize itineraries as an empty array
    });

    await newUser.save();

    // Update Excel file with new user column
    await updateExcelWithNewUser(newUser);

    // Return the user object with `_id`
    return NextResponse.json({
      user: {
        _id: newUser._id.toString(), // Ensure `_id` is a string
        name: newUser.name,
        email: newUser.email,
        itineraries: newUser.itineraries,
      },
    }, { status: 201 });

  } catch (error) {
    console.error("❌ Signup error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Function to update Excel file with new user column
async function updateExcelWithNewUser(newUser) {
  try {
    // Path to the Excel file
    const filePath = path.join(process.cwd(), 'data', 'itinerary_ratings.xlsx');
    
    // Get all users to determine the new column name
    const allUsers = await User.find({}, { _id: 1 }).sort({ createdAt: 1 });
    const userIndex = allUsers.findIndex(user => 
      user._id.toString() === newUser._id.toString()
    ) + 1;
    const newColumnName = `User${userIndex} Rating`;
    
    let workbook;
    let data = [];
    
    try {
      // Try to read existing file
      const fileBuffer = await fs.readFile(filePath);
      workbook = XLSX.read(fileBuffer);
      const worksheet = workbook.Sheets['Ratings'];
      data = XLSX.utils.sheet_to_json(worksheet);
      
      // Add new column to existing data
      data.forEach(row => {
        row[newColumnName] = 0; // Initialize with 0 rating
      });
    } catch (error) {
      // If file doesn't exist, create a new workbook
      workbook = XLSX.utils.book_new();
      
      // Create headers array with new user
      const headers = ['ItineraryText'];
      allUsers.forEach((user, index) => {
        headers.push(`User${index + 1} Rating`);
      });
      
      // Create a new worksheet with headers
      const worksheet = XLSX.utils.aoa_to_sheet([headers]);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Ratings');
    }
    
    // Convert back to worksheet
    const updatedWorksheet = XLSX.utils.json_to_sheet(data);
    workbook.Sheets['Ratings'] = updatedWorksheet;
    
    // Ensure the directory exists
    await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });
    
    // Write back to file
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    await fs.writeFile(filePath, buffer);
    
    console.log(`Excel file updated with new user column: ${newColumnName}`);
    
  } catch (error) {
    console.error('Error updating Excel file with new user:', error);
    // Don't fail the signup process if Excel update fails
  }
}