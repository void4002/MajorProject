"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { TravelPlanForm } from "@/components/travel-plan-form";
import { ItineraryList } from "@/components/itinerary-list";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useRouter } from "next/navigation";
import type { Itinerary } from "@/types/itinerary";

export default function Dashboard() {
  const { user } = useAuth();
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  const handleItinerariesGenerated = (newItineraries: Itinerary[]) => {
    setItineraries(newItineraries);
  };

  const handleSelectItinerary = async (itinerary: Itinerary) => {
    try {
      // Save itinerary to the user's dashboard
      await fetch("/app/api/save_itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itinerary, userId: user.id }),
      });

      alert(`Itinerary ${itinerary.id} saved successfully!`);
    } catch (error) {
      console.error("Error saving itinerary:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Welcome, {user.name}!</h1>
        <TravelPlanForm onSubmit={handleItinerariesGenerated} />
        {itineraries.length > 0 && (
          <ItineraryList
            itineraries={itineraries}
            onSelect={handleSelectItinerary}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}
