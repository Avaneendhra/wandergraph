import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np
from pathlib import Path

out_dir = Path("docs/figures")
out_dir.mkdir(parents=True, exist_ok=True)

# Set style
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial', 'Helvetica']

# =========================================================================
# FIGURE 1: END-TO-END ARCHITECTURE
# =========================================================================
fig, ax = plt.subplots(figsize=(10, 6), dpi=300)
ax.axis('off')

# Bounding boxes
# 1. Client Layer
rect_client = patches.FancyBboxPatch((0.05, 0.65), 0.9, 0.28, boxstyle="round,pad=0.03", fc="#f0f4f8", ec="#2b6cb0", lw=2)
ax.add_patch(rect_client)
ax.text(0.07, 0.88, "CLIENT LAYER: React 18 / TypeScript SPA (Vite + Tailwind CSS)", fontsize=11, fontweight='bold', color="#2b6cb0")

# Client Components
components_client = [
    ("Search & Filter UI\n(Typo-Tolerant)", 0.08, 0.69, 0.18, 0.15, "#ebf8ff", "#3182ce"),
    ("Interactive Knowledge\nGraph Explorer (Canvas)", 0.29, 0.69, 0.21, 0.15, "#ebf8ff", "#3182ce"),
    ("AI Itinerary Chatbot\n(Floating Drawer)", 0.53, 0.69, 0.19, 0.15, "#ebf8ff", "#3182ce"),
    ("Place Discovery Cards\n(Local Currency ₹/¥)", 0.75, 0.69, 0.18, 0.15, "#ebf8ff", "#3182ce"),
]
for title, x, y, w, h, bg, border in components_client:
    r = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02", fc=bg, ec=border, lw=1.5)
    ax.add_patch(r)
    ax.text(x + w/2, y + h/2, title, fontsize=8.5, ha='center', va='center', fontweight='medium')

# 2. Backend Service Layer
rect_backend = patches.FancyBboxPatch((0.05, 0.28), 0.9, 0.32, boxstyle="round,pad=0.03", fc="#f7fafc", ec="#2d3748", lw=2)
ax.add_patch(rect_backend)
ax.text(0.07, 0.55, "SERVICE LAYER: FastAPI Backend (Python 3.14/3.11)", fontsize=11, fontweight='bold', color="#2d3748")

services_backend = [
    ("NetworkX MultiDiGraph\n(689 Nodes, 2,231 Edges)", 0.08, 0.33, 0.26, 0.18, "#e2e8f0", "#4a5568"),
    ("Recommendation &\nExplainability Engine", 0.37, 0.33, 0.26, 0.18, "#feebc8", "#dd6b20"),
    ("Grounded Itinerary &\nImage Resolver", 0.66, 0.33, 0.27, 0.18, "#e9d8fd", "#805ad5"),
]
for title, x, y, w, h, bg, border in services_backend:
    r = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02", fc=bg, ec=border, lw=1.5)
    ax.add_patch(r)
    ax.text(x + w/2, y + h/2, title, fontsize=9, ha='center', va='center', fontweight='bold')

# 3. External API & Integration Layer
rect_ext = patches.FancyBboxPatch((0.05, 0.03), 0.9, 0.2, boxstyle="round,pad=0.03", fc="#fffaf0", ec="#c05621", lw=1.5)
ax.add_patch(rect_ext)
ax.text(0.07, 0.19, "EXTERNAL APIS & KNOWLEDGE SOURCES", fontsize=10, fontweight='bold', color="#c05621")

apis = [
    ("Google Places API (New)\n[SearchNearby Fallback]", 0.08, 0.06, 0.26, 0.11, "#fff", "#dd6b20"),
    ("Google Gemini 3.5 Flash-Lite\n[Grounded AI Planner]", 0.37, 0.06, 0.26, 0.11, "#fff", "#805ad5"),
    ("Wikimedia Commons API\n[Authentic Place Photos]", 0.66, 0.06, 0.27, 0.11, "#fff", "#319795"),
]
for title, x, y, w, h, bg, border in apis:
    r = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.01", fc=bg, ec=border, lw=1.2)
    ax.add_patch(r)
    ax.text(x + w/2, y + h/2, title, fontsize=8, ha='center', va='center')

