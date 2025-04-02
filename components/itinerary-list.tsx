"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { Check, Save, Loader } from "lucide-react";
import { cn } from "@/lib/utils";

// Function to get dynamic image based on detected places
const getItineraryImage = (itinerary: string, index: number) => {
  const places = ["goa", "leh", "delhi", "mumbai", "manali", "jaipur", "kerala", "varanasi", "shimla"];
  const lowerItinerary = itinerary.toLowerCase();
  const matchedPlace = places.find((place) => lowerItinerary.includes(place));
  return matchedPlace
    ? `/images/${matchedPlace}.jpg`
    : `/api/placeholder/600/${320 + index * 15}`;
};

interface ItineraryListProps {
  itineraryText: string;
}

export function ItineraryList({ itineraryText }: ItineraryListProps) {
  const { user } = useAuth();
  const [savingState, setSavingState] = useState<{ [key: string]: boolean }>({});
  const [successState, setSuccessState] = useState<{ [key: string]: boolean }>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [animatedItems, setAnimatedItems] = useState<string[]>([]);

  useEffect(() => {
    const cleanedText = itineraryText
      .replace(/\[.*?\]/g, "")
      .replace(/^[^\n]*\n\n/, "")
      .replace(/\*\*/g, "")
      .trim();

    const items = cleanedText
      .split(/Itinerary \d+:/g)
      .map((itinerary) => itinerary.trim())
      .filter((itinerary) => itinerary.length > 0);

    // Stagger animation
    items.forEach((item, index) => {
      setTimeout(() => {
        setAnimatedItems((prev) => [...prev, item]);
      }, 150 * index);
    });
  }, [itineraryText]);

  if (!user) {
    return (
      <div className="rounded-lg border border-teal-100 p-8 text-center text-teal-700 bg-teal-50 animate-fade-in">
        Please log in to save itineraries.
      </div>
    );
  }

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
    return (
      <div className="text-center text-teal-600 bg-teal-50 rounded-lg p-8 border border-teal-100 animate-fade-in">
        No itineraries available.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center mb-4">
        <span className="w-2 h-8 bg-teal-500 rounded-full mr-3"></span>
        <h2 className="text-2xl font-bold text-teal-700">Generated Itineraries</h2>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg relative animate-fade-in">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {itineraries.map((itinerary, index) => (
          <div
            key={itinerary}
            className={cn(
              "itinerary-card p-4 flex flex-col border border-gray-200 rounded-lg shadow-lg bg-white backdrop-blur-md overflow-hidden",
              animatedItems.includes(itinerary) ? "animate-scale-up" : "opacity-0"
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Image Section */}
            <img
              src={getItineraryImage(itinerary, index)}
              alt={`Itinerary ${index + 1}`}
              className="w-full h-48 object-cover rounded-t-lg"
            />

            {/* Content Section */}
            <div className="p-4 flex flex-col flex-grow">
              <div className="text-lg font-bold mb-2 text-teal-800">
                Itinerary {index + 1}
              </div>
              <div className="flex-grow">
                <p className="text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto mb-4">{itinerary}</p>
              </div>
              <button
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-300",
                  savingState[itinerary]
                    ? "bg-teal-100 text-teal-700"
                    : successState[itinerary]
                    ? "bg-teal-500 text-white hover:bg-teal-600"
                    : "bg-gradient-button text-white hover:shadow-md hover:-translate-y-0.5"
                )}
                onClick={() => saveItinerary(itinerary)}
                disabled={savingState[itinerary]}
              >
                {savingState[itinerary] ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : successState[itinerary] ? (
                  <>
                    <Check className="w-4 h-4" /> Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-black" /> <span className="text-black">Save Itinerary</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
