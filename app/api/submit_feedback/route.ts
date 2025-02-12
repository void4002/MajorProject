import { connectToDatabase } from "@/lib/mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import Feedback from "@/models/Feedback";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      await connectToDatabase();

      const { userId, itineraryId, rating, feedback } = req.body;

      if (!userId || !itineraryId || !rating) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const newFeedback = new Feedback({
        userId,
        itineraryId,
        rating,
        feedback,
      });

      await newFeedback.save();

      res.status(201).json({ message: "Feedback saved successfully" });
    } catch (error) {
      console.error("Error saving feedback:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
