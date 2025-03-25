import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import fs from 'fs/promises';
import path from 'path';
import User from '@/models/User';
import { connectToDatabase } from '@/lib/mongodb';

// Function to normalize itinerary text for comparison
function normalizeItineraryText(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[-–—]/g, '-')
    .replace(/[.,;:]/g, '')
    .replace(/day \d+:\s*/gi, '')
    .trim();
}

// Calculate similarity between two strings
function calculateSimilarity(str1, str2) {
  const normalized1 = normalizeItineraryText(str1);
  const normalized2 = normalizeItineraryText(str2);
  
  const lengthDifference = Math.abs(normalized1.length - normalized2.length);
  const averageLength = (normalized1.length + normalized2.length) / 2;
  
  if (lengthDifference > (averageLength * 0.2)) {
    return 0;
  }
  
  const words1 = normalized1.split(' ');
  const words2 = normalized2.split(' ');
  
  const uniqueWords = new Set([...words1, ...words2]);
  let matchingWords = 0;
  
  uniqueWords.forEach(word => {
    if (words1.includes(word) && words2.includes(word)) {
      matchingWords++;
    }
  });
  
  return matchingWords / uniqueWords.size;
}

// Generate recommendations based on similar user ratings
async function generateRecommendations(ratingsData, allUsers) {
  const recommendations = {};
  const RATING_THRESHOLD = 4; // Minimum rating to consider as "liked"
  
  // Initialize recommendations object for each user
  allUsers.forEach(user => {
    recommendations[user._id.toString()] = new Set();
  });
  
  // For each user pair, find recommendations
  for (let i = 0; i < allUsers.length; i++) {
    const userA = allUsers[i]._id.toString();
    
    for (let j = 0; j < allUsers.length; j++) {
      if (i === j) continue; // Skip self
      
      const userB = allUsers[j]._id.toString();
      let similarRatings = 0;
      
      // Check if users have similar tastes by counting similarly rated itineraries
      ratingsData.forEach(entry => {
        const ratingA = entry[userA];
        const ratingB = entry[userB];
        
        // Both users have rated this itinerary highly (4+)
        if (ratingA >= RATING_THRESHOLD && ratingB >= RATING_THRESHOLD) {
          similarRatings++;
        }
      });
      
      // If users have similar tastes, recommend items userB liked to userA if userA hasn't rated them
      if (similarRatings > 0) {
        ratingsData.forEach(entry => {
          const ratingA = entry[userA];
          const ratingB = entry[userB];
          
          // If userB liked it and userA hasn't rated it, recommend to userA
          if (ratingB >= RATING_THRESHOLD && (!ratingA || ratingA === 0)) {
            recommendations[userA].add(entry.ItineraryText);
          }
          
          // If userA liked it and userB hasn't rated it, recommend to userB
          if (ratingA >= RATING_THRESHOLD && (!ratingB || ratingB === 0)) {
            recommendations[userB].add(entry.ItineraryText);
          }
        });
      }
    }
  }
  
  // Convert sets to arrays
  allUsers.forEach(user => {
    recommendations[user._id.toString()] = [...recommendations[user._id.toString()]];
  });
  
  return recommendations;
}

// Save recommendations to Excel file
// Save recommendations to Excel file - simple format with userId and itinerary
async function saveRecommendationsToExcel(recommendations, allUsers, filePath) {
  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  
  // Prepare data for Excel - flat structure with userId and itinerary columns
  const data = [];
  
  // For each user, add all their recommended itineraries as separate rows
  allUsers.forEach(user => {
    const userId = user._id.toString();
    const userRecs = recommendations[userId];
    
    // Add each recommendation as a separate row with userId
    userRecs.forEach(itinerary => {
      data.push({
        userId: userId,
        itinerary: itinerary,
        matchScore: 0.8, // Default match score
        isGeneric: false
      });
    });
  });
  
  // Add a few generic recommendations that will show up for users with no specific recs
  const allItineraries = new Set();
  Object.values(recommendations).forEach(recs => {
    recs.forEach(rec => allItineraries.add(rec));
  });
  
  // Take up to 3 itineraries as generic recommendations
  const genericRecs = [...allItineraries].slice(0, 3);
  genericRecs.forEach(itinerary => {
    data.push({
      userId: 'generic',
      itinerary: itinerary,
      matchScore: 0.7,
      isGeneric: true
    });
  });
  
  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Recommendations');
  
  // Write to file
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  await fs.writeFile(filePath, buffer);
  
  // Update file path to match what GET route is looking for
  const singleFormFilePath = path.join(process.cwd(), 'data', 'itinerary_recommendations.xlsx');
  await fs.writeFile(singleFormFilePath, buffer);
}

