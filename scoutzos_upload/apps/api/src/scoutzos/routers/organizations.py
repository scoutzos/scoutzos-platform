"""
API endpoints for organizations.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..models.organization import Organization
from ..schemas.organization import OrganizationCreate, OrganizationRead


router = APIRouter(prefix="/orgs", tags=["organizations"])


@router.get("", response_model=List[OrganizationRead])
def list_orgs(db: Session = Depends(get_db)) -> List[Organization]:
    """List all organizations.  Primarily for administrative use."""
    return db.query(Organization).all()


@router.post("", response_model=OrganizationRead, status_code=201)
def create_org(payload: OrganizationCreate, db: Session = Depends(get_db)) -> Organization:
    """Create a new organization."""
    # Generate slug by lowercasing name and replacing spaces
    slug_base = payload.name.strip().lower().replace(" ", "-")
    # Ensure slug uniqueness by appending count if necessary
    existing_count = db.query(Organization).filter(Organization.slug.like(f"{slug_base}%")).count()
    slug = slug_base if existing_count == 0 else f"{slug_base}-{existing_count+1}"
    org = Organization(name=payload.name, slug=slug)
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


@router.get("/{org_id}", response_model=OrganizationRead)
def get_org(org_id: str, db: Session = Depends(get_db)) -> Organization:
    """Retrieve an organization by its ID."""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org