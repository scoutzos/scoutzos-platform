"""
API endpoints for contacts.
"""

from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session

from ..db import get_db
from ..models.contact import Contact
from ..schemas.contact import ContactCreate, ContactRead, ContactUpdate


router = APIRouter(prefix="/contacts", tags=["contacts"])


def get_org_id(x_org_id: str = Header(...)) -> str:
    return x_org_id


@router.get("", response_model=Dict[str, Any])
def list_contacts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
) -> Dict[str, Any]:
    query = db.query(Contact).filter(Contact.org_id == org_id)
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.post("", response_model=ContactRead, status_code=201)
def create_contact(
    payload: ContactCreate,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
) -> Contact:
    contact = Contact(org_id=org_id, **payload.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.get("/{contact_id}", response_model=ContactRead)
def get_contact(
    contact_id: str,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
) -> Contact:
    contact = db.query(Contact).filter(Contact.id == contact_id, Contact.org_id == org_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact


@router.patch("/{contact_id}", response_model=ContactRead)
def update_contact(
    contact_id: str,
    payload: ContactUpdate,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
) -> Contact:
    contact = db.query(Contact).filter(Contact.id == contact_id, Contact.org_id == org_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(contact, key, value)
    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/{contact_id}", status_code=204)
def delete_contact(
    contact_id: str,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
):
    contact = db.query(Contact).filter(Contact.id == contact_id, Contact.org_id == org_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(contact)
    db.commit()
    return