# Arrows
ax.annotate('', xy=(0.5, 0.65), xytext=(0.5, 0.60), arrowprops=dict(arrowstyle="<->", lw=2, color="#4a5568"))
ax.annotate('', xy=(0.5, 0.28), xytext=(0.5, 0.23), arrowprops=dict(arrowstyle="<->", lw=2, color="#4a5568"))

plt.title("Figure 1: WanderGraph High-Level Architectural Pipeline", fontsize=13, fontweight='bold', pad=15)
plt.tight_layout()
plt.savefig(out_dir / "figure1_architecture.png", dpi=300)
plt.close()

# =========================================================================
# FIGURE 2: KNOWLEDGE GRAPH ONTOLOGY SCHEMA
# =========================================================================
fig, ax = plt.subplots(figsize=(9, 6), dpi=300)
ax.axis('off')

# Central Node: Place
r_place = patches.FancyBboxPatch((0.38, 0.42), 0.24, 0.16, boxstyle="round,pad=0.03", fc="#ebf8ff", ec="#2b6cb0", lw=2.5)
ax.add_patch(r_place)
ax.text(0.5, 0.52, "ENTITY: Place", fontsize=11, fontweight='bold', ha='center', va='center', color="#2b6cb0")
ax.text(0.5, 0.46, "76 Verified Venues\n(Coords, Hours, Fees)", fontsize=8, ha='center', va='center')

# Peripheral Entities
entities = [
    ("City\n(4 Nodes)", 0.05, 0.75, "#c6f6d5", "#276749", "LOCATED_IN (140)"),
    ("Category\n(34 Nodes)", 0.70, 0.75, "#fed7d7", "#9b2c2c", "HAS_CATEGORY (76)"),
    ("CompanionType\n(5 Nodes)", 0.05, 0.15, "#feebc8", "#c05621", "SUITABLE_FOR (283)"),
    ("Atmosphere\n(50 Nodes)", 0.70, 0.15, "#e9d8fd", "#6b46c1", "HAS_ATMOSPHERE (349)"),
    ("TimeOfDay\n(4 Nodes)", 0.38, 0.82, "#e2e8f0", "#4a5568", "RECOMMENDED_FOR (496)"),
    ("Nearby Place\n(Geospatial)", 0.38, 0.08, "#feebc8", "#b7791f", "NEARBY_TO (426, d <= 4km)"),
]

for name, x, y, bg, border, edge_label in entities:
    r = patches.FancyBboxPatch((x, y), 0.22, 0.12, boxstyle="round,pad=0.02", fc=bg, ec=border, lw=1.8)
    ax.add_patch(r)
    ax.text(x + 0.11, y + 0.06, name, fontsize=9, fontweight='bold', ha='center', va='center', color=border)

# Edges
# Place to City
ax.annotate('', xy=(0.27, 0.78), xytext=(0.42, 0.58), arrowprops=dict(arrowstyle="->", lw=1.8, color="#276749"))
ax.text(0.28, 0.65, "LOCATED_IN", fontsize=7.5, fontweight='bold', color="#276749", rotation=30)

# Place to Category
ax.annotate('', xy=(0.73, 0.78), xytext=(0.58, 0.58), arrowprops=dict(arrowstyle="->", lw=1.8, color="#9b2c2c"))
ax.text(0.64, 0.65, "HAS_CATEGORY", fontsize=7.5, fontweight='bold', color="#9b2c2c", rotation=-30)

# Place to Companion
ax.annotate('', xy=(0.27, 0.22), xytext=(0.42, 0.42), arrowprops=dict(arrowstyle="->", lw=1.8, color="#c05621"))
ax.text(0.26, 0.33, "SUITABLE_FOR", fontsize=7.5, fontweight='bold', color="#c05621", rotation=-30)

