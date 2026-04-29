from fastapi import APIRouter, Depends, HTTPException
from ..schemas.financiamento import SimulationRequest, SimulationResponse
from ..services.financiamento_service import FinancingService
from ..models.usuario import Usuario
from app.core.deps import get_current_user

router = APIRouter(
    prefix="/financing",
    tags=["financing"]
)

@router.post("/simulate", response_model=SimulationResponse)
async def simulate_financing(
    request: SimulationRequest,
    current_user: Usuario = Depends(get_current_user),
):
    try:
        return FinancingService.calculate_simulation(request)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
