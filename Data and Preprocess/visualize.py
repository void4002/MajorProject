from py2neo import Graph
import networkx as nx
import matplotlib.pyplot as plt

class GraphVisualizer:
    def __init__(self, neo4j_uri, neo4j_user, neo4j_password):
        self.graph = Graph(neo4j_uri, auth=(neo4j_user, neo4j_password))
    
    def download_full_graph(self, output_file='tourism_knowledge_graph.png'):
        """
        Download and visualize entire knowledge graph
        """
        # Cypher query to retrieve full graph
        query = """
        MATCH (n)-[r]->(m)
        RETURN n, r, m
        LIMIT 100
        """
        
        # Create NetworkX graph
        G = nx.DiGraph()
        
        # Fetch graph data
        results = self.graph.run(query).data()
        
        # Add nodes and edges
        for record in results:
            start_node = record['n']
            end_node = record['m']
            relationship = record['r']
            
            # Add nodes with labels
            G.add_node(str(start_node['name']), labels=list(start_node.labels))
            G.add_node(str(end_node['name']), labels=list(end_node.labels))
            
            # Add edge with relationship type
            G.add_edge(str(start_node['name']), str(end_node['name']), 
                       relationship=type(relationship).__name__)
        
        # Visualization
        plt.figure(figsize=(20,15))
        pos = nx.spring_layout(G, k=0.5)  # positions for all nodes
        
        # Draw nodes with different colors based on labels
        node_colors = []
        for node in G.nodes():
            if 'Destination' in G.nodes[node].get('labels', []):
                node_colors.append('red')
            elif 'Item' in G.nodes[node].get('labels', []):
                node_colors.append('blue')
            else:
                node_colors.append('green')
        
        nx.draw(G, pos, 
                with_labels=True, 
                node_color=node_colors, 
                node_size=100, 
                font_size=6,
                arrows=True)
        
        # Save the graph
        plt.tight_layout()
        plt.savefig(output_file, dpi=300)
        print(f"Graph visualization saved to {output_file}")
        
        # Return basic graph statistics
        return {
            'total_nodes': G.number_of_nodes(),
            'total_edges': G.number_of_edges()
        }

# Usage
if __name__ == '__main__':
    neo4j_uri = 'neo4j+s://824af860.databases.neo4j.io'
    neo4j_user = 'neo4j'  
    neo4j_password = 'shqnGhA7hpf1OG_YviW5OL7ZbwNrIC5JJFpGuXhhVpE' 
    
    
    visualizer = GraphVisualizer(neo4j_uri, neo4j_user, neo4j_password)
    stats = visualizer.download_full_graph()
    print("Graph Statistics:", stats)