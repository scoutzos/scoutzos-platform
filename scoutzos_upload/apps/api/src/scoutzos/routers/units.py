"""
API endpoints for units.
"""

from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session

from ..db import get_db
from ..models.unit import Unit
from ..schemas.unit import UnitCreate, UnitRead, UnitUpdate


router = APIRouter(prefix="/units", tags=["units"])


def get_org_id(x_org_id: str = Header(...)) -> str:
    return x_org_id


@router.get("", response_model=Dict[str, Any])
def list_units(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
) -> Dict[str, Any]:
    query = db.query(Unit).filter(Unit.org_id == org_id)
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.post("", response_model=UnitRead, status_code=201)
def create_unit(
    payload: UnitCreate,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
) -> Unit:
    unit = Unit(org_id=org_id, **payload.model_dump())
    db.add(unit)
    db.commit()
    db.refresh(unit)
    return unit


@router.get("/{unit_id}", response_model=UnitRead)
def get_unit(
    unit_id: str,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
) -> Unit:
    unit = db.query(Unit).filter(Unit.id == unit_id, Unit.org_id == org_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    return unit


@router.patch("/{unit_id}", response_model=UnitRead)
def update_unit(
    unit_id: str,
    payload: UnitUpdate,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
) -> Unit:
    unit = db.query(Unit).filter(Unit.id == unit_id, Unit.org_id == org_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(unit, key, value)
    db.commit()
    db.refresh(unit)
    return unit


@router.delete("/{unit_id}", status_code=204)
def delete_unit(
    unit_id: str,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
):
    unit = db.query(Unit).filter(Unit.id == unit_id, Unit.org_id == org_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    db.delete(unit)
    db.commit()
    return