from fastapi import APIRouter, Depends, HTTPException
from ..schemas.financing import SimulationRequest, SimulationResponse
from ..services.financing_service import FinancingService

router = APIRouter(
    prefix="/financing",
    tags=["financing"]
)

@router.post("/simulate", response_model=SimulationResponse)
async def simulate_financing(request: SimulationRequest):
    try:
        service = FinancingService()
        return service.calculate_simulation(request)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
