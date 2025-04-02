"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ItineraryList } from "./itinerary-list";
import { motion, AnimatePresence } from "framer-motion";
import { Cog, Loader2, MapPin } from "lucide-react";

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

    const fullQuery = `${travelPlan} Give some itineraries like itinerary 1: day1: day2: ... ,itinerary 2: .... include accomodations, estimated budget, travell options, etc.`;

    try {
      const response = await fetch("http://localhost:5000/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: fullQuery }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to generate itineraries. Please try again.");
        return;
      }

      const data = await response.json();
      console.log("Backend response:", data);
      setItineraryText(data.answer);
    } catch (error) {
      console.error("Error generating itineraries:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 bg-white">
      <motion.form 
        onSubmit={handleSubmit} 
        className="space-y-6 p-6 bg-teal-50 rounded-2xl shadow-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-2">
          <Label 
            htmlFor="travel-plan" 
            className="text-lg font-medium flex items-center gap-2 text-teal-800"
          >
            <MapPin className="h-5 w-5 text-teal-500" />
            Tell us about your dream adventure
          </Label>
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Textarea
              id="travel-plan"
              value={travelPlan}
              onChange={(e) => setTravelPlan(e.target.value)}
              placeholder="I want to visit Delhi and enjoy for 3 days."
              className="h-40 text-base shadow-sm border-teal-200 focus:border-teal-400 focus:ring-teal-300"
              required
            />
          </motion.div>
          <p className="text-sm text-teal-700 italic mt-1">
            Provide details like destination, duration, budget, interests, and any specific requirements.
          </p>
        </div>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex justify-center"
        >
          <Button 
            type="submit" 
            disabled={isLoading}
            size="lg"
            className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-8 py-2 rounded-full transition-colors duration-300 ease-in-out"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Crafting Your Journey...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Cog className="h-5 w-5" />
                Generate Itineraries
              </span>
            )}
          </Button>
        </motion.div>
        
        <AnimatePresence>
          {error && (
            <motion.div 
              className="text-teal-800 bg-teal-100 p-3 rounded-lg text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.form>

      <AnimatePresence>
        {itineraryText && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <ItineraryList itineraryText={itineraryText} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}