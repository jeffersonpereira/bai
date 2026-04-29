import hashlib
import re
import time as time_module
import unicodedata
from sqlalchemy import or_, text, func
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from typing import List

from app.models.imovel import Imovel
from app.models.usuario import Usuario
from app.models.responsavel import ResponsavelImovel
from app.models.midia import MidiaImovel
from app.models.disponibilidade import DisponibilidadeImovel
from app.models.favorito import Favorito
from app.models.lead import Lead
from app.models.mandato import Mandato
from app.schemas.imovel import ImovelCriar, PaginatedPropertiesResponse
from app.core.config import settings

_LOCATIONS_CACHE: dict = {"data": None, "expiry": 0}
_CACHE_TTL = 300

_MAP_CACHE: dict = {}
_MAP_CACHE_TTL = 30


def _make_slug(titulo: str, prop_id: int) -> str:
    normalized = unicodedata.normalize("NFD", titulo)
    ascii_str = "".join(c for c in normalized if unicodedata.category(c) != "Mn")
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_str.lower()).strip("-")
    return f"{slug}-{prop_id}"


def get_map_properties(
    db: Session,
    south: float,
    west: float,
    north: float,
    east: float,
    price_min: float | None = None,
    price_max: float | None = None,
    property_type: str | None = None,
    bedrooms: int | None = None,
) -> list[dict]:
    cache_key = hashlib.md5(
        f"{south}:{west}:{north}:{east}:{price_min}:{price_max}:{property_type}:{bedrooms}".encode()
    ).hexdigest()

    now = time_module.time()
    cached = _MAP_CACHE.get(cache_key)
    if cached and now < cached["expiry"]:
        return cached["data"]

    is_postgres = settings.DATABASE_URL.startswith(("postgresql", "postgres"))

    if is_postgres:
        parts = [
            "situacao = 'ativo'",
            "localizacao IS NOT NULL",
            "localizacao && ST_MakeEnvelope(:west, :south, :east, :north, 4326)",
        ]
        params: dict = {"south": south, "west": west, "north": north, "east": east}
        if price_min is not None:
            parts.append("preco >= :price_min")
            params["price_min"] = price_min
        if price_max is not None:
            parts.append("preco <= :price_max")
            params["price_max"] = price_max
        if property_type:
            parts.append("tipo_imovel = :property_type")
            params["property_type"] = property_type
        if bedrooms is not None:
            parts.append("quartos >= :bedrooms")
            params["bedrooms"] = bedrooms

        sql = text(
            "SELECT id, latitude, longitude, preco, tipo_imovel, url_imagem, titulo "
            f"FROM imoveis WHERE {' AND '.join(parts)} LIMIT 500"
        )
        rows = db.execute(sql, params).fetchall()
    else:
        query = db.query(
            Imovel.id, Imovel.latitude, Imovel.longitude, Imovel.preco,
            Imovel.tipo_imovel, Imovel.url_imagem, Imovel.titulo,
        ).filter(
            Imovel.situacao == "ativo",
            Imovel.latitude.isnot(None),
            Imovel.longitude.isnot(None),
            Imovel.latitude >= south,
            Imovel.latitude <= north,
            Imovel.longitude >= west,
            Imovel.longitude <= east,
        )
        if price_min is not None:
            query = query.filter(Imovel.preco >= price_min)
        if price_max is not None:
            query = query.filter(Imovel.preco <= price_max)
        if property_type:
            query = query.filter(Imovel.tipo_imovel == property_type)
        if bedrooms is not None:
            query = query.filter(Imovel.quartos >= bedrooms)
        rows = query.limit(500).all()

    result = [
        {
            "id": row.id,
            "lat": float(row.latitude) if row.latitude is not None else None,
            "lng": float(row.longitude) if row.longitude is not None else None,
            "price": float(row.preco) if row.preco is not None else None,
            "type": row.tipo_imovel,
            "thumbnail_url": row.url_imagem,
            "slug": _make_slug(row.titulo, row.id),
        }
        for row in rows
    ]

    _MAP_CACHE[cache_key] = {"data": result, "expiry": now + _MAP_CACHE_TTL}
    return result


