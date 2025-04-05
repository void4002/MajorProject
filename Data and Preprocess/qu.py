import spacy
from py2neo import Graph
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from nltk.corpus import stopwords
import nltk

# Download NLTK resources
nltk.download('stopwords')

class RAGTourismAgent:
    def __init__(self, neo4j_uri, neo4j_user, neo4j_password, model_name="t5-small"):
        # Connect to Neo4j
        self.graph = Graph(neo4j_uri, auth=(neo4j_user, neo4j_password))
        
        # Load NLP and stopwords
        self.nlp = spacy.load('en_core_web_sm')
        self.stop_words = set(stopwords.words('english'))
        
        # Load transformer model for generation
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.generator = AutoModelForSeq2SeqLM.from_pretrained(model_name)
    
    def retrieve_knowledge(self, query):
        """
        Retrieve relevant knowledge from Neo4j based on the query.
        """
        keywords = [token.text.lower() for token in self.nlp(query) if token.is_alpha and token.text.lower() not in self.stop_words]
        results = []
        
        for keyword in keywords:
            cypher_query = f"""
            MATCH (n)-[r]->(m)
            WHERE n.name CONTAINS '{keyword}' OR m.name CONTAINS '{keyword}'
            RETURN n.name AS Source, type(r) AS Relationship, m.name AS Target
            LIMIT 5
            """
            query_results = self.graph.run(cypher_query).data()
            results.extend(query_results)
        
        # Format results as a string
        knowledge = "\n".join([f"{res['Source']} ({res['Relationship']}) {res['Target']}" for res in results])
        return knowledge if knowledge else "No relevant knowledge found."
    
    def generate_response(self, query, knowledge):
        """
        Generate a response using the query and retrieved knowledge.
        """
        input_text = f"Question: {query}\nKnowledge: {knowledge}\nAnswer:"
        inputs = self.tokenizer(input_text, return_tensors="pt", max_length=512, truncation=True)
        outputs = self.generator.generate(inputs.input_ids, max_length=150, num_beams=5, early_stopping=True)
        response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        return response
    
    def handle_query(self, query):
        """
        Handle user query by retrieving knowledge and generating a response.
        """
        print(f"User Query: {query}")
        knowledge = self.retrieve_knowledge(query)
        print(f"Retrieved Knowledge:\n{knowledge}")
        response = self.generate_response(query, knowledge)
        return response

# Usage example
if __name__ == "__main__":
    neo4j_uri = 'neo4j+s://824af860.databases.neo4j.io'
    neo4j_user = 'neo4j'
    neo4j_password = 'shqnGhA7hpf1OG_YviW5OL7ZbwNrIC5JJFpGuXhhVpE'
    
    agent = RAGTourismAgent(neo4j_uri, neo4j_user, neo4j_password, model_name="t5-small")
    
    print("Welcome to the RAG Tourism Agent!")
    print("Ask me about destinations, attractions, or travel tips.")
    
    while True:
        user_query = input("\nYour Query: ")
        if user_query.lower() in ["exit", "quit"]:
            print("Goodbye!")
            break
        
        response = agent.handle_query(user_query)
        print(f"AI Response: {response}")
