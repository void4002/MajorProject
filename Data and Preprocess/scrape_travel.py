from googleapiclient.discovery import build
from youtube_transcript_api import YouTubeTranscriptApi
from pymongo import MongoClient
import google.generativeai as genai
from dotenv import load_dotenv, dotenv_values
import os
import json

# Constants
API_KEY = "AIzaSyBbKm8G1v5EJjrQJb0MZMXqpT6Yc8QqeXY"
YOUTUBE_API_SERVICE_NAME = "youtube"
YOUTUBE_API_VERSION = "v3"

# MongoDB setup
client = MongoClient("mongodb+srv://void:4002@cluster0.84ybg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client["travel_vlogs"]

# Initialize YouTube API client
youtube = build(YOUTUBE_API_SERVICE_NAME, YOUTUBE_API_VERSION, developerKey=API_KEY)

# List of destinations
destinations = [
     "Nainital", "Agra", "Jaipur", "Goa", "Delhi", "Kerala", "Mumbai", "Varanasi", "Udaipur", "Rishikesh",
    "Amritsar", "Hampi", "Darjeeling", "Mysore", "Lakshadweep", "Hyderabad"
]

def search_videos(destination, max_results=5):
    """
    Search for YouTube videos related to a destination.
    """
    request = youtube.search().list(
        q=f"{destination} travel vlog",
        part="id,snippet",
        type="video",
        maxResults=max_results
    )
    response = request.execute()
    return response.get("items", [])

def fetch_transcripts(video_id):
    """
    Fetch video transcript using the YouTube Transcript API.
    """
    try:
        transcripts = YouTubeTranscriptApi.get_transcript(video_id)
        return " ".join([item["text"] for item in transcripts])
    except Exception as e:
        print(f"Could not fetch transcript for video {video_id}: {e}")
        return None

def store_best_transcript(destination, video_id, title, transcript):
    """
    Store the best transcript (longest) for a destination in the 'all_transcripts' collection.
    """
    if transcript:
        # Select the collection for storing all transcripts
        all_transcripts_collection = db["all_transcripts"]
        
        # Check if there is already a stored transcript for the destination
        existing_document = all_transcripts_collection.find_one({"destination": destination})
        
        if existing_document:
            # Compare lengths of transcripts and store the longer one
            if len(transcript) > len(existing_document["transcript"]):
                all_transcripts_collection.update_one(
                    {"_id": existing_document["_id"]},
                    {"$set": {"video_id": video_id, "title": title, "transcript": transcript}}
                )
                print(f"Updated the best transcript for {destination}.")
            else:
                print(f"The current transcript for {destination} is already the best.")
        else:
            # Insert the transcript if no record exists
            data = {
                "destination": destination,
                "video_id": video_id,
                "title": title,
                "transcript": transcript
            }
            all_transcripts_collection.insert_one(data)
            print(f"Stored the best transcript for {destination}.")
    else:
        print(f"No transcript available for video {video_id}.")

def main():
    for destination in destinations:
        print(f"Processing destination: {destination}")
        videos = search_videos(destination)
        for video in videos:
            video_id = video["id"]["videoId"]
            title = video["snippet"]["title"]
            print(f"Fetching transcript for video: {title} (ID: {video_id})")
            transcript = fetch_transcripts(video_id)
            store_best_transcript(destination, video_id, title, transcript)

if __name__ == "__main__":
    main()


if __name__ == "__main__":
    main()

