from typing import Dict, Any, List, Optional, Set
import networkx as nx

from app.graph.builder import build_knowledge_graph
from app.graph.schema import NodeType, RelationType
from app.utils.logging import logger

NODE_COLOR_MAP = {
    NodeType.PLACE.value: "#6366F1",           # Indigo
    NodeType.CITY.value: "#EC4899",            # Pink
    NodeType.NEIGHBORHOOD.value: "#F43F5E",    # Rose
    NodeType.CATEGORY.value: "#10B981",        # Emerald
    NodeType.ACTIVITY.value: "#3B82F6",        # Blue
    NodeType.INTEREST.value: "#8B5CF6",        # Violet
    NodeType.COMPANION_TYPE.value: "#F59E0B",  # Amber
    NodeType.ATMOSPHERE.value: "#06B6D4",      # Cyan
    NodeType.PRICE_RANGE.value: "#14B8A6",     # Teal
    NodeType.TIME_OF_DAY.value: "#EAB308",     # Yellow
    NodeType.ACCESSIBILITY_FEATURE.value: "#84CC16", # Lime
}


class GraphService:
    def __init__(self, graph: Optional[nx.MultiDiGraph] = None):
        self._graph = graph or build_knowledge_graph()

    @property
    def graph(self) -> nx.MultiDiGraph:
        return self._graph

    def get_stats(self) -> Dict[str, Any]:
        node_counts: Dict[str, int] = {}
        for _, data in self._graph.nodes(data=True):
            ntype = data.get("type", "Unknown")
            node_counts[ntype] = node_counts.get(ntype, 0) + 1

        rel_counts: Dict[str, int] = {}
        for _, _, data in self._graph.edges(data=True):
            rel = data.get("relation", "Unknown")
            rel_counts[rel] = rel_counts.get(rel, 0) + 1

        return {
            "total_nodes": self._graph.number_of_nodes(),
            "total_edges": self._graph.number_of_edges(),
            "nodes_by_type": node_counts,
            "edges_by_relation": rel_counts,
        }

    def format_node_for_cytoscape(self, node_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        ntype = data.get("type", "Unknown")
        color = NODE_COLOR_MAP.get(ntype, "#94A3B8")
        label = data.get("label", node_id)
        return {
            "data": {
                "id": node_id,
                "label": label,
                "type": ntype,
                "color": color,
                "properties": data.get("properties", {}),
                "provenance": data.get("provenance"),
            }
        }

    def format_edge_for_cytoscape(self, u: str, v: str, key: Any, data: Dict[str, Any]) -> Dict[str, Any]:
        relation = data.get("relation", "RELATED_TO")
        edge_id = f"{u}->{v}:{relation}:{key}"
        return {
            "data": {
                "id": edge_id,
                "source": u,
                "target": v,
                "label": relation.replace("_", " "),
                "relation": relation,
                "properties": data.get("properties", {}),
                "provenance": data.get("provenance"),
            }
        }

    def get_subgraph_for_city(self, city_id: str, max_places: int = 15) -> Dict[str, List[Dict[str, Any]]]:
        city_node_id = f"city:{city_id}"
        if not self._graph.has_node(city_node_id):
            return {"nodes": [], "edges": []}

        included_nodes: Set[str] = {city_node_id}
        place_nodes: List[str] = []

        # Find places located in this city
        for u, v, data in self._graph.in_edges(city_node_id, data=True):
            if data.get("relation") == RelationType.LOCATED_IN.value:
                u_type = self._graph.nodes[u].get("type")
                if u_type == NodeType.PLACE.value:
                    place_nodes.append(u)
                elif u_type == NodeType.NEIGHBORHOOD.value:
                    included_nodes.add(u)

        # Take up to max_places
        selected_places = place_nodes[:max_places]
        included_nodes.update(selected_places)

        # For each selected place, include connected attributes
        for p in selected_places:
            for _, neighbor, data in self._graph.out_edges(p, data=True):
                n_type = self._graph.nodes[neighbor].get("type")
                # Include semantic tags, categories, companion, atmosphere, but keep reasonable subgraph
                if n_type in [
                    NodeType.CATEGORY.value,
                    NodeType.COMPANION_TYPE.value,
                    NodeType.ATMOSPHERE.value,
                    NodeType.PRICE_RANGE.value,
                    NodeType.TIME_OF_DAY.value,
                    NodeType.NEIGHBORHOOD.value,
                ]:
                    included_nodes.add(neighbor)

        # Also include direct nearby edges between included places
        subgraph = self._graph.subgraph(included_nodes)

        nodes = [
            self.format_node_for_cytoscape(nid, subgraph.nodes[nid])
            for nid in subgraph.nodes()
        ]
        edges = [
            self.format_edge_for_cytoscape(u, v, k, data)
            for u, v, k, data in subgraph.edges(keys=True, data=True)
        ]

        return {"nodes": nodes, "edges": edges}

    def get_neighborhood_subgraph(self, node_id: str, depth: int = 1) -> Dict[str, List[Dict[str, Any]]]:
        if not self._graph.has_node(node_id):
            return {"nodes": [], "edges": []}

        # Ego graph for depth hops (undirected projection to capture in/out relationships)
        undirected = self._graph.to_undirected(as_view=True)
        try:
            ego_nodes = nx.ego_graph(undirected, node_id, radius=depth).nodes()
        except Exception:
            ego_nodes = [node_id]

        subgraph = self._graph.subgraph(ego_nodes)

        nodes = [
            self.format_node_for_cytoscape(nid, subgraph.nodes[nid])
            for nid in subgraph.nodes()
        ]
        edges = [
            self.format_edge_for_cytoscape(u, v, k, data)
            for u, v, k, data in subgraph.edges(keys=True, data=True)
        ]

        return {"nodes": nodes, "edges": edges}

    def get_place_attributes(self, place_id: str) -> Dict[str, Any]:
        """Extract all connected semantic tags and metadata for a place node."""
        node_id = f"place:{place_id}" if not place_id.startswith("place:") else place_id
        if not self._graph.has_node(node_id):
            return {}

        node_data = self._graph.nodes[node_id]
        props = dict(node_data.get("properties", {}))

        companions = []
        atmospheres = []
        categories = []
        interests = []
        times_of_day = []
        nearby_places = []

        for _, target, data in self._graph.out_edges(node_id, data=True):
            rel = data.get("relation")
            t_data = self._graph.nodes[target]
            t_type = t_data.get("type")
            t_label = t_data.get("label", target)

            if rel == RelationType.SUITABLE_FOR.value:
                companions.append(t_label.lower())
            elif rel == RelationType.HAS_ATMOSPHERE.value:
                atmospheres.append(t_label.lower())
            elif rel == RelationType.HAS_CATEGORY.value:
                categories.append(t_label)
            elif rel == RelationType.RECOMMENDED_FOR.value:
                if t_type == NodeType.TIME_OF_DAY.value:
                    times_of_day.append(t_label.lower())
                else:
                    interests.append(t_label)
            elif rel == RelationType.NEARBY_TO.value:
                dist = data.get("properties", {}).get("distance_km")
                nearby_places.append({
                    "id": target.replace("place:", ""),
                    "name": t_label,
                    "distance_km": dist,
                })

        props["connected_companions"] = companions
        props["connected_atmospheres"] = atmospheres
        props["connected_categories"] = categories
        props["connected_interests"] = interests
        props["connected_times_of_day"] = times_of_day
        props["nearby_places"] = nearby_places
        props["provenance"] = node_data.get("provenance")
        return props
