"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider";

interface ItineraryListProps {
  itineraryText: string;
}

export function ItineraryList({ itineraryText }: ItineraryListProps) {
  const { user } = useAuth();
  const [savingState, setSavingState] = useState<{ [key: string]: boolean }>({});
  const [successState, setSuccessState] = useState<{ [key: string]: boolean }>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!user) return <div>Please log in to save itineraries.</div>;

  const saveItinerary = async (itinerary: string) => {
    setSavingState((prev) => ({ ...prev, [itinerary]: true }));
    setSuccessState((prev) => ({ ...prev, [itinerary]: false }));
    setErrorMessage(null);

    try {
      const response = await fetch("/api/save_itinerary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user._id, itineraryText: itinerary }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessState((prev) => ({ ...prev, [itinerary]: true }));
      } else {
        setErrorMessage(`Error: ${data.error || "Failed to save itinerary"}`);
        console.error("Save itinerary error:", data.error);
      }
    } catch (error) {
      console.error("Failed to save itinerary:", error);
      setErrorMessage("Network error: Failed to save itinerary. Please try again.");
    }

    setSavingState((prev) => ({ ...prev, [itinerary]: false }));
  };

  const cleanedText = itineraryText
    .replace(/\[.*?\]/g, "")
    .replace(/^[^\n]*\n\n/, "")
    .replace(/\*\*/g, "")
    .trim();

  const itineraries = cleanedText
    .split(/Itinerary \d+:/g)
    .map((itinerary) => itinerary.trim())
    .filter((itinerary) => itinerary.length > 0);

  if (itineraries.length === 0) {
    return <div className="text-center text-gray-500">No itineraries available.</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Generated Itinerary</h2>
      <p className="text-sm text-gray-600">
        User ID: <span className="font-mono text-blue-600">{user._id}</span>
      </p>

      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {itineraries.map((itinerary) => (
          <div key={itinerary} className="bg-white shadow-md rounded-xl p-4 space-y-4">
            <div className="text-lg font-bold">Itinerary</div>
            <p className="text-gray-700 whitespace-pre-wrap">{itinerary}</p>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
              onClick={() => saveItinerary(itinerary)}
              disabled={savingState[itinerary]}
            >
              {savingState[itinerary] ? "Saving..." : successState[itinerary] ? "Saved!" : "Save Itinerary"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}