def get_locations(db: Session) -> dict:
    now = time_module.time()
    if _LOCATIONS_CACHE["data"] and now < _LOCATIONS_CACHE["expiry"]:
        return _LOCATIONS_CACHE["data"]

    rows = db.query(Imovel.cidade, Imovel.bairro).filter(
        Imovel.situacao == "ativo",
        Imovel.cidade.isnot(None),
        Imovel.bairro.isnot(None),
    ).distinct().limit(5000).all()

    locations: dict = {}
    for cidade, bairro in rows:
        c = cidade.strip()
        n = bairro.strip()
        if not c or not n:
            continue
        if c not in locations:
            locations[c] = set()
        locations[c].add(n)

    result = {c: sorted(list(ns)) for c, ns in locations.items()}
    _LOCATIONS_CACHE["data"] = result
    _LOCATIONS_CACHE["expiry"] = now + _CACHE_TTL
    return result


def get_properties(
    db: Session,
    page: int,
    limit: int,
    city: str | None,
    neighborhood: str | None,
    min_price: float | None,
    max_price: float | None,
    min_area: float | None,
    max_area: float | None,
    bedrooms: int | None,
    bathrooms: int | None,
    garage_spaces: int | None,
    financing_eligible: bool | None,
    source: str | None,
    listing_type: str | None,
    property_type: List[str] | None,
    is_star: bool | None = None,
    sort: str | None = None,
) -> PaginatedPropertiesResponse:
    query = db.query(Imovel).filter(Imovel.situacao == "ativo")

    if city:
        query = query.filter(Imovel.cidade.ilike(f"%{city}%"))
    if neighborhood:
        terms = [t.strip() for t in neighborhood.split(",") if t.strip()]
        if terms:
            query = query.filter(or_(*[Imovel.bairro.ilike(f"%{t}%") for t in terms]))
    if min_price is not None:
        query = query.filter(Imovel.preco >= min_price)
    if max_price is not None:
        query = query.filter(Imovel.preco <= max_price)
    if min_area is not None:
        query = query.filter(Imovel.area >= min_area)
    if max_area is not None:
        query = query.filter(Imovel.area <= max_area)
    if bedrooms is not None:
        query = query.filter(Imovel.quartos >= bedrooms)
    if bathrooms is not None:
        query = query.filter(Imovel.banheiros >= bathrooms)
    if garage_spaces is not None:
        query = query.filter(Imovel.vagas >= garage_spaces)
    if financing_eligible:
        query = query.filter(Imovel.aceita_financiamento == True)
    if source:
        query = query.filter(Imovel.origem == source)
    if listing_type:
        query = query.filter(Imovel.tipo_oferta == listing_type)
    if property_type:
        query = query.filter(Imovel.tipo_imovel.in_(property_type))
    if is_star is not None:
        query = query.filter(Imovel.destaque == is_star)

    if sort == "price_asc":
        query = query.order_by(Imovel.preco.asc())
    elif sort == "price_desc":
        query = query.order_by(Imovel.preco.desc())
    elif sort == "views":
        query = query.order_by(Imovel.total_visualizacoes.desc(), Imovel.criado_em.desc())
    else:
        query = query.order_by(Imovel.criado_em.desc())

    total = query.count()
    skip = (page - 1) * limit
    items = query.options(joinedload(Imovel.midias)).offset(skip).limit(limit).all()

    return {"items": items, "total": total, "page": page, "limit": limit}


def increment_views_count(db: Session, property_id: int) -> int:
    property_obj = db.query(Imovel).filter(Imovel.id == property_id).first()
    if not property_obj:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    property_obj.total_visualizacoes = (property_obj.total_visualizacoes or 0) + 1
    db.commit()
    db.refresh(property_obj)
    return property_obj.total_visualizacoes


