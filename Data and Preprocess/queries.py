from py2neo import Graph

class TourismQueries:
    def __init__(self, neo4j_uri, neo4j_user, neo4j_password):
        self.graph = Graph(neo4j_uri, auth=(neo4j_user, neo4j_password))
    
    def get_destination_attractions(self, destination):
        """Retrieve attractions for a specific destination"""
        query = f"""
        MATCH (d:Destination {{name: "{destination}"}})-[:ATTRACTIONS]->(i:Item)
        RETURN collect(i.name) AS attractions
        """
        return self.graph.run(query).data()[0]['attractions']
    
    def find_destinations_with_landmarks(self, landmark_keyword):
        """Find destinations containing specific landmarks"""
        query = f"""
        MATCH (d:Destination)-[:LANDMARKS]->(i:Item)
        WHERE i.name CONTAINS "{landmark_keyword}"
        RETURN collect(DISTINCT d.name) AS destinations
        """
        return self.graph.run(query).data()[0]['destinations']
    
    def get_travel_tips(self, destination):
        """Retrieve travel tips for a destination"""
        query = f"""
        MATCH (d:Destination {{name: "{destination}"}})-[:TRAVEL_TIPS]->(i:Item)
        RETURN collect(i.name) AS tips
        """
        return self.graph.run(query).data()[0]['tips']

# Usage example
if __name__ == '__main__':
    neo4j_uri = 'neo4j+s://824af860.databases.neo4j.io'
    neo4j_user = 'neo4j'  
    neo4j_password = 'shqnGhA7hpf1OG_YviW5OL7ZbwNrIC5JJFpGuXhhVpE' 
    
    queries = TourismQueries(neo4j_uri, neo4j_user, neo4j_password)
    
    # Example queries
    print("Attractions in Agra:")
    print(queries.get_destination_attractions("Agra"))
    
    print("\nDestinations with 'Lake':")
    print(queries.find_destinations_with_landmarks("Lake"))
    
    print("\nTravel Tips for Agra:")
    print(queries.get_travel_tips("Agra"))