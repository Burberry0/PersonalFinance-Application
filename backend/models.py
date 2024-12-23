from fastapi import FastAPI
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

app = FastAPI()

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)  # Primary key for identifying users
    username = Column(String, unique=True, index=True, nullable=False)  # Username for login
    password = Column(String, nullable=False)  # Password for authentication
    has_completed_questionnaire = Column(Boolean, default=False)

    # Relationships
    wallet = relationship("Wallet", back_populates="user", uselist=False)  # One-to-one relationship
    portfolio = relationship("Portfolio", back_populates="user", uselist=False)  # One-to-one relationship
    transactions = relationship("Transaction", back_populates="user")  # One-to-many relationship
    portfolio_history = relationship("PortfolioHistory", back_populates="user")

    expenses = relationship("Expense", back_populates="user")
    salaries = relationship("Salary", back_populates="user")
    cashflow = relationship("Cashflow", back_populates="user")
    spending = relationship("Spending", back_populates="user")
    savings_plans = relationship("SavingsPlan", back_populates="user")



class Portfolio(Base):
    __tablename__ = "portfolio"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True, nullable=False)  # Each user has exactly one portfolio
    timestamp = Column(DateTime, default=func.now())

    # Relationship with User
    user = relationship("User", back_populates="portfolio")
    stocks = relationship("StockHolding", back_populates="portfolio")  # One-to-many relationship with StockHolding
    history = relationship("PortfolioHistory", back_populates="portfolio")



class StockHolding(Base):
    __tablename__ = "stock_holdings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    portfolio_id = Column(Integer, ForeignKey('portfolio.id'), nullable=False)  # Foreign key to portfolio.id
    ticker = Column(String, nullable=False)  # Store ticker as a simple field
    quantity = Column(Integer, nullable=False)
    average_price = Column(Float, nullable=False)
    current_price = Column(Float, nullable=False)

    # Relationship with Portfolio
    portfolio = relationship("Portfolio", back_populates="stocks")


class Transaction(Base):
    __tablename__ = 'transactions'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Links to the users table
    ticker = Column(String, nullable=False)  # Stock ticker involved in the transaction
    quantity = Column(Integer, nullable=False)  # Number of shares bought/sold
    price = Column(Float, nullable=False)  # Price at which the transaction occurred
    transaction_type = Column(String, nullable=False)  # Either 'buy' or 'sell'
    timestamp = Column(DateTime, default=func.now())

    # Relationship with User
    user = relationship("User", back_populates="transactions")


class Wallet(Base):
    __tablename__ = 'wallets'

    id = Column(Integer, primary_key=True, autoincrement=True)  # Change to 'id' to match the DB schema
    user_id = Column(Integer, ForeignKey('users.id'), unique=True, nullable=False)  # Each user has one wallet
    purchasing_power = Column(Float, nullable=False, default=0.0)  # Cash available for trading
    total_value = Column(Float, nullable=False, default=0.0)  # Total value of cash + holdings
    holding_value = Column(Float, nullable=False, default=0.0)  # Value of stock holdings
    user = relationship("User", back_populates="wallet")


class WalletTransaction(Base):
    __tablename__ = "WalletTrans"

    id = Column(Integer, primary_key=True, autoincrement=True)
    from_user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    to_user_id = Column(Integer, ForeignKey('users.username'), nullable=False)
    amount = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=func.now())


class PortfolioHistory(Base):
    __tablename__ = "Portfolio_History"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    portfolio_id = Column(Integer, ForeignKey('portfolio.id'), nullable=False)
    date = Column(DateTime, default=func.now())
    value = Column(Float, nullable=False)

    portfolio = relationship("Portfolio", back_populates="history")
    user = relationship("User", back_populates="portfolio_history")


class Expense(Base):
    __tablename__ = 'expenses'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    category = Column(String, index=True)
    amount = Column(Float)
    date = Column(DateTime, default=func.now())

    user = relationship("User", back_populates="expenses")



class Salary(Base):
    __tablename__ = "salaries"

    id = Column(Integer, primary_key=True, index=True)
    users_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float)
    date = Column(DateTime, default=func.now())

    user = relationship("User", back_populates="salaries")


class Cashflow(Base):
    __tablename__ = "cashflow"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    income = Column(Float)
    expenses = Column(Float)
    date = Column(DateTime, default=func.now())

    user = relationship("User", back_populates="cashflow")



class Spending(Base):
    __tablename__ = "spending"

    id = Column(Integer, primary_key=True, index=True)
    user_id =Column(Integer, ForeignKey('users.id'), nullable=False)
    amount = Column(Float)
    category = Column(String)
    store_name = Column(String)
    type = Column(String)
    date = Column(DateTime, default=func.now())

    user = relationship("User", back_populates="spending")



class PortfolioValueLog(Base):
    __tablename__ = "PortfolioLoggedValue"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    date = Column(DateTime, default=func.now())
    portfolio_value = Column(Float)


class SavingsPlan(Base):
    __tablename__ = "savings_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    total_retirement_savings = Column(Float)
    annual_salary = Column(Float)
    years_to_retirement = Column(Integer)
    monthly_savings_needed = Column(Float)
    retirement_age = Column(Integer)  # Add retirement_age
    current_age = Column(Integer)     # Add current_age
    monthly_contribution = Column(Float)  # Add monthly_contribution
    current_savings = Column(Float)   # Add current_savings
    monthly_expenses = Column(Float)  # Add monthly_expenses
    message = Column(String)
    risk_tolerance = Column(String)

    user = relationship("User", back_populates="savings_plans")




