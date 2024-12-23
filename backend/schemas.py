from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List, Literal


class UserCreate(BaseModel):
    username: str
    password: str

class StockHoldingCreate(BaseModel):
    ticker: str
    quantity: int
    average_price: float

class BuyStockRequest(BaseModel):
    ticker: str
    quantity: int
    price: float

class SellStockRequest(BaseModel):
    ticker: str
    quantity: int
    price: float


class AddMoneyRequest(BaseModel):
    amount: float

class Token(BaseModel):
    access_token: str
    token_type: str
    username: str
    user_id: int

class TransferRequest(BaseModel):
    from_user_id: int
    to_username: str
    amount: float



class ExpenseBase(BaseModel):
    category: str
    amount: float
    date: date

class ExpenseCreate(ExpenseBase):
    pass

class Expense(ExpenseBase):
    id: int
    user_id: int
    
    class Config:
        orm_mode = True


class SpendingSchema(BaseModel):
    id: int
    user_id: int
    amount: float
    category: str
    store_name: str
    type: str
    date: date

    class Config:
        orm_mode = True
    

class StoreBreakdown(BaseModel):
    store_name: str
    category: str
    total_store_spent: float


class SpendingSummary(BaseModel):
    total_spent: float
    average_spent: float
    max_spent: float
    total_purchased: float
    store_breakdown: List[StoreBreakdown]

    class Config:
        orm_mode = True


class UpdateStockPrice(BaseModel):
    ticker: str;
    current_price: float;


class PortfolioValueRequest(BaseModel):
    date: datetime
    value: float;


class PortfolioGrowthResponse(BaseModel):
    growth_history: List[PortfolioValueRequest]

    class Config:
        orm_mode = True

class SavingsPlanCreate(BaseModel):
    annual_salary: float
    monthly_contribution: float
    current_age: int
    retirement_age: int
    current_savings: Optional[float] = 0
    monthly_expenses: float
    risk_tolerance: str
    other_goals: Optional[str] = ""

class SavingsPlanResponse(SavingsPlanCreate):
    total_retirement_savings: float
    years_to_retirement: int
    monthly_savings_needed: float
    message: str

    class Config:
        orm_mode = True


class TransactionResponse(BaseModel):
    date: datetime
    amount: float
    category: str
    store_name: str
    type: Literal["INCOME", "EXPENSE", "INVESTMENT", "CASHBUFFER"]

    class Config:
        orm_mode = True


#wallet = Wallet(purchasing_power=500.0, total_value=300.0, holding_value=0.0)

