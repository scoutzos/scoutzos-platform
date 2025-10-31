"""
API endpoints for documents.

Note: File upload and pre-signing are stubbed.  In a real application, you
would integrate with an object storage service to generate presigned URLs.
"""

from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session

from ..db import get_db
from ..models.document import Document
from ..schemas.document import DocumentCreate, DocumentRead


router = APIRouter(prefix="/documents", tags=["documents"])


def get_org_id(x_org_id: str = Header(...)) -> str:
    return x_org_id


@router.get("", response_model=Dict[str, Any])
def list_documents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
) -> Dict[str, Any]:
    query = db.query(Document).filter(Document.org_id == org_id)
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.post("", response_model=DocumentRead, status_code=201)
def create_document(
    payload: DocumentCreate,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
) -> Document:
    doc = Document(org_id=org_id, **payload.model_dump())
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/{doc_id}", response_model=DocumentRead)
def get_document(
    doc_id: str,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
) -> Document:
    doc = db.query(Document).filter(Document.id == doc_id, Document.org_id == org_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.delete("/{doc_id}", status_code=204)
def delete_document(
    doc_id: str,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
):
    doc = db.query(Document).filter(Document.id == doc_id, Document.org_id == org_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(doc)
    db.commit()
    return