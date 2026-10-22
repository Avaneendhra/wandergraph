import pytest
from app.graph.builder import build_knowledge_graph
from app.graph.schema import NodeType, RelationType
from app.services.graph_service import GraphService


def test_knowledge_graph_structure():
    g = build_knowledge_graph()
    assert g.number_of_nodes() > 20
    assert g.number_of_edges() > 40

    # Verify cities exist
    assert g.has_node("city:hyderabad")
    assert g.has_node("city:tokyo")
    assert g.has_node("city:kyoto")
    assert g.has_node("city:bengaluru")

    # Verify companion types
    assert g.has_node("companion:couples")
    assert g.has_node("companion:family")
    assert g.has_node("companion:solo")

    # Verify places have LOCATED_IN edges to their city
    charminar_edges = g.out_edges("place:hyd_charminar", data=True)
    relations = [data["relation"] for _, _, data in charminar_edges]
    assert RelationType.LOCATED_IN.value in relations
    assert RelationType.HAS_CATEGORY.value in relations
    assert RelationType.SUITABLE_FOR.value in relations


def test_graph_service_stats_and_subgraphs():
    service = GraphService()
    stats = service.get_stats()
    assert stats["total_nodes"] > 20
    assert stats["total_edges"] > 40
    assert NodeType.PLACE.value in stats["nodes_by_type"]

    # Subgraph for Kyoto
    kyoto_subgraph = service.get_subgraph_for_city("kyoto")
    assert len(kyoto_subgraph["nodes"]) > 0
    assert len(kyoto_subgraph["edges"]) > 0

    # Verify node format for Cytoscape
    first_node = kyoto_subgraph["nodes"][0]
    assert "data" in first_node
    assert "id" in first_node["data"]
    assert "label" in first_node["data"]
    assert "color" in first_node["data"]


def test_place_attributes_extraction():
    service = GraphService()
    attrs = service.get_place_attributes("hyd_charminar")
    assert attrs["name"] == "Charminar"
    assert "connected_companions" in attrs
    assert "connected_atmospheres" in attrs
    assert "family" in attrs["connected_companions"]
    assert "historical" in attrs["connected_atmospheres"]
