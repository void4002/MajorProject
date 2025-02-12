"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ItineraryListProps {
  itineraryText: string; // The backend response as plain text or HTML
}

export function ItineraryList({ itineraryText }: ItineraryListProps) {
  console.log("Itinerary text received in ItineraryList:", itineraryText); // Debugging log

  // Clean up the text
  const cleanedText = itineraryText
    .replace(/\[.*?\]/g, "") // Remove ID-like strings within brackets
    .replace(/^[^\n]*\n\n/, "") // Remove the first line before the first blank line
    .replace(/\*\*/g, "") // Remove all instances of **
    .trim();

  // Extract itineraries by splitting at each "Itinerary n:"
  const itineraries = cleanedText
    .split(/Itinerary \d+:/g) // Split the text at each "Itinerary n:"
    .map((itinerary) => itinerary.trim()) // Remove extra spaces
    .filter((itinerary) => itinerary.length > 0); // Remove empty strings

  // Track the state of selected itineraries
  const [completedItineraries, setCompletedItineraries] = useState<Record<number, boolean>>({});

  const handleFeedback = async (index: number) => {
    const rating = prompt("Rate this itinerary (1-5):");
    const feedback = prompt("Leave your feedback:");

    if (!rating || isNaN(parseInt(rating, 10)) || parseInt(rating, 10) < 1 || parseInt(rating, 10) > 5) {
      alert("Please provide a valid rating between 1 and 5.");
      return;
    }

    if (!feedback) {
      alert("Feedback cannot be empty.");
      return;
    }

    try {
      // Simulate sending feedback to the backend
      await fetch("/app/api/submit_feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itineraryId: index + 1,
          rating: parseInt(rating, 10),
          feedback,
        }),
      });
      alert("Feedback submitted successfully!");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Failed to submit feedback.");
    }
  };

  const handleSelect = (index: number) => {
    setCompletedItineraries((prev) => ({
      ...prev,
      [index]: true,
    }));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Generated Itinerary</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {itineraries.map((itinerary, index) => (
          <div key={index} className="bg-white shadow-md rounded-xl p-4 space-y-4">
            <div className="text-lg font-bold">Itinerary {index + 1}</div>
            <p className="text-gray-700 whitespace-pre-wrap">{itinerary}</p>
            {!completedItineraries[index] ? (
              <Button
                onClick={() => handleSelect(index)}
                className="w-full"
              >
                Select Itinerary
              </Button>
            ) : (
              <Button
                onClick={() => handleFeedback(index)}
                className="w-full"
              >
                Completed
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
