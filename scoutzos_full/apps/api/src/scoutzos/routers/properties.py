"""
API endpoints for properties.
"""

from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session

from ..db import get_db
from ..models.property import Property
from ..schemas.property import PropertyCreate, PropertyRead, PropertyUpdate


router = APIRouter(prefix="/properties", tags=["properties"])


def get_org_id(x_org_id: str = Header(...)) -> str:
    return x_org_id


@router.get("", response_model=Dict[str, Any])
def list_properties(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
) -> Dict[str, Any]:
    query = db.query(Property).filter(Property.org_id == org_id, Property.deleted_at == None)
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.post("", response_model=PropertyRead, status_code=201)
def create_property(
    payload: PropertyCreate,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
) -> Property:
    prop = Property(org_id=org_id, **payload.model_dump())
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return prop


@router.get("/{property_id}", response_model=PropertyRead)
def get_property(
    property_id: str,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
) -> Property:
    prop = db.query(Property).filter(Property.id == property_id, Property.org_id == org_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop


@router.patch("/{property_id}", response_model=PropertyRead)
def update_property(
    property_id: str,
    payload: PropertyUpdate,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
) -> Property:
    prop = db.query(Property).filter(Property.id == property_id, Property.org_id == org_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(prop, key, value)
    db.commit()
    db.refresh(prop)
    return prop


@router.delete("/{property_id}", status_code=204)
def delete_property(
    property_id: str,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
):
    prop = db.query(Property).filter(Property.id == property_id, Property.org_id == org_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    # Soft delete by setting deleted_at
    from datetime import datetime

    prop.deleted_at = datetime.utcnow()
    db.commit()
    return