"""
API endpoint for audit logs.
"""

from typing import Any, Dict

from fastapi import APIRouter, Depends, Header, Query
from sqlalchemy.orm import Session

from ..db import get_db
from ..models.audit_log import AuditLog
from ..schemas.audit_log import AuditLogRead


router = APIRouter(prefix="/audit", tags=["audit"])


def get_org_id(x_org_id: str = Header(...)) -> str:
    return x_org_id


@router.get("", response_model=Dict[str, Any])
def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
) -> Dict[str, Any]:
    query = db.query(AuditLog).filter(AuditLog.org_id == org_id)
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total, "page": page, "page_size": page_size}