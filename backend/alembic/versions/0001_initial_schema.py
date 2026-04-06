"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-03-30

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=True),
        sa.Column("role", sa.String(), nullable=True),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("creci", sa.String(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("parent_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint("id", name="pk_users"),
    )
    op.create_index("ix_users_id", "users", ["id"], unique=False)
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_role", "users", ["role"], unique=False)

    op.create_table(
        "owners",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("document", sa.String(), nullable=True),
        sa.Column("address", sa.String(), nullable=True),
        sa.Column("notes", sa.String(), nullable=True),
        sa.Column("broker_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint("id", name="pk_owners"),
    )
    op.create_index("ix_owners_id", "owners", ["id"], unique=False)
    op.create_index("ix_owners_email", "owners", ["email"], unique=False)

    op.create_table(
        "properties",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("price", sa.Float(), nullable=False),
        sa.Column("area", sa.Float(), nullable=True),
        sa.Column("bedrooms", sa.Integer(), nullable=True),
        sa.Column("bathrooms", sa.Integer(), nullable=True),
        sa.Column("garage_spaces", sa.Integer(), nullable=True),
        sa.Column("financing_eligible", sa.Boolean(), nullable=True),
        sa.Column("city", sa.String(), nullable=True),
        sa.Column("neighborhood", sa.String(), nullable=True),
        sa.Column("state", sa.String(), nullable=True),
        sa.Column("full_address", sa.String(), nullable=True),
        sa.Column("source_url", sa.String(), nullable=True),
        sa.Column("image_url", sa.String(), nullable=True),
        sa.Column("source", sa.String(), nullable=True),
        sa.Column("listing_type", sa.String(), nullable=True),
        sa.Column("property_type", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("actual_owner_id", sa.Integer(), sa.ForeignKey("owners.id"), nullable=True),
        sa.Column("commission_percentage", sa.Float(), nullable=True),
        sa.Column("market_score", sa.Float(), nullable=True),
        sa.Column("is_star", sa.Boolean(), nullable=True),
        sa.Column("last_analysis_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint("id", name="pk_properties"),
        sa.UniqueConstraint("source_url", name="uq_properties_source_url"),
    )
    op.create_index("ix_properties_id", "properties", ["id"], unique=False)
    op.create_index("ix_properties_title", "properties", ["title"], unique=False)
    op.create_index("ix_properties_price", "properties", ["price"], unique=False)
    op.create_index("ix_properties_city", "properties", ["city"], unique=False)
    op.create_index("ix_properties_neighborhood", "properties", ["neighborhood"], unique=False)
    op.create_index("ix_properties_state", "properties", ["state"], unique=False)
    op.create_index("ix_properties_listing_type", "properties", ["listing_type"], unique=False)
    op.create_index("ix_properties_property_type", "properties", ["property_type"], unique=False)
    op.create_index("ix_properties_status", "properties", ["status"], unique=False)

    op.create_table(
        "property_assignments",
        sa.Column("property_id", sa.Integer(), sa.ForeignKey("properties.id"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("role", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint("property_id", "user_id", name="pk_property_assignments"),
    )

    op.create_table(
        "property_media",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("property_id", sa.Integer(), sa.ForeignKey("properties.id"), nullable=True),
        sa.Column("media_type", sa.String(), nullable=True),
        sa.Column("url", sa.String(), nullable=True),
        sa.PrimaryKeyConstraint("id", name="pk_property_media"),
    )
    op.create_index("ix_property_media_id", "property_media", ["id"], unique=False)

    op.create_table(
        "property_availability",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("property_id", sa.Integer(), sa.ForeignKey("properties.id"), nullable=False),
        sa.Column("day_of_week", sa.Integer(), nullable=True),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_property_availability"),
    )
    op.create_index("ix_property_availability_id", "property_availability", ["id"], unique=False)

    op.create_table(
        "favorites",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("property_id", sa.Integer(), sa.ForeignKey("properties.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint("id", name="pk_favorites"),
    )
    op.create_index("ix_favorites_id", "favorites", ["id"], unique=False)

    op.create_table(
        "mandates",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("property_id", sa.Integer(), sa.ForeignKey("properties.id"), nullable=True),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("owners.id"), nullable=True),
        sa.Column("broker_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("type", sa.String(), nullable=True),
        sa.Column("commission_percentage", sa.Float(), nullable=True),
        sa.Column("is_exclusive", sa.Boolean(), nullable=True),
        sa.Column("expiry_date", sa.DateTime(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint("id", name="pk_mandates"),
    )
    op.create_index("ix_mandates_id", "mandates", ["id"], unique=False)

    op.create_table(
        "leads",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("property_id", sa.Integer(), sa.ForeignKey("properties.id"), nullable=True),
        sa.Column("broker_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("source", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("notes", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint("id", name="pk_leads"),
    )
    op.create_index("ix_leads_id", "leads", ["id"], unique=False)

    op.create_table(
        "lead_activities",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("lead_id", sa.Integer(), sa.ForeignKey("leads.id"), nullable=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("activity_type", sa.String(), nullable=True),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint("id", name="pk_lead_activities"),
    )
    op.create_index("ix_lead_activities_id", "lead_activities", ["id"], unique=False)

    op.create_table(
        "appointments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("property_id", sa.Integer(), sa.ForeignKey("properties.id"), nullable=False),
        sa.Column("broker_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("buyer_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("visitor_name", sa.String(), nullable=False),
        sa.Column("visitor_phone", sa.String(), nullable=False),
        sa.Column("visit_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("visit_end_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint("id", name="pk_appointments"),
    )
    op.create_index("ix_appointments_id", "appointments", ["id"], unique=False)

    op.create_table(
        "buyer_profiles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("name", sa.String(), nullable=True),
        sa.Column("min_price", sa.Float(), nullable=True),
        sa.Column("max_price", sa.Float(), nullable=True),
        sa.Column("city", sa.String(), nullable=True),
        sa.Column("neighborhood", sa.String(), nullable=True),
        sa.Column("property_type", sa.String(), nullable=True),
        sa.Column("listing_type", sa.String(), nullable=True),
        sa.Column("min_bedrooms", sa.Integer(), nullable=True),
        sa.Column("min_bathrooms", sa.Integer(), nullable=True),
        sa.Column("min_garage_spaces", sa.Integer(), nullable=True),
        sa.Column("financing_approved", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id", name="pk_buyer_profiles"),
    )
    op.create_index("ix_buyer_profiles_id", "buyer_profiles", ["id"], unique=False)
    op.create_index("ix_buyer_profiles_user_id", "buyer_profiles", ["user_id"], unique=False)

    op.create_table(
        "proposals",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("property_id", sa.Integer(), sa.ForeignKey("properties.id"), nullable=False),
        sa.Column("buyer_user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("buyer_name", sa.String(), nullable=False),
        sa.Column("buyer_email", sa.String(), nullable=True),
        sa.Column("buyer_phone", sa.String(), nullable=True),
        sa.Column("proposed_price", sa.Float(), nullable=False),
        sa.Column("payment_method", sa.String(), nullable=True),
        sa.Column("financing_percentage", sa.Float(), nullable=True),
        sa.Column("conditions", sa.String(), nullable=True),
        sa.Column("message", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("broker_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint("id", name="pk_proposals"),
    )
    op.create_index("ix_proposals_id", "proposals", ["id"], unique=False)
    op.create_index("ix_proposals_property_id", "proposals", ["property_id"], unique=False)
    op.create_index("ix_proposals_buyer_user_id", "proposals", ["buyer_user_id"], unique=False)
    op.create_index("ix_proposals_status", "proposals", ["status"], unique=False)


def downgrade() -> None:
    op.drop_table("proposals")
    op.drop_table("buyer_profiles")
    op.drop_table("appointments")
    op.drop_table("lead_activities")
    op.drop_table("leads")
    op.drop_table("mandates")
    op.drop_table("favorites")
    op.drop_table("property_availability")
    op.drop_table("property_media")
    op.drop_table("property_assignments")
    op.drop_table("properties")
    op.drop_table("owners")
    op.drop_table("users")
