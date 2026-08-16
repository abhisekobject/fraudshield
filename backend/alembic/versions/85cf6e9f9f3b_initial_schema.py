"""initial_schema

Revision ID: 85cf6e9f9f3b
Revises: 
Create Date: 2026-08-15 15:38:46.994537

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '85cf6e9f9f3b'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Users ---
    op.create_table('users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=320), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email', name='uq_users_email')
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=False)

    # --- Devices ---
    op.create_table('devices',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('device_fingerprint', sa.String(length=512), nullable=False, comment='Simulated device identifier — not real hardware fingerprint'),
        sa.Column('device_name', sa.String(length=255), nullable=True, comment="Human-readable label e.g. 'Pixel 9 Pro'"),
        sa.Column('first_seen_at', sa.DateTime(timezone=True), nullable=False, comment='When this device was first registered for this user (UTC)'),
        sa.Column('last_seen_at', sa.DateTime(timezone=True), nullable=False, comment='When this device was most recently used (UTC)'),
        sa.Column('is_trusted', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_devices_fingerprint', 'devices', ['device_fingerprint'], unique=False)
    op.create_index('ix_devices_user_id', 'devices', ['user_id'], unique=False)

    # --- Recipients ---
    op.create_table('recipients',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('recipient_identifier', sa.String(length=320), nullable=False, comment='Simulated UPI VPA or mobile number (not real banking data)'),
        sa.Column('display_name', sa.String(length=255), nullable=True, comment="Human-readable label e.g. 'Mom', 'Grocery Store'"),
        sa.Column('first_seen_at', sa.DateTime(timezone=True), nullable=False, comment='When this user first sent money to this recipient (UTC)'),
        sa.Column('last_transaction_at', sa.DateTime(timezone=True), nullable=True, comment='Timestamp of the most recent transaction to this recipient (UTC)'),
        sa.Column('transaction_count', sa.Integer(), nullable=False, comment='Cumulative count of transactions to this recipient'),
        sa.Column('is_trusted', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'recipient_identifier', name='uq_recipients_user_identifier')
    )
    op.create_index('ix_recipients_identifier', 'recipients', ['recipient_identifier'], unique=False)
    op.create_index('ix_recipients_user_id', 'recipients', ['user_id'], unique=False)

    # --- Transactions ---
    op.create_table('transactions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False, comment='User who initiated this payment'),
        sa.Column('recipient_id', postgresql.UUID(as_uuid=True), nullable=False, comment='Intended recipient of this payment'),
        sa.Column('device_id', postgresql.UUID(as_uuid=True), nullable=False, comment='Device from which this payment was initiated'),
        sa.Column('amount', sa.Numeric(precision=14, scale=2), nullable=False, comment='Payment amount in the specified currency (exact decimal)'),
        sa.Column('currency', sa.String(length=3), server_default='INR', nullable=False, comment='ISO 4217 currency code — defaults to INR for simulated UPI'),
        sa.Column('transaction_type', sa.String(length=32), nullable=False, comment='Category of simulated payment'),
        sa.Column('status', sa.String(length=32), nullable=False, comment='Current lifecycle state of the payment'),
        sa.Column('initiated_at', sa.DateTime(timezone=True), nullable=False, comment='When the payment was first created (UTC)'),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True, comment='When the payment reached a terminal state (UTC) — null if pending'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint('amount > 0', name='ck_transactions_amount_positive'),
        sa.ForeignKeyConstraint(['device_id'], ['devices.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['recipient_id'], ['recipients.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_transactions_device_id', 'transactions', ['device_id'], unique=False)
    op.create_index('ix_transactions_initiated_at', 'transactions', ['initiated_at'], unique=False)
    op.create_index('ix_transactions_recipient_id', 'transactions', ['recipient_id'], unique=False)
    op.create_index('ix_transactions_status', 'transactions', ['status'], unique=False)
    op.create_index('ix_transactions_user_id', 'transactions', ['user_id'], unique=False)
    op.create_index('ix_transactions_user_initiated', 'transactions', ['user_id', 'initiated_at'], unique=False)

    # --- Risk Events ---
    op.create_table('risk_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('transaction_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('risk_score', sa.Float(), nullable=False, comment='Normalized risk value between 0.0 and 1.0'),
        sa.Column('confidence', sa.Float(), nullable=True, comment="Normalized confidence between 0.0 and 1.0 (nullable if model doesn't support)"),
        sa.Column('risk_level', sa.String(length=32), nullable=False, comment='Categorical risk level (LOW, MEDIUM, HIGH, CRITICAL)'),
        sa.Column('intervention', sa.String(length=32), nullable=False, comment='Recommended intervention (PROCEED, WARNING, etc.)'),
        sa.Column('decision', sa.String(length=32), nullable=False, comment="User's eventual response (PENDING, CONFIRMED, CANCELLED)"),
        sa.Column('evaluation_version', sa.String(length=64), nullable=True, comment='Version identifier of the risk engine used for this evaluation'),
        sa.Column('evaluated_at', sa.DateTime(timezone=True), nullable=False, comment='When the risk evaluation was completed (UTC)'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint('confidence >= 0.0 AND confidence <= 1.0', name='ck_risk_events_confidence_range'),
        sa.CheckConstraint('risk_score >= 0.0 AND risk_score <= 1.0', name='ck_risk_events_score_range'),
        sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_risk_events_decision', 'risk_events', ['decision'], unique=False)
    op.create_index('ix_risk_events_evaluated_at', 'risk_events', ['evaluated_at'], unique=False)
    op.create_index('ix_risk_events_risk_level', 'risk_events', ['risk_level'], unique=False)
    op.create_index('ix_risk_events_transaction_id', 'risk_events', ['transaction_id'], unique=False)

    # --- Risk Reasons ---
    op.create_table('risk_reasons',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('risk_event_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('reason_code', sa.String(length=128), nullable=False, comment='Machine-readable code (e.g., NEW_DEVICE, AMOUNT_ANOMALY)'),
        sa.Column('severity', sa.String(length=32), nullable=False, comment='How significantly this signal contributed to the risk (LOW, MEDIUM, HIGH, CRITICAL)'),
        sa.Column('message', sa.String(length=512), nullable=False, comment='Human-readable explanation for UI display'),
        sa.Column('signal_value', sa.Float(), nullable=True, comment='Continuous value for the signal (if applicable, e.g., 0.91 for urgency). Null for categorical signals.'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['risk_event_id'], ['risk_events.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_risk_reasons_risk_event_id', 'risk_reasons', ['risk_event_id'], unique=False)

    # --- Analyst Feedback ---
    op.create_table('analyst_feedback',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('risk_event_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('classification', sa.String(length=32), nullable=False, comment='Analyst verdict (LEGITIMATE, FALSE_POSITIVE, CONFIRMED_FRAUD, UNCERTAIN)'),
        sa.Column('comment', sa.String(length=1024), nullable=True, comment='Optional qualitative notes from the analyst'),
        sa.Column('analyst_identifier', sa.String(length=255), nullable=False, comment='Simulated reference identifier for the analyst who performed the review'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['risk_event_id'], ['risk_events.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_analyst_feedback_risk_event_id', 'analyst_feedback', ['risk_event_id'], unique=False)


def downgrade() -> None:
    # Reverse order for safe dropping
    op.drop_index('ix_analyst_feedback_risk_event_id', table_name='analyst_feedback')
    op.drop_table('analyst_feedback')
    
    op.drop_index('ix_risk_reasons_risk_event_id', table_name='risk_reasons')
    op.drop_table('risk_reasons')
    
    op.drop_index('ix_risk_events_transaction_id', table_name='risk_events')
    op.drop_index('ix_risk_events_risk_level', table_name='risk_events')
    op.drop_index('ix_risk_events_evaluated_at', table_name='risk_events')
    op.drop_index('ix_risk_events_decision', table_name='risk_events')
    op.drop_table('risk_events')
    
    op.drop_index('ix_transactions_user_initiated', table_name='transactions')
    op.drop_index('ix_transactions_user_id', table_name='transactions')
    op.drop_index('ix_transactions_status', table_name='transactions')
    op.drop_index('ix_transactions_recipient_id', table_name='transactions')
    op.drop_index('ix_transactions_initiated_at', table_name='transactions')
    op.drop_index('ix_transactions_device_id', table_name='transactions')
    op.drop_table('transactions')
    
    op.drop_index('ix_recipients_user_id', table_name='recipients')
    op.drop_index('ix_recipients_identifier', table_name='recipients')
    op.drop_table('recipients')
    
    op.drop_index('ix_devices_user_id', table_name='devices')
    op.drop_index('ix_devices_fingerprint', table_name='devices')
    op.drop_table('devices')
    
    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')
