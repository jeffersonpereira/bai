"""add missing FK indexes and composite indexes for performance

Revision ID: 0003
Revises: a37d4d92facc
Create Date: 2026-04-06

"""
from typing import Sequence, Union
from alembic import op

revision: str = '0003'
down_revision: Union[str, None] = 'a37d4d92facc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── FK indexes ausentes em leads ─────────────────────────────────────────
    op.create_index('ix_leads_broker_id', 'leads', ['broker_id'], unique=False)
    op.create_index('ix_leads_property_id', 'leads', ['property_id'], unique=False)

    # ── FK indexes ausentes em mandates ──────────────────────────────────────
    op.create_index('ix_mandates_broker_id', 'mandates', ['broker_id'], unique=False)
    op.create_index('ix_mandates_property_id', 'mandates', ['property_id'], unique=False)
    op.create_index('ix_mandates_owner_id', 'mandates', ['owner_id'], unique=False)

    # ── FK indexes ausentes em favorites ─────────────────────────────────────
    op.create_index('ix_favorites_user_id', 'favorites', ['user_id'], unique=False)
    op.create_index('ix_favorites_property_id', 'favorites', ['property_id'], unique=False)

    # ── FK indexes ausentes em property_media ────────────────────────────────
    op.create_index('ix_property_media_property_id', 'property_media', ['property_id'], unique=False)

    # ── FK indexes ausentes em property_availability ─────────────────────────
    op.create_index('ix_property_availability_property_id', 'property_availability', ['property_id'], unique=False)

    # ── FK indexes ausentes em appointments ──────────────────────────────────
    op.create_index('ix_appointments_broker_id', 'appointments', ['broker_id'], unique=False)
    op.create_index('ix_appointments_buyer_id', 'appointments', ['buyer_id'], unique=False)

    # ── FK indexes ausentes em lead_activities ───────────────────────────────
    op.create_index('ix_lead_activities_lead_id', 'lead_activities', ['lead_id'], unique=False)
    op.create_index('ix_lead_activities_user_id', 'lead_activities', ['user_id'], unique=False)

    # ── FK indexes ausentes em property_assignments ──────────────────────────
    op.create_index('ix_property_assignments_user_id', 'property_assignments', ['user_id'], unique=False)

    # ── FK indexes ausentes em owners ────────────────────────────────────────
    op.create_index('ix_owners_broker_id', 'owners', ['broker_id'], unique=False)

    # ── FK indexes ausentes em proposals ─────────────────────────────────────
    op.create_index('ix_proposals_broker_id', 'proposals', ['broker_id'], unique=False)
    op.create_index('ix_proposals_property_id', 'proposals', ['property_id'], unique=False)

    # ── Composite indexes para padrões de query mais comuns ──────────────────
    op.create_index('ix_proposals_property_status', 'proposals', ['property_id', 'status'], unique=False)
    op.create_index('ix_appointments_property_date', 'appointments', ['property_id', 'visit_date'], unique=False)
    op.create_index('ix_leads_property_broker', 'leads', ['property_id', 'broker_id'], unique=False)
    op.create_index('ix_comissoes_status_pagamento', 'comissoes', ['status_pagamento'], unique=False)

    # ── UniqueConstraint em favorites (previne race condition) ────────────────
    op.create_unique_constraint('uq_favorites_user_property', 'favorites', ['user_id', 'property_id'])


def downgrade() -> None:
    op.drop_constraint('uq_favorites_user_property', 'favorites', type_='unique')

    op.drop_index('ix_comissoes_status_pagamento', table_name='comissoes')
    op.drop_index('ix_leads_property_broker', table_name='leads')
    op.drop_index('ix_appointments_property_date', table_name='appointments')
    op.drop_index('ix_proposals_property_status', table_name='proposals')

    op.drop_index('ix_proposals_property_id', table_name='proposals')
    op.drop_index('ix_proposals_broker_id', table_name='proposals')
    op.drop_index('ix_owners_broker_id', table_name='owners')
    op.drop_index('ix_property_assignments_user_id', table_name='property_assignments')
    op.drop_index('ix_lead_activities_user_id', table_name='lead_activities')
    op.drop_index('ix_lead_activities_lead_id', table_name='lead_activities')
    op.drop_index('ix_appointments_buyer_id', table_name='appointments')
    op.drop_index('ix_appointments_broker_id', table_name='appointments')
    op.drop_index('ix_property_availability_property_id', table_name='property_availability')
    op.drop_index('ix_property_media_property_id', table_name='property_media')
    op.drop_index('ix_favorites_property_id', table_name='favorites')
    op.drop_index('ix_favorites_user_id', table_name='favorites')
    op.drop_index('ix_mandates_owner_id', table_name='mandates')
    op.drop_index('ix_mandates_property_id', table_name='mandates')
    op.drop_index('ix_mandates_broker_id', table_name='mandates')
    op.drop_index('ix_leads_property_id', table_name='leads')
    op.drop_index('ix_leads_broker_id', table_name='leads')