# Place to Atmosphere
ax.annotate('', xy=(0.73, 0.22), xytext=(0.58, 0.42), arrowprops=dict(arrowstyle="->", lw=1.8, color="#6b46c1"))
ax.text(0.62, 0.33, "HAS_ATMOSPHERE", fontsize=7.5, fontweight='bold', color="#6b46c1", rotation=30)

# Place to TimeOfDay
ax.annotate('', xy=(0.5, 0.82), xytext=(0.5, 0.58), arrowprops=dict(arrowstyle="->", lw=1.8, color="#4a5568"))
ax.text(0.52, 0.70, "RECOMMENDED_FOR", fontsize=7.5, fontweight='bold', color="#4a5568")

# Place to Nearby Place
ax.annotate('', xy=(0.5, 0.20), xytext=(0.5, 0.42), arrowprops=dict(arrowstyle="<->", lw=1.8, color="#b7791f"))
ax.text(0.52, 0.29, "NEARBY_TO (Bidirectional)", fontsize=7.5, fontweight='bold', color="#b7791f")

plt.title("Figure 2: Formal WanderGraph MultiDiGraph Ontology & Relationships", fontsize=13, fontweight='bold', pad=15)
plt.tight_layout()
plt.savefig(out_dir / "figure2_ontology.png", dpi=300)
plt.close()

# =========================================================================
# FIGURE 3: GRAPH METRICS & DISTRIBUTIONS
# =========================================================================
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 4.5), dpi=300)

# Bar chart of Node Types
node_labels = ['Interest\n(272)', 'Activity\n(175)', 'Place\n(76)', 'Neighborh.\n(64)', 'Atmosphere\n(50)', 'Category\n(34)', 'Others\n(18)']
node_counts = [272, 175, 76, 64, 50, 34, 18]
colors = ['#3182ce', '#63b3ed', '#dd6b20', '#319795', '#805ad5', '#e53e3e', '#718096']

bars = ax1.bar(node_labels, node_counts, color=colors, edgecolor='#2d3748', lw=1)
ax1.set_ylabel("Node Count (|V|)", fontsize=10, fontweight='bold')
ax1.set_title("Node Entity Distribution (|V| = 689)", fontsize=11, fontweight='bold')
ax1.grid(axis='y', linestyle='--', alpha=0.6)
for bar in bars:
    yval = bar.get_height()
    ax1.text(bar.get_x() + bar.get_width()/2.0, yval + 5, int(yval), ha='center', va='bottom', fontsize=8.5, fontweight='bold')

# Bar chart of Edges by Relation
edge_labels = ['RECOMMENDED\n_FOR (496)', 'NEARBY_TO\n(426)', 'HAS_ATMO\nSPHERE (349)', 'SUITABLE\n_FOR (283)', 'SUPPORTS\nACTIVITY (247)', 'LOCATED_IN\n(140)', 'Others\n(290)']
edge_counts = [496, 426, 349, 283, 247, 140, 290]
edge_colors = ['#805ad5', '#dd6b20', '#6b46c1', '#dd6b20', '#3182ce', '#276749', '#718096']

bars2 = ax2.bar(edge_labels, edge_counts, color=edge_colors, edgecolor='#2d3748', lw=1)
ax2.set_ylabel("Edge Count (|E|)", fontsize=10, fontweight='bold')
ax2.set_title("Edge Relation Distribution (|E| = 2,231)", fontsize=11, fontweight='bold')
ax2.grid(axis='y', linestyle='--', alpha=0.6)
for bar in bars2:
    yval = bar.get_height()
    ax2.text(bar.get_x() + bar.get_width()/2.0, yval + 8, int(yval), ha='center', va='bottom', fontsize=8.5, fontweight='bold')

plt.tight_layout()
plt.savefig(out_dir / "figure3_graph_metrics.png", dpi=300)
plt.close()

print("Generated all architectural and graph metric figures in docs/figures/")