def get_property(db: Session, property_id: int) -> Imovel:
    prop = db.query(Imovel).filter(Imovel.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    return prop


def get_my_properties(
    db: Session,
    current_user: Usuario,
    page: int = 1,
    limit: int = 20,
    title: str | None = None,
    status: str | None = None,
) -> PaginatedPropertiesResponse:
    query = db.query(Imovel).options(joinedload(Imovel.midias))

    if current_user.perfil == "imobiliaria":
        broker_ids = [b.id for b in current_user.corretores]
        broker_ids.append(current_user.id)
        query = query.filter(Imovel.corretor_id.in_(broker_ids))
    elif current_user.perfil == "corretor" and current_user.imobiliaria_id is not None:
        query = query.filter(
            or_(
                Imovel.corretor_id == current_user.id,
                Imovel.corretores_atribuidos.any(Usuario.id == current_user.id),
            )
        )
    else:
        query = query.filter(Imovel.corretor_id == current_user.id)

    if title:
        query = query.filter(Imovel.titulo.ilike(f"%{title}%"))
    if status:
        query = query.filter(Imovel.situacao == status)

    total = query.count()
    skip = (page - 1) * limit
    items = query.order_by(Imovel.criado_em.desc()).offset(skip).limit(limit).all()

    return {"items": items, "total": total, "page": page, "limit": limit}


def get_property_stats(db: Session, current_user: Usuario) -> dict:
    query = db.query(Imovel)

    if current_user.perfil == "imobiliaria":
        broker_ids = [b.id for b in current_user.corretores]
        broker_ids.append(current_user.id)
        query = query.filter(Imovel.corretor_id.in_(broker_ids))
    elif current_user.perfil == "corretor" and current_user.imobiliaria_id is not None:
        query = query.filter(
            or_(
                Imovel.corretor_id == current_user.id,
                Imovel.corretores_atribuidos.any(Usuario.id == current_user.id),
            )
        )
    else:
        query = query.filter(Imovel.corretor_id == current_user.id)

    return {"total_properties": query.count()}


def create_property(db: Session, property_in: ImovelCriar, current_user: Usuario) -> Imovel:
    if current_user.perfil == "comprador" and (getattr(property_in, "situacao", "ativo") == "ativo"):
        active_count = db.query(Imovel).filter(
            Imovel.corretor_id == current_user.id,
            Imovel.situacao == "ativo",
        ).count()
        if active_count >= 1:
            raise HTTPException(
                status_code=403,
                detail="Você já possui um anúncio ativo. Quem vende por conta própria possui o limite de 1 anúncio gratuito. Pause seu anúncio atual ou faça assinatura para adicionar mais.",
            )

    property_data = property_in.model_dump(exclude={"midias", "janelas_disponibilidade"})
    property_data["corretor_id"] = current_user.id
    db_property = Imovel(**property_data)
    db.add(db_property)
    try:
        db.flush()
        for item in property_in.midias:
            db.add(MidiaImovel(imovel_id=db_property.id, url=item.url, tipo_midia=item.tipo_midia))
        for item in property_in.janelas_disponibilidade:
            db.add(DisponibilidadeImovel(imovel_id=db_property.id, **item.model_dump()))
        db.commit()
        db.refresh(db_property)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao salvar imóvel: {str(e)}")
    return db_property


def update_property(db: Session, property_id: int, property_in: ImovelCriar, current_user: Usuario) -> Imovel:
    db_property = get_property(db, property_id)

    if db_property.corretor_id != current_user.id and current_user.perfil != "imobiliaria":
        raise HTTPException(status_code=403, detail="Sem permissão para editar este imóvel")

    update_data = property_in.model_dump(exclude={"midias", "janelas_disponibilidade"}, exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_property, key, value)

    db.query(MidiaImovel).filter(MidiaImovel.imovel_id == property_id).delete()
    for item in property_in.midias:
        db.add(MidiaImovel(imovel_id=db_property.id, url=item.url, tipo_midia=item.tipo_midia))

    db.query(DisponibilidadeImovel).filter(DisponibilidadeImovel.imovel_id == property_id).delete()
    for item in property_in.janelas_disponibilidade:
        db.add(DisponibilidadeImovel(imovel_id=db_property.id, **item.model_dump()))

    try:
        db.commit()
        db.refresh(db_property)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao atualizar imóvel: {str(e)}")
    return db_property


def change_status(db: Session, property_id: int, status: str, current_user: Usuario) -> Imovel:
    valid_statuses = ["ativo", "arquivado", "pendente", "vendido", "alugado"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Situação inválida")
    prop = get_property(db, property_id)
    if prop.corretor_id != current_user.id and current_user.perfil not in ("imobiliaria", "admin"):
        raise HTTPException(status_code=403, detail="Sem permissão para alterar status deste imóvel")

    if status == "ativo" and prop.situacao != "ativo" and current_user.perfil == "comprador":
        active_count = db.query(Imovel).filter(
            Imovel.corretor_id == current_user.id,
            Imovel.situacao == "ativo",
        ).count()
        if active_count >= 1:
            raise HTTPException(
                status_code=403,
                detail="Você já possui um anúncio ativo. Quem vende por conta própria possui o limite de 1 anúncio gratuito. Pause seu anúncio atual para reativar este.",
            )

    prop.situacao = status
    db.commit()
    db.refresh(prop)
    return prop


def delete_property(db: Session, property_id: int, current_user: Usuario) -> None:
    db_property = get_property(db, property_id)

    if db_property.corretor_id != current_user.id and current_user.perfil not in ("imobiliaria", "admin"):
        raise HTTPException(status_code=403, detail="Sem permissão para excluir este imóvel")

    db.query(ResponsavelImovel).filter(ResponsavelImovel.imovel_id == property_id).delete()
    db.query(Favorito).filter(Favorito.imovel_id == property_id).delete()
    db.query(Lead).filter(Lead.imovel_id == property_id).update({"imovel_id": None})
    db.query(Mandato).filter(Mandato.imovel_id == property_id).delete()
    db.delete(db_property)

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao excluir imóvel: {str(e)}")


_ATRIBUTO_PREMIUM: dict[str, float] = {
    "piscina": 0.08,
    "academia": 0.04,
    "churrasqueira": 0.03,
    "portaria_24h": 0.05,
    "elevador": 0.04,
    "varanda": 0.03,
    "energia_solar": 0.04,
    "mobiliado": 0.06,
    "ar_condicionado": 0.03,
    "pet_friendly": 0.02,
}


def _atributos_premium_factor(atributos: dict | None) -> float:
    if not atributos:
        return 1.0
    factor = 1.0
    for key, pct in _ATRIBUTO_PREMIUM.items():
        if atributos.get(key):
            factor += pct
    return factor


def _avg_price_per_m2(db: Session, base_filters: list) -> tuple[float | None, int]:
    row = db.query(
        func.avg(Imovel.preco / Imovel.area).label("avg_ppm2"),
        func.count(Imovel.id).label("cnt"),
    ).filter(*base_filters).first()
    if not row or not row.avg_ppm2 or row.cnt == 0:
        return None, 0
    return float(row.avg_ppm2), int(row.cnt)


def analyze_price(
    db: Session,
    price: float,
    area: float | None,
    city: str | None,
    neighborhood: str | None,
    bedrooms: int | None,
    listing_type: str | None,
    atributos_extras: dict | None = None,
) -> dict:
    if not area or area <= 0:
        return {"status": "insufficient_data", "message": "Área necessária para análise de preço"}

    base_filters = [
        Imovel.situacao == "ativo",
        Imovel.area.isnot(None),
        Imovel.area > 0,
        Imovel.preco.isnot(None),
        Imovel.preco > 0,
    ]
    if listing_type:
        base_filters.append(Imovel.tipo_oferta == listing_type)
    if city:
        base_filters.append(Imovel.cidade.ilike(f"%{city}%"))

    # Try progressively broader scopes until we have data
    narrow_filters = list(base_filters)
    if neighborhood:
        narrow_filters.append(Imovel.bairro.ilike(f"%{neighborhood}%"))
    if bedrooms is not None:
        narrow_filters.append(Imovel.quartos.between(max(0, bedrooms - 1), bedrooms + 1))

    avg_ppm2, count = _avg_price_per_m2(db, narrow_filters)

    if avg_ppm2 is None and neighborhood:
        mid_filters = list(base_filters)
        mid_filters.append(Imovel.bairro.ilike(f"%{neighborhood}%"))
        avg_ppm2, count = _avg_price_per_m2(db, mid_filters)

    if avg_ppm2 is None:
        avg_ppm2, count = _avg_price_per_m2(db, base_filters)

    if avg_ppm2 is None:
        return {"status": "insufficient_data", "message": "Sem dados suficientes para esta localidade"}

    my_price_per_m2 = price / area
    premium_factor = _atributos_premium_factor(atributos_extras)
    adjusted_avg = avg_ppm2 * premium_factor
    variation_pct = (my_price_per_m2 - adjusted_avg) / adjusted_avg * 100

    if variation_pct > 10:
        signal = "acima"
    elif variation_pct < -10:
        signal = "abaixo"
    else:
        signal = "na_media"

    active_attrs = [k for k, v in (atributos_extras or {}).items() if v]

    return {
        "status": "ok",
        "signal": signal,
        "variation_pct": round(variation_pct, 1),
        "my_price_per_m2": round(my_price_per_m2, 2),
        "avg_price_per_m2": round(avg_ppm2, 2),
        "adjusted_avg_price_per_m2": round(adjusted_avg, 2),
        "premium_factor": round(premium_factor, 3),
        "active_attributes": active_attrs,
        "comparables_count": count,
    }


def assign_broker(db: Session, property_id: int, user_id: int, current_user: Usuario) -> dict:
    get_property(db, property_id)
    broker = db.query(Usuario).filter(Usuario.id == user_id, Usuario.imobiliaria_id == current_user.id).first()
    if not broker:
        raise HTTPException(status_code=404, detail="Corretor não encontrado na equipe")
    assignment = ResponsavelImovel(imovel_id=property_id, usuario_id=user_id)
    db.merge(assignment)
    db.commit()
    return {"message": f"Imóvel atribuído a {broker.nome}"}


def unassign_broker(db: Session, property_id: int, user_id: int) -> dict:
    assignment = db.query(ResponsavelImovel).filter(
        ResponsavelImovel.imovel_id == property_id,
        ResponsavelImovel.usuario_id == user_id,
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Atribuição não encontrada")
    db.delete(assignment)
    db.commit()
    return {"message": "Atribuição removida"}


def get_availability(db: Session, property_id: int):
    return db.query(DisponibilidadeImovel).filter(
        DisponibilidadeImovel.imovel_id == property_id
    ).all()


def update_availability(db: Session, property_id: int, availability_in: list, current_user: Usuario):
    prop = get_property(db, property_id)
    if prop.corretor_id != current_user.id and current_user.perfil != "imobiliaria":
        is_assigned = any(b.id == current_user.id for b in prop.corretores_atribuidos)
        if not is_assigned:
            raise HTTPException(status_code=403, detail="Acesso negado")

    db.query(DisponibilidadeImovel).filter(DisponibilidadeImovel.imovel_id == property_id).delete()
    for item in availability_in:
        db.add(DisponibilidadeImovel(**item.model_dump(), imovel_id=property_id))
    db.commit()
    return db.query(DisponibilidadeImovel).filter(DisponibilidadeImovel.imovel_id == property_id).all()
