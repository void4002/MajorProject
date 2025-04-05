import pymongo
from pymongo import MongoClient
from transformers import (
    pipeline,
    AutoModelForSequenceClassification,
    AutoTokenizer,
    AutoModelForQuestionAnswering,
    AutoModelForTokenClassification
)
from sentence_transformers import SentenceTransformer
import torch
import spacy
import networkx as nx
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from datetime import datetime
from typing import List, Dict, Any
import re
from tqdm import tqdm
import pandas as pd
from bertopic import BERTopic
import yake

class AdvancedKnowledgeBase:
    def __init__(self, mongodb_uri: str):
        # Initialize MongoDB
        self.client = MongoClient(mongodb_uri)
        self.db = self.client.travel_vlogs
        self.source_collection = self.db.refined_transcripts
        self.kb_collection = self.db.enhanced_knowledge_base
        
        # Initialize models
        print("Loading models...")
        self.sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.nlp = spacy.load('en_core_web_trf')
        self.qa_pipeline = pipeline('question-answering', model='deepset/roberta-base-squad2')
        self.zero_shot = pipeline('zero-shot-classification', model='facebook/bart-large-mnli')
        self.ner_pipeline = pipeline('ner', model='dbmdz/bert-large-cased-finetuned-conll03-english')
        self.topic_model = BERTopic(language="english", calculate_probabilities=True)
        
        # Initialize YAKE keyword extractor
        self.kw_extractor = yake.KeywordExtractor(
            lan="en",
            n=3,  # ngram size
            dedupLim=0.3,
            top=20,
            features=None
        )
        
        print("Models loaded successfully!")

    def extract_advanced_entities(self, text: str) -> Dict[str, List[str]]:
        """Extract entities using multiple models for better coverage"""
        # SpaCy entities
        doc = self.nlp(text)
        spacy_entities = {ent.text: ent.label_ for ent in doc.ents}
        
        # Transformer-based NER
        ner_results = self.ner_pipeline(text)
        
        # Combine and categorize entities
        entities = {
            'locations': [],
            'landmarks': [],
            'organizations': [],
            'events': [],
            'dates': [],
            'people': [],
            'attractions': [],
            'cultural_elements': []
        }
        
        # Process SpaCy entities
        for text, label in spacy_entities.items():
            if label in ['GPE', 'LOC']:
                entities['locations'].append(text)
            elif label == 'ORG':
                entities['organizations'].append(text)
            elif label == 'PERSON':
                entities['people'].append(text)
            elif label == 'DATE':
                entities['dates'].append(text)
            elif label == 'EVENT':
                entities['events'].append(text)
            elif label == 'FAC':
                entities['landmarks'].append(text)
        
        # Classify attractions and cultural elements using zero-shot classification
        candidate_phrases = [sent.text.strip() for sent in doc.sents]
        for phrase in candidate_phrases:
            if phrase:
                result = self.zero_shot(
                    phrase,
                    candidate_labels=['tourist attraction', 'cultural element', 'landmark', 'event'],
                    multi_label=True
                )
            
            # Add to appropriate categories based on confidence threshold
                if result['scores'][0] > 0.8:
                    if result['labels'][0] == 'tourist attraction':
                        entities['attractions'].append(phrase)
                    elif result['labels'][0] == 'cultural element':
                        entities['cultural_elements'].append(phrase)
                    elif result['labels'][0] == 'landmark':
                        entities['landmarks'].append(phrase)
                    elif result['labels'][0] == 'event':
                        entities['events'].append(phrase)
        
        return {k: list(set(v)) for k, v in entities.items()}

    def extract_semantic_relationships(self, text: str) -> List[Dict[str, str]]:
        """Extract semantic relationships using dependency parsing and transformers"""
        doc = self.nlp(text)
        relationships = []
        
        # Extract relationships from dependency parse
        for sent in doc.sents:
            for token in sent:
                if token.dep_ in ('nsubj', 'nsubjpass'):
                    subject = token.text
                    verb = token.head.text
                    
                    # Find associated objects
                    for child in token.head.children:
                        if child.dep_ in ('dobj', 'pobj'):
                            object_ = child.text
                            
                            # Get relationship context
                            context = ' '.join([t.text for t in sent])
                            
                            # Classify relationship type using zero-shot classification
                            relationship_type = self.zero_shot(
                                context,
                                candidate_labels=['location', 'description', 'historical', 'cultural', 'tourist']
                            )
                            
                            relationships.append({
                                'subject': subject,
                                'predicate': verb,
                                'object': object_,
                                'relationship_type': relationship_type['labels'][0],
                                'confidence': relationship_type['scores'][0],
                                'context': context
                            })
        
        return relationships

    def generate_embeddings(self, text: str) -> np.ndarray:
        """Generate semantic embeddings for the text"""
        return self.sentence_model.encode(text)

    def extract_key_information(self, text: str) -> Dict[str, Any]:
        """Extract key information using question-answering model"""
        questions = [
            "What is the main attraction?",
            "What is the historical significance?",
            "What are the cultural highlights?",
            "What is the best time to visit?",
            "What are the nearby attractions?"
        ]
        
        information = {}
        for question in questions:
            try:
                answer = self.qa_pipeline(question=question, context=text)
                if answer['score'] > 0.1:  # Confidence threshold
                    information[question] = {
                        'answer': answer['answer'],
                        'confidence': answer['score']
                    }
            except:
                continue
        
        return information

    def create_semantic_graph(self, entities: Dict[str, List[str]], relationships: List[Dict[str, str]]) -> nx.Graph:
        """Create a semantic knowledge graph"""
        G = nx.Graph()
        
        # Add entities as nodes with embeddings
        for category, items in entities.items():
            for item in items:
                embedding = self.generate_embeddings(item)
                G.add_node(item, 
                          type=category,
                          embedding=embedding.tolist())
        
        # Add relationships as edges with weights based on confidence
        for rel in relationships:
            if rel['subject'] in G and rel['object'] in G:
                # Calculate semantic similarity between subject and object
                similarity = cosine_similarity(
                    [G.nodes[rel['subject']]['embedding']],
                    [G.nodes[rel['object']]['embedding']]
                )[0][0]
                
                G.add_edge(
                    rel['subject'],
                    rel['object'],
                    relationship=rel['predicate'],
                    type=rel['relationship_type'],
                    confidence=rel['confidence'],
                    semantic_similarity=float(similarity)
                )
        
        return G

    def extract_topics(self, texts: List[str]) -> Dict[str, Any]:
        """Extract topics using BERTopic"""
        topics, probs = self.topic_model.fit_transform(texts)
        topic_info = self.topic_model.get_topic_info()
        return {
            'topics': topics,
            'probabilities': probs,
            'topic_info': topic_info.to_dict('records')
        }

    def create_knowledge_base(self):
        """Create comprehensive knowledge base from destination data"""
        print("Creating knowledge base...")
        all_texts = []
        
        # Process each destination document
        for doc in tqdm(self.source_collection.find()):
            text = doc['refined_transcript']
            all_texts.append(text)
            
            # Extract information
            entities = self.extract_advanced_entities(text)
            relationships = self.extract_semantic_relationships(text)
            key_info = self.extract_key_information(text)
            
            # Generate embeddings for the full text
            text_embedding = self.generate_embeddings(text)
            
            # Extract keywords using YAKE
            keywords = self.kw_extractor.extract_keywords(text)
            
            # Create semantic graph
            semantic_graph = self.create_semantic_graph(entities, relationships)
            
            # Create knowledge base entry
            kb_entry = {
                'destination_id': doc['_id'],
                'destination_name': doc['destination'],
                'video_id': doc['video_id'],
                'title': doc['title'],
                'entities': entities,
                'relationships': relationships,
                'key_information': key_info,
                'text_embedding': text_embedding.tolist(),
                'keywords': [{'keyword': kw, 'score': score} for kw, score in keywords],
                'semantic_graph': {
                    'nodes': [[n, data] for n, data in semantic_graph.nodes(data=True)],
                    'edges': [[u, v, data] for u, v, data in semantic_graph.edges(data=True)]
                },
                'created_at': datetime.now(),
                'metadata': {
                    'source_text_length': len(text),
                    'processing_version': '2.0',
                    'models_used': [
                        'all-MiniLM-L6-v2',
                        'en_core_web_trf',
                        'deepset/roberta-base-squad2',
                        'facebook/bart-large-mnli',
                        'dbmdz/bert-large-cased-finetuned-conll03-english'
                    ]
                }
            }
            
            # Store in knowledge base collection
            self.kb_collection.insert_one(kb_entry)
        
        # Extract topics across all destinations
        topic_analysis = self.extract_topics(all_texts)
        
        # Store topic analysis in a separate collection
        self.db.topic_analysis.insert_one({
            'analysis': topic_analysis,
            'created_at': datetime.now()
        })
        
        # Create indexes
        self.kb_collection.create_index([('destination_name', pymongo.TEXT)])
        self.kb_collection.create_index([('entities.locations', pymongo.ASCENDING)])
        self.kb_collection.create_index([('entities.landmarks', pymongo.ASCENDING)])
        self.kb_collection.create_index([('created_at', pymongo.DESCENDING)])
        
        print("Knowledge base created successfully!")

    def semantic_search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Perform semantic search across the knowledge base"""
        query_embedding = self.generate_embeddings(query)
        
        # Convert query embedding to list for MongoDB
        query_embedding_list = query_embedding.tolist()
        
        pipeline = [
            {
                '$addFields': {
                    'similarity': {
                        '$function': {
                            'body': """
                                function(embeddings, queryEmbedding) {
                                    return cosineSimilarity(embeddings, queryEmbedding);
                                }
                            """,
                            'args': ['$text_embedding', query_embedding_list],
                            'lang': 'js'
                        }
                    }
                }
            },
            {
                '$sort': {'similarity': -1}
            },
            {
                '$limit': top_k
            }
        ]
        
        return list(self.kb_collection.aggregate(pipeline))

def main():
    mongodb_uri = "mongodb+srv://void:4002@cluster0.84ybg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    kb = AdvancedKnowledgeBase(mongodb_uri)
    kb.create_knowledge_base()

if __name__ == "__main__":
    main()