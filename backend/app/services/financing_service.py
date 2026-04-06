from typing import List
from ..schemas.financing import SimulationRequest, BankOffer, SimulationResponse

class FinancingService:
    BANKS = [
        {"name": "Caixa Econômica Federal", "rate_pa": 8.99},
        {"name": "Itaú Unibanco", "rate_pa": 9.50},
        {"name": "Bradesco", "rate_pa": 9.70},
        {"name": "Santander", "rate_pa": 10.20},
    ]

    @staticmethod
    def calculate_simulation(request: SimulationRequest) -> SimulationResponse:
        amount_to_finance = request.property_value - request.down_payment
        if amount_to_finance <= 0:
            return SimulationResponse(offers=[])

        offers = []
        for bank in FinancingService.BANKS:
            rate_month = (1 + (bank["rate_pa"] / 100)) ** (1/12) - 1
            months = request.term_months

            first_installment = 0
            last_installment = 0
            total_interest = 0
            
            if request.amortization_type == "SAC":
                # SAC: Amortização constante
                amort_const = amount_to_finance / months
                # Primeira parcela: amort + juros sobre saldo devedor total
                first_installment = amort_const + (amount_to_finance * rate_month)
                # Última parcela: amort + juros sobre a última amort
                last_installment = amort_const + (amort_const * rate_month)
                
                # Juros totais SAC: (P1 + Pn)/2 * n - TotalFinanciado
                total_paid = (first_installment + last_installment) / 2 * months
                total_interest = total_paid - amount_to_finance
            else:
                # PRICE: Parcelas iguais
                # P = V * (i * (1+i)^n) / ((1+i)^n - 1)
                p_base = amount_to_finance * (rate_month * (1 + rate_month)**months) / ((1 + rate_month)**months - 1)
                first_installment = p_base
                last_installment = p_base
                total_paid = p_base * months
                total_interest = total_paid - amount_to_finance

            # Regra de 30% da renda: as parcelas iniciais costumam ser o gargalo
            max_financing_reached = first_installment > (request.user_income * 0.3)

            offers.append(BankOffer(
                bank_name=bank["name"],
                interest_rate=bank["rate_pa"],
                first_installment=round(first_installment, 2),
                last_installment=round(last_installment, 2),
                total_paid=round(total_paid, 2),
                total_interest=round(total_interest, 2),
                max_financing_reached=max_financing_reached
            ))

        # Encontrar a melhor oferta (menor taxa ou menor valor total pago)
        best_offer = min(offers, key=lambda x: x.total_paid)
        for offer in offers:
            if offer.bank_name == best_offer.bank_name:
                offer.is_best_offer = True

        return SimulationResponse(offers=offers)
