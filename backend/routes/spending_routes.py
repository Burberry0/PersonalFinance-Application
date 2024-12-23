from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from connect_db import connect
from models import Spending
from schemas import SpendingSummary
from sqlalchemy import func


router = APIRouter()

@router.get("/spending_summary", response_model=SpendingSummary)
def spending_summary(user_id: int, db: Session = Depends(connect)):
    summary = db.query(
        func.sum(Spending.amount).label('total_spent'),
        func.avg(Spending.amount).label('average_spent'),
        func.max(Spending.amount).label('max_spent'),
        func.count(Spending.id).label('total_purchased')
    ).filter(Spending.user_id == user_id).first()

    store_breakdown = db.query(
        Spending.store_name,
        Spending.category,
        func.sum(Spending.amount).label('total_store_spent')
    ).filter(Spending.user_id == user_id).group_by(Spending.store_name, Spending.category).all()

    return {
        "total_spent": summary.total_spent,
        "average_spent": summary.average_spent,
        "max_spent": summary.max_spent,
        "total_purchased": summary.total_purchased,
        "store_breakdown": store_breakdown
    }
