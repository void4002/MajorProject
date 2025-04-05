import pymongo
from py2neo import Graph, Node, Relationship
import nltk
import spacy
from collections import defaultdict

# Download necessary NLTK and SpaCy resources
nltk.download('punkt')
nltk.download('stopwords')
nlp = spacy.load('en_core_web_sm')

class TourismKnowledgeGraph:
    def __init__(self, mongo_uri, neo4j_uri, neo4j_user, neo4j_password):
        # MongoDB connection
        self.mongo_client = pymongo.MongoClient(mongo_uri)
        self.mongo_db = self.mongo_client['travel_vlogs']
        self.collection = self.mongo_db['refined_transcripts']
        
        # Neo4j connection
        self.neo4j_graph = Graph(neo4j_uri, auth=(neo4j_user, neo4j_password))
    
    def extract_knowledge(self):
        """
        Extract structured knowledge from MongoDB transcripts
        Returns a dictionary of knowledge per destination
        """
        destinations_knowledge = {}
        
        for doc in self.collection.find():
            destination = doc['destination']
            transcript = doc['refined_transcript']
            
            # Process transcript with SpaCy
            doc_nlp = nlp(transcript)
            
            # Extract key entities and relationships
            knowledge = {
                'location': destination,
                'attractions': set(),
                'activities': set(),
                'landmarks': set(),
                'food': set(),
                'travel_tips': set()
            }
            
            # Extract named entities
            for ent in doc_nlp.ents:
                if ent.label_ in ['GPE', 'LOC', 'ORG']:
                    knowledge['landmarks'].add(ent.text)
                
                # Custom entity type extraction
                if any(keyword in ent.text.lower() for keyword in ['museum', 'park', 'beach', 'garden']):
                    knowledge['attractions'].add(ent.text)
            
            # Extract activities and tips using custom rules
            sentences = [sent.text for sent in doc_nlp.sents]
            for sentence in sentences:
                if any(keyword in sentence.lower() for keyword in ['recommend', 'visit', 'try', 'explore']):
                    knowledge['activities'].add(sentence)
                
                if any(keyword in sentence.lower() for keyword in ['tip', 'advice', 'suggestion']):
                    knowledge['travel_tips'].add(sentence)
            
            destinations_knowledge[destination] = knowledge
        
        return destinations_knowledge
    
    def create_knowledge_graph(self, destinations_knowledge):
        """
        Create a Neo4j graph from extracted knowledge
        """
        # Clear existing graph
        self.neo4j_graph.delete_all()
        
        # Create destination nodes and relationships
        for destination, knowledge in destinations_knowledge.items():
            dest_node = Node('Destination', name=destination)
            self.neo4j_graph.create(dest_node)
            
            # Create subnodes for different knowledge types
            for category, items in knowledge.items():
                if items:
                    category_node = Node(category.capitalize(), name=category)
                    self.neo4j_graph.create(category_node)
                    
                    # Create relationship between destination and category
                    rel = Relationship(dest_node, category.upper(), category_node)
                    self.neo4j_graph.create(rel)
                    
                    # Add individual items as nodes
                    for item in items:
                        item_node = Node('Item', name=item)
                        self.neo4j_graph.create(item_node)
                        
                        # Create relationship between category and item
                        item_rel = Relationship(category_node, 'HAS', item_node)
                        self.neo4j_graph.create(item_rel)
    
    def run_extraction(self):
        """
        Main method to extract and graph knowledge
        """
        destinations_knowledge = self.extract_knowledge()
        self.create_knowledge_graph(destinations_knowledge)
        print(f"Knowledge graph created for {len(destinations_knowledge)} destinations")

# Usage example
if __name__ == '__main__':
    mongo_uri = 'mongodb+srv://void:4002@cluster0.84ybg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
    neo4j_uri = 'neo4j+s://824af860.databases.neo4j.io'
    neo4j_user = 'neo4j'  
    neo4j_password = 'shqnGhA7hpf1OG_YviW5OL7ZbwNrIC5JJFpGuXhhVpE' 
    
    knowledge_extractor = TourismKnowledgeGraph(
        mongo_uri, 
        neo4j_uri, 
        neo4j_user, 
        neo4j_password
    )
    knowledge_extractor.run_extraction()