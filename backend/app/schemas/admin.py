from pydantic import BaseModel


class AdminStats(BaseModel):
    total_users: int
    total_agencies: int
    total_brokers: int
    total_properties: int
    total_leads: int
    recent_registrations: int
