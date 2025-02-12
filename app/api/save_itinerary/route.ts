import { connectToDatabase } from "@/lib/mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import SelectedItinerary from "@/models/SelectedItinerary";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      await connectToDatabase();

      const { userId, itineraryId, itineraryDetails } = req.body;

      if (!userId || !itineraryId || !itineraryDetails) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const newSelectedItinerary = new SelectedItinerary({
        userId,
        itineraryId,
        itineraryDetails,
      });

      await newSelectedItinerary.save();

      res.status(201).json({ message: "Itinerary saved successfully" });
    } catch (error) {
      console.error("Error saving itinerary:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
