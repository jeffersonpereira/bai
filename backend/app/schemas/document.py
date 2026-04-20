from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List


class DocumentCreate(BaseModel):
    title:       str
    doc_type:    str
    description: Optional[str] = None
    file_name:   Optional[str] = None
    file_url:    Optional[str] = None
    file_size:   Optional[int] = None
    status:      str            = "rascunho"
    property_id: Optional[int] = None
    proposal_id: Optional[int] = None
    notes:       Optional[str] = None


class DocumentUpdate(BaseModel):
    title:       Optional[str] = None
    doc_type:    Optional[str] = None
    description: Optional[str] = None
    file_name:   Optional[str] = None
    file_url:    Optional[str] = None
    file_size:   Optional[int] = None
    status:      Optional[str] = None
    notes:       Optional[str] = None


class UploaderSummary(BaseModel):
    id:   int
    name: str

    model_config = ConfigDict(from_attributes=True)


class PropertySummary(BaseModel):
    id:    int
    title: str

    model_config = ConfigDict(from_attributes=True)


class ProposalSummary(BaseModel):
    id:            int
    proposed_price: float
    status:        str

    model_config = ConfigDict(from_attributes=True)


class DocumentResponse(BaseModel):
    id:          int
    title:       str
    doc_type:    str
    description: Optional[str]
    file_name:   Optional[str]
    file_url:    Optional[str]
    file_size:   Optional[int]
    status:      str
    uploaded_by: int
    property_id: Optional[int]
    proposal_id: Optional[int]
    notes:       Optional[str]
    created_at:  datetime
    updated_at:  datetime
    uploader:    Optional[UploaderSummary]
    property:    Optional[PropertySummary]
    proposal:    Optional[ProposalSummary]

    model_config = ConfigDict(from_attributes=True)


class PaginatedDocuments(BaseModel):
    items: List[DocumentResponse]
    total: int
    page:  int
    limit: int
