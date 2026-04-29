from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException

from app.models.imovel import Imovel
from app.models.perfil_comprador import PerfilComprador
from app.models.usuario import Usuario
from app.schemas.match import (
    BuyerProfileBase, BuyerProfileResponse, UserMatchResponse,
    ScoredPropertyMatch, PropertyMatchSummary,
)


def get_profiles(db: Session, usuario_id: int) -> list:
    return db.query(PerfilComprador).filter(PerfilComprador.usuario_id == usuario_id).all()


def get_profile(db: Session, profile_id: int, usuario_id: int) -> PerfilComprador:
    profile = db.query(PerfilComprador).filter(
        PerfilComprador.id == profile_id,
        PerfilComprador.usuario_id == usuario_id,
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    return profile


def create_profile(db: Session, profile_in: BuyerProfileBase, usuario_id: int) -> PerfilComprador:
    profile = PerfilComprador(**profile_in.model_dump(), usuario_id=usuario_id)
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def update_profile(db: Session, profile_id: int, profile_in: BuyerProfileBase, usuario_id: int) -> PerfilComprador:
    profile = get_profile(db, profile_id, usuario_id)
    for key, value in profile_in.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return profile


def delete_profile(db: Session, profile_id: int, usuario_id: int) -> dict:
    profile = get_profile(db, profile_id, usuario_id)
    db.delete(profile)
    db.commit()
    return {"message": "Perfil deletado com sucesso"}


def _build_properties_query(db: Session, profile: PerfilComprador, expanded: bool = False):
    query = db.query(Imovel).filter(Imovel.situacao == "ativo")

    if profile.tipo_oferta:
        query = query.filter(Imovel.tipo_oferta == profile.tipo_oferta)
    if profile.tipo_imovel:
        query = query.filter(Imovel.tipo_imovel.ilike(f"%{profile.tipo_imovel}%"))
    if profile.cidade:
        query = query.filter(Imovel.cidade.ilike(f"%{profile.cidade}%"))

    if not expanded:
        if profile.preco_minimo:
            query = query.filter(Imovel.preco >= profile.preco_minimo)
        if profile.preco_maximo:
            query = query.filter(Imovel.preco <= profile.preco_maximo)
        if profile.bairro:
            terms = [t.strip() for t in profile.bairro.split(",") if t.strip()]
            if terms:
                query = query.filter(or_(*[Imovel.bairro.ilike(f"%{t}%") for t in terms]))
        if profile.quartos_minimo:
            query = query.filter(Imovel.quartos >= profile.quartos_minimo)
        if profile.banheiros_minimo:
            query = query.filter(Imovel.banheiros >= profile.banheiros_minimo)
        if profile.vagas_minimo:
            query = query.filter(Imovel.vagas >= profile.vagas_minimo)
    else:
        if profile.preco_minimo:
            query = query.filter(Imovel.preco >= profile.preco_minimo * 0.8)
        if profile.preco_maximo:
            query = query.filter(Imovel.preco <= profile.preco_maximo * 1.20)
        if profile.quartos_minimo and profile.quartos_minimo > 1:
            query = query.filter(Imovel.quartos >= profile.quartos_minimo - 1)

    return query


def get_matching_properties(db: Session, profile_id: int, usuario_id: int, expanded: bool = False) -> list:
    profile = get_profile(db, profile_id, usuario_id)
    return _build_properties_query(db, profile, expanded=expanded).limit(50).all()


def _score_property(profile: PerfilComprador, prop: Imovel) -> tuple[int, list[str], list[str]]:
    matched: list[str] = []
    unmatched: list[str] = []

    def check(label: str, condition: bool | None) -> None:
        if condition is None:
            return
        (matched if condition else unmatched).append(label)

    if profile.preco_minimo or profile.preco_maximo:
        in_range = (
            (not profile.preco_minimo or float(prop.preco) >= float(profile.preco_minimo))
            and (not profile.preco_maximo or float(prop.preco) <= float(profile.preco_maximo))
        )
        check("Preço", in_range)

    if profile.cidade:
        check("Cidade", profile.cidade.lower() in (prop.cidade or "").lower())

    if profile.bairro:
        terms = [t.strip().lower() for t in profile.bairro.split(",") if t.strip()]
        prop_nb = (prop.bairro or "").lower()
        check("Bairro", any(t in prop_nb for t in terms))

    if profile.tipo_imovel:
        check("Tipo", profile.tipo_imovel.lower() in (prop.tipo_imovel or "").lower())

    if profile.tipo_oferta:
        check("Modalidade", profile.tipo_oferta == prop.tipo_oferta)

    if profile.quartos_minimo is not None:
        check("Quartos", prop.quartos is not None and prop.quartos >= profile.quartos_minimo)

    if profile.banheiros_minimo is not None:
        check("Banheiros", prop.banheiros is not None and prop.banheiros >= profile.banheiros_minimo)

    if profile.vagas_minimo is not None:
        check("Garagem", prop.vagas is not None and prop.vagas >= profile.vagas_minimo)

    total = len(matched) + len(unmatched)
    score = 100 if total == 0 else int((len(matched) / total) * 100)
    return score, matched, unmatched


def get_scored_matching_properties(
    db: Session,
    profile_id: int,
    usuario_id: int,
    min_score: int = 40,
    limit: int = 50,
) -> list[ScoredPropertyMatch]:
    profile = get_profile(db, profile_id, usuario_id)
    properties = _build_properties_query(db, profile, expanded=True).limit(200).all()

    results: list[ScoredPropertyMatch] = []
    for prop in properties:
        score, matched, unmatched = _score_property(profile, prop)
        if score >= min_score:
            results.append(
                ScoredPropertyMatch(
                    property=PropertyMatchSummary.model_validate(prop),
                    score=score,
                    matched_criteria=matched,
                    unmatched_criteria=unmatched,
                )
            )

    results.sort(key=lambda x: x.score, reverse=True)
    return results[:limit]


def get_matching_buyers(db: Session, property_id: int, current_user: Usuario) -> list[UserMatchResponse]:
    prop = db.query(Imovel).filter(Imovel.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    if current_user.perfil not in ["imobiliaria", "corretor", "admin"] and prop.corretor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sem acesso")

    query = db.query(PerfilComprador, Usuario).join(Usuario, PerfilComprador.usuario_id == Usuario.id)

    if prop.tipo_oferta:
        query = query.filter(
            or_(PerfilComprador.tipo_oferta.is_(None), PerfilComprador.tipo_oferta == prop.tipo_oferta)
        )
    query = query.filter(
        or_(PerfilComprador.preco_maximo.is_(None), PerfilComprador.preco_maximo >= float(prop.preco) * 0.9),
        or_(PerfilComprador.preco_minimo.is_(None), PerfilComprador.preco_minimo <= float(prop.preco) * 1.1),
    )
    if prop.cidade:
        query = query.filter(
            or_(PerfilComprador.cidade.is_(None), PerfilComprador.cidade.ilike(f"%{prop.cidade}%"))
        )

    prop_cidade = (prop.cidade or "").lower()
    prop_bairro = (prop.bairro or "").lower()

    results = []
    for bp, user in query.all():
        score = 0
        total_criteria = 0

        if bp.preco_minimo or bp.preco_maximo:
            total_criteria += 2
            preco = float(prop.preco)
            in_range = (not bp.preco_minimo or preco >= float(bp.preco_minimo)) and (
                not bp.preco_maximo or preco <= float(bp.preco_maximo)
            )
            near_range = (not bp.preco_minimo or preco >= float(bp.preco_minimo) * 0.9) and (
                not bp.preco_maximo or preco <= float(bp.preco_maximo) * 1.1
            )
            if in_range:
                score += 2
            elif near_range:
                score += 1

        if bp.cidade:
            total_criteria += 1
            if bp.cidade.lower() in prop_cidade:
                score += 1

        if bp.bairro:
            total_criteria += 1
            terms = [t.strip().lower() for t in bp.bairro.split(",") if t.strip()]
            if any(t in prop_bairro for t in terms):
                score += 1

        if bp.quartos_minimo is not None and prop.quartos is not None:
            total_criteria += 1
            if prop.quartos >= bp.quartos_minimo:
                score += 1

        match_percentage = 100 if total_criteria == 0 else int((score / total_criteria) * 100)

        if match_percentage >= 40:
            results.append(
                UserMatchResponse(
                    usuario_id=user.id,
                    nome=user.nome,
                    email=user.email,
                    telefone=user.telefone,
                    match_score=match_percentage,
                    profile=BuyerProfileResponse.model_validate(bp),
                )
            )

    results.sort(key=lambda x: x.match_score, reverse=True)
    return results[:100]
