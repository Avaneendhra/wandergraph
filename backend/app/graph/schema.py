from enum import Enum
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field


class NodeType(str, Enum):
    PLACE = "Place"
    CITY = "City"
    NEIGHBORHOOD = "Neighborhood"
    CATEGORY = "Category"
    ACTIVITY = "Activity"
    INTEREST = "Interest"
    COMPANION_TYPE = "CompanionType"
    ATMOSPHERE = "Atmosphere"
    PRICE_RANGE = "PriceRange"
    TIME_OF_DAY = "TimeOfDay"
    AMENITY = "Amenity"
    ACCESSIBILITY_FEATURE = "AccessibilityFeature"


class RelationType(str, Enum):
    LOCATED_IN = "LOCATED_IN"
    IN_NEIGHBORHOOD = "IN_NEIGHBORHOOD"
    HAS_CATEGORY = "HAS_CATEGORY"
    SUPPORTS_ACTIVITY = "SUPPORTS_ACTIVITY"
    SUITABLE_FOR = "SUITABLE_FOR"
    HAS_AMENITY = "HAS_AMENITY"
    HAS_ACCESSIBILITY_FEATURE = "HAS_ACCESSIBILITY_FEATURE"
    HAS_PRICE_RANGE = "HAS_PRICE_RANGE"
    HAS_ATMOSPHERE = "HAS_ATMOSPHERE"
    RECOMMENDED_FOR = "RECOMMENDED_FOR"
    RELATED_TO = "RELATED_TO"
    NEARBY_TO = "NEARBY_TO"


class VerificationStatus(str, Enum):
    SOURCE_RETURNED = "source_returned"
    INDEPENDENTLY_VERIFIED = "independently_verified"
    USER_SUPPLIED = "user_supplied"
    INFERRED = "inferred"
    UNKNOWN = "unknown"
    STALE = "stale"
    DISPUTED = "disputed"


class DataProvenance(BaseModel):
    source: str
    verification_status: VerificationStatus = VerificationStatus.UNKNOWN
    retrieval_date: Optional[str] = None
    confidence: Optional[str] = "medium"
    source_url: Optional[str] = None


class GraphNode(BaseModel):
    id: str
    label: str
    type: NodeType
    properties: Dict[str, Any] = Field(default_factory=dict)
    provenance: Optional[DataProvenance] = None


class GraphEdge(BaseModel):
    source: str
    target: str
    relation: RelationType
    properties: Dict[str, Any] = Field(default_factory=dict)
    provenance: Optional[DataProvenance] = None
