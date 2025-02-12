"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ItineraryList } from "./itinerary-list";

export function TravelPlanForm() {
  const [travelPlan, setTravelPlan] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itineraryText, setItineraryText] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setItineraryText(null);

    const fullQuery = `${travelPlan} Give some itineraries like itinerary 1: day1: day2: ... ,itinerary 2: ....`; // Append additional text

    try {
      const response = await fetch("http://localhost:5000/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: fullQuery }), // Send the appended query
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to generate itineraries. Please try again.");
        return;
      }

      const data = await response.json();
      console.log("Backend response:", data); // Debugging log
      setItineraryText(data.answer); // Set the backend response as plain text
    } catch (error) {
      console.error("Error generating itineraries:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="travel-plan">Tell us about your dream adventure</Label>
          <Textarea
            id="travel-plan"
            value={travelPlan}
            onChange={(e) => setTravelPlan(e.target.value)}
            placeholder="Enter your travel preferences, interests, etc."
            className="h-32"
            required
          />
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Generating Itineraries..." : "Generate Itineraries"}
        </Button>
        {error && <div className="text-red-500">{error}</div>}
      </form>

      {itineraryText && <ItineraryList itineraryText={itineraryText} />}
    </div>
  );
}