export async function POST(request) {
  try {
    await connectToDatabase();
    const { itineraryText, userId, rating } = await request.json();
    
    if (!itineraryText || !userId || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Paths to Excel files
    const ratingsFilePath = path.join(process.cwd(), 'data', 'itinerary_ratings.xlsx');
    const recommendationsFilePath = path.join(process.cwd(), 'data', 'itinerary_recommendations.xlsx');
    
    // Ensure the data directory exists
    await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });
    
    // Get all users for column headers
    const allUsers = await User.find({}, { _id: 1, name: 1 });
    const userColumnMap = new Map();
    
    // Use user IDs directly as column names
    allUsers.forEach(user => {
      userColumnMap.set(user._id.toString(), `${user._id}`);
    });
    
    // Load existing data or create new workbook
    let ratingsWorkbook;
    let ratingsData = [];
    
    try {
      // Try to read existing file
      const fileBuffer = await fs.readFile(ratingsFilePath);
      ratingsWorkbook = XLSX.read(fileBuffer);
      const worksheet = ratingsWorkbook.Sheets['Ratings'];
      ratingsData = XLSX.utils.sheet_to_json(worksheet);
    } catch (error) {
      // If file doesn't exist, create a new workbook
      ratingsWorkbook = XLSX.utils.book_new();
      
      // Create headers array with user IDs
      const headers = ['ItineraryText'];
      allUsers.forEach(user => {
        headers.push(user._id.toString());
      });
      
      // Create a new worksheet with headers
      const worksheet = XLSX.utils.aoa_to_sheet([headers]);
      XLSX.utils.book_append_sheet(ratingsWorkbook, worksheet, 'Ratings');
    }
    
    // Find the user's column - now it's directly the user ID
    const userColumn = userColumnMap.get(userId);
    
    if (!userColumn) {
      return NextResponse.json(
        { error: 'User not found in column mapping' },
        { status: 400 }
      );
    }
    
    // Find similar itinerary with threshold of 0.8 (80% similarity)
    const SIMILARITY_THRESHOLD = 0.8;
    let existingEntryIndex = -1;
    let highestSimilarity = 0;
    
    ratingsData.forEach((entry, index) => {
      const similarity = calculateSimilarity(entry.ItineraryText, itineraryText);
      if (similarity > SIMILARITY_THRESHOLD && similarity > highestSimilarity) {
        existingEntryIndex = index;
        highestSimilarity = similarity;
      }
    });
    
    if (existingEntryIndex !== -1) {
      // Update only this specific user's rating in the existing entry
      ratingsData[existingEntryIndex][userColumn] = rating;
    } else {
      // Create new entry with default 0 ratings for all users
      const newEntry = { 'ItineraryText': itineraryText };
      
      // Initialize all user ratings to 0
      allUsers.forEach(user => {
        const colName = userColumnMap.get(user._id.toString());
        newEntry[colName] = 0;
      });
      
      // Set the current user's rating
      newEntry[userColumn] = rating;
      
      // Add to data
      ratingsData.push(newEntry);
    }
    
    // Convert back to worksheet
    const updatedWorksheet = XLSX.utils.json_to_sheet(ratingsData);
    ratingsWorkbook.Sheets['Ratings'] = updatedWorksheet;
    
    // Write back to file
    const ratingsBuffer = XLSX.write(ratingsWorkbook, { type: 'buffer', bookType: 'xlsx' });
    await fs.writeFile(ratingsFilePath, ratingsBuffer);
    
    // Generate recommendations based on updated ratings
    try {
      const recommendations = await generateRecommendations(ratingsData, allUsers);
      await saveRecommendationsToExcel(recommendations, allUsers, recommendationsFilePath);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      // Don't fail the overall operation if recommendations fail
    }
    
    return NextResponse.json({ 
      success: true, 
      message: existingEntryIndex !== -1 ? 'Rating updated successfully' : 'New rating saved successfully',
      similarity: existingEntryIndex !== -1 ? highestSimilarity : 0
    });
    
  } catch (error) {
    console.error('Error processing rating:', error);
    return NextResponse.json(
      { error: 'Failed to save rating', details: error.message },
      { status: 500 }
    );
  }
}