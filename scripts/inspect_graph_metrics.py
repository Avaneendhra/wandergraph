import json
import networkx as nx
from pathlib import Path
from collections import Counter
import sys

# Ensure backend can be imported
sys.path.insert(0, str(Path("backend").resolve()))

from app.graph.builder import build_knowledge_graph
from app.graph.schema import NodeType, RelationType
from app.config import settings

g = build_knowledge_graph()

print("================ GRAPH STATISTICS ================")
print(f"Total Nodes (|V|): {g.number_of_nodes()}")
print(f"Total Edges (|E|): {g.number_of_edges()}")

# Nodes by type
node_types = Counter(data.get("type", "unknown") for _, data in g.nodes(data=True))
print("\n--- Nodes by Type ---")
for nt, count in sorted(node_types.items()):
    print(f"  {nt}: {count}")

# Edges by relation
edge_relations = Counter(data.get("relation", "unknown") for _, _, data in g.edges(data=True))
print("\n--- Edges by Relation ---")
for rel, count in sorted(edge_relations.items()):
    print(f"  {rel}: {count}")

# Node degree statistics
total_degrees = [d for _, d in g.degree()]
in_degrees = [d for _, d in g.in_degree()]
out_degrees = [d for _, d in g.out_degree()]
avg_total_deg = sum(total_degrees) / len(total_degrees) if total_degrees else 0
avg_in_deg = sum(in_degrees) / len(in_degrees) if in_degrees else 0
avg_out_deg = sum(out_degrees) / len(out_degrees) if out_degrees else 0

print(f"\nAverage Total Degree (k_avg): {avg_total_deg:.2f}")
print(f"Average In-Degree: {avg_in_deg:.2f}")
print(f"Average Out-Degree: {avg_out_deg:.2f}")
print(f"Max In-Degree: {max(in_degrees)} | Max Out-Degree: {max(out_degrees)}")

# Density
# For MultiDiGraph, simple graph density formula: |E| / (|V|*(|V|-1))
v = g.number_of_nodes()
e = g.number_of_edges()
density = e / (v * (v - 1)) if v > 1 else 0
print(f"Directed Multigraph Density: {density:.6f}")

# Weakly and Strongly connected components
wcc = list(nx.weakly_connected_components(g))
scc = list(nx.strongly_connected_components(g))
isolates = list(nx.isolates(g))
print(f"Weakly Connected Components: {len(wcc)}")
print(f"Strongly Connected Components: {len(scc)}")
print(f"Isolated Nodes: {len(isolates)}")

# NEARBY distance metrics
distances = [data["distance_km"] for _, _, data in g.edges(data=True) if data.get("relation") == RelationType.NEARBY_TO.value and "distance_km" in data]
if distances:
    print(f"\n--- Geo-Spatial Edge Statistics ---")
    print(f"Total NEARBY Edges: {len(distances)}")
    print(f"Min Distance: {min(distances):.2f} km")
    print(f"Mean Distance: {sum(distances)/len(distances):.2f} km")
    print(f"Max Distance: {max(distances):.2f} km")

print("\n================ SYSTEM CONFIGURATION ================")
print(f"App Name: {settings.app_name}")
print(f"Version: {settings.app_version}")
print(f"Host/Port: {settings.host}:{settings.port}")
print(f"Google Places Search URL: {settings.google_places_search_url}")
print(f"Google Places Field Mask: {settings.places_search_field_mask}")
