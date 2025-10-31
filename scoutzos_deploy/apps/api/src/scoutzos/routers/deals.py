"""
API endpoints for deals.
"""

from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session

from ..db import get_db
from ..models.deal import Deal
from ..schemas.deal import DealCreate, DealRead, DealUpdate


router = APIRouter(prefix="/deals", tags=["deals"])


def get_org_id(x_org_id: str = Header(...)) -> str:
    return x_org_id


@router.get("", response_model=Dict[str, Any])
def list_deals(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
) -> Dict[str, Any]:
    query = db.query(Deal).filter(Deal.org_id == org_id)
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.post("", response_model=DealRead, status_code=201)
def create_deal(
    payload: DealCreate,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
) -> Deal:
    deal = Deal(org_id=org_id, **payload.model_dump())
    db.add(deal)
    db.commit()
    db.refresh(deal)
    return deal


@router.get("/{deal_id}", response_model=DealRead)
def get_deal(
    deal_id: str,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
) -> Deal:
    deal = db.query(Deal).filter(Deal.id == deal_id, Deal.org_id == org_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return deal


@router.patch("/{deal_id}", response_model=DealRead)
def update_deal(
    deal_id: str,
    payload: DealUpdate,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
) -> Deal:
    deal = db.query(Deal).filter(Deal.id == deal_id, Deal.org_id == org_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(deal, key, value)
    db.commit()
    db.refresh(deal)
    return deal


@router.delete("/{deal_id}", status_code=204)
def delete_deal(
    deal_id: str,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
):
    deal = db.query(Deal).filter(Deal.id == deal_id, Deal.org_id == org_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    db.delete(deal)
    db.commit()
    return