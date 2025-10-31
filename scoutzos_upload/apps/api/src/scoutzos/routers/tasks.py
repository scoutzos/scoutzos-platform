"""
API endpoints for tasks.
"""

from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session

from ..db import get_db
from ..models.task import Task
from ..schemas.task import TaskCreate, TaskRead, TaskUpdate


router = APIRouter(prefix="/tasks", tags=["tasks"])


def get_org_id(x_org_id: str = Header(...)) -> str:
    return x_org_id


@router.get("", response_model=Dict[str, Any])
def list_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
) -> Dict[str, Any]:
    query = db.query(Task).filter(Task.org_id == org_id)
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.post("", response_model=TaskRead, status_code=201)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
) -> Task:
    task = Task(org_id=org_id, **payload.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/{task_id}", response_model=TaskRead)
def get_task(
    task_id: str,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
) -> Task:
    task = db.query(Task).filter(Task.id == task_id, Task.org_id == org_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.patch("/{task_id}", response_model=TaskRead)
def update_task(
    task_id: str,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
) -> Task:
    task = db.query(Task).filter(Task.id == task_id, Task.org_id == org_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(task, key, value)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=204)
def delete_task(
    task_id: str,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
):
    task = db.query(Task).filter(Task.id == task_id, Task.org_id == org_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return