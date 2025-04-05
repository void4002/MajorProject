import numpy as np
import random
from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer
from pymongo import MongoClient
import logging

class RelationshipItineraryGenerator:
    def __init__(self, mongodb_uri: str):
        """
        Initialize the itinerary generator with MongoDB connection
        
        Args:
            mongodb_uri (str): MongoDB connection string
        """
        try:
            self.client = MongoClient(mongodb_uri)
            self.db = self.client.travel_vlogs
            self.kb_collection = self.db.enhanced_knowledge_base
            
            # Initialize sentence embedding model
            self.sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
            
            logging.info("Itinerary Generator initialized successfully")
        except Exception as e:
            logging.error(f"Initialization error: {e}")
            raise

    def _semantic_query_match(self, query: str, destination_doc: Dict) -> float:
        """
        Compute semantic similarity between user query and destination document
        
        Args:
            query (str): User input query
            destination_doc (Dict): Destination document from knowledge base
        
        Returns:
            float: Semantic similarity score
        """
        # Generate embeddings
        query_embedding = self.sentence_model.encode(query.lower())
        
        # Expand match fields
        match_fields = [
            destination_doc.get('destination_name', '').lower(),
            *[str(attr).lower() for attr in destination_doc.get('entities', {}).get('attractions', [])],
            *[str(landmark).lower() for landmark in destination_doc.get('entities', {}).get('landmarks', [])],
            *[str(keyword).lower() for keyword in destination_doc.get('keywords', [])]
        ]
        
        # Compute max similarity across fields
        similarities = []
        for field in match_fields:
            if field:
                try:
                    field_embedding = self.sentence_model.encode(field)
                    similarity = np.dot(query_embedding, field_embedding) / (
                        np.linalg.norm(query_embedding) * np.linalg.norm(field_embedding)
                    )
                    similarities.append(similarity)
                except Exception as e:
                    print(f"Error processing field {field}: {e}")
        
        return max(similarities) if similarities else 0

    def _generate_semantic_context(self, query: str, destination: Dict) -> Dict:
        """
        Extract semantic context and relationships
        
        Args:
            query (str): User input query
            destination (Dict): Destination document
        
        Returns:
            Dict: Semantic context details
        """
        query_embedding = self.sentence_model.encode(query)
        
        # Extract relationship details
        relationships = destination.get('relationships', {})
        entities = destination.get('entities', {})
        
        # Compute contextual relevance
        context_text = ' '.join([
            relationships.get('subject', ''),
            relationships.get('predicate', ''),
            relationships.get('object', '')
        ])
        context_embedding = self.sentence_model.encode(context_text)
        
        similarity = np.dot(query_embedding, context_embedding) / (
            np.linalg.norm(query_embedding) * np.linalg.norm(context_embedding)
        )
        
        return {
            'similarity': float(similarity),
            'relationship_type': relationships.get('relationship_type', 'Exploratory'),
            'entities': entities,
            'semantic_relationships': {
                'subject': relationships.get('subject', ''),
                'predicate': relationships.get('predicate', ''),
                'object': relationships.get('object', '')
            }
        }

    def _craft_narrative_sentence(self, context: Dict, day: int) -> str:
        """
        Generate grammatically rich narrative sentences for daily activities
        
        Args:
            context (Dict): Semantic context
            day (int): Day number in the itinerary
        
        Returns:
            str: Narrative sentence for the day
        """
        entities = context['entities']
        relationships = context['semantic_relationships']
        
        # Prioritize attractions, landmarks, cultural elements
        attractions = entities.get('attractions', [])
        landmarks = entities.get('landmarks', [])
        cultural_elements = entities.get('cultural_elements', [])
        
        # Combine and select elements
        all_elements = attractions + landmarks + cultural_elements
        
        # Select day-specific elements
        day_elements = all_elements[
            (day-1)*2 : (day-1)*2 + 2
        ] if all_elements else []
        
        # Narrative templates with variability
        narrative_templates = [
            f"Day {day}: {relationships['subject']} {relationships['predicate']} through a mesmerizing journey in {', '.join(day_elements or ['local wonders'])}.",
            f"Day {day}: Explore the {relationships['relationship_type']} essence by discovering {', '.join(day_elements or ['hidden gems'])}.",
            f"Day {day}: Immerse in {relationships['object']} by experiencing {', '.join(day_elements or ['scenic locations'])}"
        ]
        
        return random.choice(narrative_templates)

    def generate_itineraries(self, query: str, num_days: int = 3, similarity_threshold: float = 0.1) -> List[Dict]:
        """
        Generate semantic itineraries based on user query
        
        Args:
            query (str): User destination query
            num_days (int): Number of days for itinerary
            similarity_threshold (float): Minimum semantic similarity
        
        Returns:
            List[Dict]: Generated itineraries
        """
        # Print debug information
        print(f"Query: {query}")
        
        # Flexible search across multiple fields
        destinations = list(self.kb_collection.find({
            "$or": [
                {"destination_name": {"$regex": query, "$options": "i"}},
                {"entities.attractions": {"$regex": query, "$options": "i"}}
            ]
        }).limit(10))

        print(f"Total destinations found: {len(destinations)}")
        
        # Semantic similarity filtering and ranking
        semantic_destinations = []
        for destination in destinations:
            similarity = self._semantic_query_match(query, destination)
            print(f"Destination: {destination.get('destination_name', 'Unknown')}, Similarity: {similarity}")
            if similarity >= similarity_threshold:
                semantic_destinations.append((destination, similarity))
        
        # Sort destinations by semantic similarity
        semantic_destinations.sort(key=lambda x: x[1], reverse=True)

        # Generate itineraries
        itineraries = []
        for destination, similarity in semantic_destinations:
            context = self._generate_semantic_context(query, destination)
            
            itinerary = {
                'destination': destination.get('destination_name', 'Unknown'),
                'theme': context['relationship_type'],
                'similarity_score': similarity,
                'days': {}
            }

            # Generate daily narratives
            for day in range(1, num_days + 1):
                itinerary['days'][day] = self._craft_narrative_sentence(context, day)

            itineraries.append(itinerary)

        return itineraries

def main():
    # Replace with your secure MongoDB URI
    mongodb_uri = "mongodb+srv://void:4002@cluster0.84ybg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    
    logging.basicConfig(level=logging.DEBUG)
    
    try:
        generator = RelationshipItineraryGenerator(mongodb_uri)
        
        user_queries = [
            "Goa",
        ]

        for query in user_queries:
            try:
                print(f"\n=== Itineraries for: {query} ===")
                itineraries = generator.generate_itineraries(query, similarity_threshold=0.1)
                
                if not itineraries:
                    print(f"No matching itineraries found for query: {query}")
                    continue
                
                for i, itin in enumerate(itineraries, 1):
                    print(f"\nItinerary {i}")
                    print(f"Destination: {itin['destination']}")
                    print(f"Theme: {itin['theme']}")
                    print(f"Similarity Score: {itin['similarity_score']:.2f}")
                    for day, activities in itin['days'].items():
                        print(activities)
            
            except Exception as e:
                print(f"Error processing query '{query}': {e}")

    except Exception as e:
        print(f"Error generating itineraries: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()