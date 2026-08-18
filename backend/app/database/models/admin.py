"""
FraudShield — Admin User ORM Model
==================================
Represents a dashboard administrator/team member.
"""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.session import Base
from app.database.models.mixins import UUIDPrimaryKeyMixin, TimestampMixin


class AdminUser(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    Dashboard Team Member / Administrator.
    """
    __tablename__ = "admin_users"

    username: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=True) # Null for guest
    role: Mapped[str] = mapped_column(String(50), default="member", nullable=False)

    def __repr__(self) -> str:
        return f"<AdminUser id={self.id} username={self.username!r}>"
