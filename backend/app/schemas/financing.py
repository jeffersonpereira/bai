from pydantic import BaseModel
from typing import List, Optional

class SimulationRequest(BaseModel):
    property_value: float
    down_payment: float
    term_months: int
    user_income: float
    amortization_type: str = "SAC"  # SAC | PRICE

class BankOffer(BaseModel):
    bank_name: str
    interest_rate: float
    first_installment: float
    last_installment: float
    total_paid: float
    total_interest: float
    is_best_offer: bool = False
    max_financing_reached: bool = False

class SimulationResponse(BaseModel):
    offers: List[BankOffer]
