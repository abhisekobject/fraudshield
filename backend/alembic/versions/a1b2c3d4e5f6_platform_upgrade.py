"""Platform upgrade: Phase B-K feature columns and tables

Revision ID: a1b2c3d4e5f6
Revises: 85cf6e9f9f3b
Create Date: 2026-08-16

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '85cf6e9f9f3b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Phase B: Explainable Risk Factors
    op.add_column('risk_reasons',
        sa.Column('source_engine', sa.String(length=64), nullable=True,
                  comment='Which engine generated this reason: RULE, ML, NLP, BEHAVIOR, DEVICE, RECIPIENT')
    )
    op.add_column('risk_reasons',
        sa.Column('contribution', sa.Float(), nullable=True,
                  comment='Contribution of this factor to the final risk score (0.0 - 1.0)')
    )
    op.add_column('risk_reasons',
        sa.Column('evidence', sa.String(length=1024), nullable=True,
                  comment='Supporting evidence text for this risk factor')
    )

    # Phase C: Transaction Intelligence Timeline
    op.create_table('transaction_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('transaction_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('event_type', sa.String(length=128), nullable=False),
        sa.Column('engine', sa.String(length=64), nullable=True),
        sa.Column('status', sa.String(length=64), nullable=False),
        sa.Column('explanation', sa.String(length=1024), nullable=True),
        sa.Column('risk_contribution', sa.Float(), nullable=True),
        sa.Column('occurred_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_transaction_events_transaction_id', 'transaction_events', ['transaction_id'])
    op.create_index('ix_transaction_events_occurred_at', 'transaction_events', ['occurred_at'])

    # Phase H: Analyst Case Management
    op.add_column('risk_events',
        sa.Column('case_status', sa.String(length=64), nullable=False,
                  server_default='NEW')
    )
    op.add_column('risk_events',
        sa.Column('assigned_to', sa.String(length=128), nullable=True)
    )
    op.add_column('risk_events',
        sa.Column('case_notes', sa.String(length=4096), nullable=True)
    )

    # Phase J: Privacy Audit Events
    op.create_table('privacy_audit_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('transaction_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('event_type', sa.String(length=128), nullable=False),
        sa.Column('detail', sa.String(length=1024), nullable=True),
        sa.Column('pii_types_detected', sa.String(length=512), nullable=True),
        sa.Column('redaction_count', sa.Integer(), nullable=True),
        sa.Column('occurred_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_privacy_audit_events_transaction_id', 'privacy_audit_events', ['transaction_id'])
    op.create_index('ix_privacy_audit_events_occurred_at', 'privacy_audit_events', ['occurred_at'])


def downgrade() -> None:
    op.drop_index('ix_privacy_audit_events_occurred_at', table_name='privacy_audit_events')
    op.drop_index('ix_privacy_audit_events_transaction_id', table_name='privacy_audit_events')
    op.drop_table('privacy_audit_events')

    op.drop_column('risk_events', 'case_notes')
    op.drop_column('risk_events', 'assigned_to')
    op.drop_column('risk_events', 'case_status')

    op.drop_index('ix_transaction_events_occurred_at', table_name='transaction_events')
    op.drop_index('ix_transaction_events_transaction_id', table_name='transaction_events')
    op.drop_table('transaction_events')

    op.drop_column('risk_reasons', 'evidence')
    op.drop_column('risk_reasons', 'contribution')
    op.drop_column('risk_reasons', 'source_engine')
