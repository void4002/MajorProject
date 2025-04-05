from pymongo import MongoClient
import google.generativeai as genai

# MongoDB setup
client = MongoClient("mongodb+srv://void:4002@cluster0.84ybg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client["travel_vlogs"]
transcripts_collection = db["all_transcripts"]
refined_transcripts_collection = db["refined_transcripts"]

# Initialize Gemini API (replace with your API key)
genai.configure(api_key="AIzaSyAIZWV8XVnuAgyLS6Z9-uRr7y4UZAZibII")

def refine_transcript_with_gemini(raw_text):
    """
    Use Gemini API to refine the raw transcript into a structured and polished paragraph.
    """
    try:
        prompt = (
           f"Refine the following raw transcript into a detailed, professional, and comprehensive travel summary suitable for a tourism expert. In addition to the provided content, incorporate relevant general knowledge about the destination, including information on popular attractions, local culture, accommodations, transportation options, activities, hidden gems, travel tips, and any notable events or festivals. The summary should be clear, engaging, and structured in a way that highlights the unique aspects of the destination. Ensure all filler words and redundant information are removed. The final result should be a well-organized paragraph with a thorough and informative overview of the location, catering to travelers seeking expert advice Raw Transcript: {raw_text}"
        )
        
        model = genai.GenerativeModel('gemini-1.5-flash')  # Choose the model, e.g., 'gemini-1.5-flash'
        chat = model.start_chat(history=[])
        response = chat.send_message(prompt)
        refined_text = response.text.strip()  # Extract and clean the response text
        return refined_text
    except Exception as e:
        print(f"Error refining transcript with Gemini: {e}")
        return None

def process_transcripts_with_gemini():
    """
    Process all transcripts: refine with Gemini, extract entities and relationships, and store in MongoDB.
    """
    transcripts = transcripts_collection.find()
    for transcript in transcripts:
        destination = transcript["destination"]
        video_id = transcript["video_id"]
        title = transcript["title"]
        raw_text = transcript["transcript"]

        print(f"Refining transcript for destination: {destination} using Gemini API")

        # Step 1: Refine the transcript using Gemini
        refined_text = refine_transcript_with_gemini(raw_text)
        if not refined_text:
            print(f"Failed to refine transcript for destination: {destination}")
            continue

        # Step 3: Store in MongoDB
        refined_transcripts_collection.insert_one({
            "destination": destination,
            "video_id": video_id,
            "title": title,
            "refined_transcript": refined_text,
        })

        print(f"Processed and stored data for destination: {destination}")

if __name__ == "__main__":
    process_transcripts_with_gemini()
