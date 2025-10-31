"""
API endpoints for leads.
"""

from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session

from ..db import get_db
from ..models.lead import Lead
from ..schemas.lead import LeadCreate, LeadRead, LeadUpdate


router = APIRouter(prefix="/leads", tags=["leads"])


def get_org_id(x_org_id: str = Header(...)) -> str:
    return x_org_id


@router.get("", response_model=Dict[str, Any])
def list_leads(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
) -> Dict[str, Any]:
    query = db.query(Lead).filter(Lead.org_id == org_id)
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.post("", response_model=LeadRead, status_code=201)
def create_lead(
    payload: LeadCreate,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
) -> Lead:
    lead = Lead(org_id=org_id, **payload.model_dump())
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


@router.get("/{lead_id}", response_model=LeadRead)
def get_lead(
    lead_id: str,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
) -> Lead:
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.org_id == org_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.patch("/{lead_id}", response_model=LeadRead)
def update_lead(
    lead_id: str,
    payload: LeadUpdate,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
) -> Lead:
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.org_id == org_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(lead, key, value)
    db.commit()
    db.refresh(lead)
    return lead


@router.delete("/{lead_id}", status_code=204)
def delete_lead(
    lead_id: str,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
):
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.org_id == org_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    db.delete(lead)
    db.commit()
    return