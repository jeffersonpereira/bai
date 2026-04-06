from pydantic import BaseModel, ConfigDict
from datetime import datetime


class AppointmentCreate(BaseModel):
    property_id: int
    visitor_name: str
    visitor_phone: str
    visit_date: datetime
    visit_end_time: datetime | None = None
    notes: str | None = None


class AppointmentResponse(BaseModel):
    id: int
    property_id: int
    broker_id: int | None = None
    buyer_id: int | None = None
    visitor_name: str
    visitor_phone: str
    visit_date: datetime
    visit_end_time: datetime | None = None
    status: str
    notes: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
