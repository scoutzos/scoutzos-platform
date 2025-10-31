"""
API endpoints for owners.
"""

from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session

from ..db import get_db
from ..models.owner import Owner
from ..schemas.owner import OwnerCreate, OwnerRead, OwnerUpdate


router = APIRouter(prefix="/owners", tags=["owners"])


def get_org_id(x_org_id: str = Header(...)) -> str:
    """Retrieve the organization ID from the X-Org-Id header."""
    return x_org_id


@router.get("", response_model=Dict[str, Any])
def list_owners(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
) -> Dict[str, Any]:
    """List owners within the current organization."""
    query = db.query(Owner).filter(Owner.org_id == org_id)
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.post("", response_model=OwnerRead, status_code=201)
def create_owner(
    payload: OwnerCreate,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
) -> Owner:
    """Create a new owner within the current organization."""
    owner = Owner(org_id=org_id, **payload.model_dump())
    db.add(owner)
    db.commit()
    db.refresh(owner)
    return owner


@router.get("/{owner_id}", response_model=OwnerRead)
def get_owner(
    owner_id: str,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
) -> Owner:
    """Retrieve an owner by ID within the current organization."""
    owner = db.query(Owner).filter(Owner.id == owner_id, Owner.org_id == org_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")
    return owner


@router.patch("/{owner_id}", response_model=OwnerRead)
def update_owner(
    owner_id: str,
    payload: OwnerUpdate,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
) -> Owner:
    """Update an existing owner."""
    owner = db.query(Owner).filter(Owner.id == owner_id, Owner.org_id == org_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(owner, key, value)
    db.commit()
    db.refresh(owner)
    return owner


@router.delete("/{owner_id}", status_code=204)
def delete_owner(
    owner_id: str,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
):
    """Delete an owner from the organization."""
    owner = db.query(Owner).filter(Owner.id == owner_id, Owner.org_id == org_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")
    db.delete(owner)
    db.commit()
    return