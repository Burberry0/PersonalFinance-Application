from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Optional, Union

from jose import JWTError, jwt

from models import Base, User, Portfolio, StockHolding, Transaction, Wallet, WalletTransaction, PortfolioHistory, Spending, PortfolioValueLog, SavingsPlan  # Import models directly
import schemas
from connect_db import connect, engine
import requests
from datetime import date, datetime, timedelta, timezone
from routes import spending_routes
from pydantic import ValidationError
from pandas import pandas as pd




app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(spending_routes.router)
Base.metadata.create_all(bind=engine)





oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30






key = '76aca232cf48b7732e7d62cf2fd91072'


# Optionally, define additional global routes here (e.g., health check)
@app.get("/")
def read_root():
    return {"message": "Hello World"}

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(connect)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode the JWT token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")  # `sub` usually holds the user ID
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Query the database to find the user by ID
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user  # This will return the `user` object with all its attributes

    

@app.get("/users")
async def get_users(db: Session = Depends(connect)):
    # Fetch all users from the database
    users = db.query(User).all()
    return users


@app.get("/{user_id}/status")
async def get_user_status(user_id: int, db: Session = Depends(connect)):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="user not found")
    
    return {'has_completed_questionnaire', user.has_completed_questionnaire}

@app.put("/{user_id}/status")
async def mark_questionnaire_completed(user_id: int, db: Session = Depends(connect)):
    # Fetch the user by user_id
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update the did_complete_form field
    user.has_completed_questionnaire = True
    db.commit()
    return {"message": "Questionnaire marked as completed."}




def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# Get user by username
def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

# Authenticate user
def authenticate_user(username: str, password: str, db: Session):
    user = get_user_by_username(db, username)
    if not user or not verify_password(password, user.password):
        return False
    return user

# Create JWT access token
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta if expires_delta else timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Verify JWT token
def verify_token(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Token has no subject (username)")
        return payload
    except JWTError:
        raise HTTPException(status_code=403, detail="Token is invalid or expired")

# Route to verify token
@app.get("/verify-token")
async def verify_user_token(token: str = Depends(oauth2_scheme)):
    payload = verify_token(token)
    return {"message": "Token is valid", "payload": payload}

# Signup Route
@app.post("/signup")
def signup(request: schemas.UserCreate, db: Session = Depends(connect)):
    try:
        hashed_password = pwd_context.hash(request.password)
        new_user = User(username=request.username, password=hashed_password)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Create wallet and portfolio for the new user
        new_wallet = Wallet(user_id=new_user.id, purchasing_power=1000.0, holding_value=0.0, total_value=1000.0)
        db.add(new_wallet)
        new_portfolio = Portfolio(user_id=new_user.id)
        db.add(new_portfolio)
        db.commit()

        return {"message": "User signed up successfully", "user_id": new_user.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Signup failed: {str(e)}")

# Login Route (Token Generation)
@app.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(connect)):
    user = authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"username": user.username, "user_id": user.id, "access_token": access_token, "token_type": "bearer",
                    "has_completed_questionnaire": user.has_completed_questionnaire}

# Protected route - Example
@app.get("/protected")
def protected_route(token: str = Depends(oauth2_scheme)):
    payload = verify_token(token)
    return {"message": "You are authenticated", "username": payload.get("sub")}
    

def get_stock_quote(ticker):
    try:
        key = "76aca232cf48b7732e7d62cf2fd91072"
        url = f"https://financialmodelingprep.com/api/v3/quote-short/{ticker}?apikey={key}"
        response = requests.get(url)
        data = response.json()

        print(f"API Response: {ticker}: {data}")  # Debug: Print the raw API response

        
        if data and isinstance(data, list) and len(data) > 0:
            price = data[0].get("price")
            print(f"Price for {ticker}: {price}")  # Log the price
            return price
        else:
            print(f"No valid data returned for {ticker}")
            return None
    except Exception as e:
        print(f"Error fetching price for {ticker}: {str(e)}")
        return None


@app.post('/{user_id}/buy')
def buy_stock(user_id: int, stock_data: schemas.BuyStockRequest, db: Session = Depends(connect)):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    portfolio = db.query(Portfolio).filter(Portfolio.user_id == user_id).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    stock = db.query(StockHolding).filter(
        StockHolding.portfolio_id == portfolio.id,
        StockHolding.ticker == stock_data.ticker
    ).first()

    total_cost = stock_data.quantity * stock_data.price

    # Check user's wallet balance
    if user.wallet.purchasing_power < total_cost:
        raise HTTPException(status_code=400, detail="Insufficient funds")

    if stock:
        # Update quantity and recalculate average price, preserving the initial purchase price
        total_shares = stock.quantity + stock_data.quantity
        stock.average_price = ((stock.average_price * stock.quantity) + (stock_data.price * stock_data.quantity)) / total_shares
        stock.quantity += stock_data.quantity
    else:
        # New stock holding, set purchase price and average price
        new_stock = StockHolding(
            portfolio_id=portfolio.id,
            ticker=stock_data.ticker,
            quantity=stock_data.quantity,
            initial_purchase_price=stock_data.price,  # First purchase price
            average_price=stock_data.price             # Initial average price
        )
        db.add(new_stock)

    # Deduct from wallet
    user.wallet.purchasing_power -= total_cost

    # Add a transaction for buying
    new_transaction = Transaction(
        user_id=user_id,
        ticker=stock_data.ticker,
        quantity=stock_data.quantity,
        price=stock_data.price,
        transaction_type='buy',
    )

    db.add(new_transaction)
    db.commit()

    return {"message": f"Purchased {stock_data.quantity} shares of {stock_data.ticker} successfully."}


@app.post('/{user_id}/sell')
def sell_stock(user_id: int, stock_data: schemas.SellStockRequest, db: Session = Depends(connect)):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    portfolio = db.query(Portfolio).filter(Portfolio.user_id == user_id).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    stock = db.query(StockHolding).filter(
        StockHolding.portfolio_id == portfolio.id,
        StockHolding.ticker == stock_data.ticker
    ).first()

    if not stock or stock.quantity < stock_data.quantity:
        raise HTTPException(status_code=400, detail="Not enough stock to sell")

    # Update portfolio stock
    stock.quantity -= stock_data.quantity
    if stock.quantity == 0:
        db.delete(stock)

    # Update wallet with funds from sale
    total_sale_value = stock_data.quantity * stock_data.price
    user.wallet.purchasing_power += total_sale_value

    # Log the transaction
    new_transaction = Transaction(
        user_id=user_id,
        ticker=stock_data.ticker,
        quantity=stock_data.quantity,
        price=stock_data.price,
        transaction_type='sell'
    )

    db.add(new_transaction)
    db.commit()

    return {"message": f"Sold {stock_data.quantity} shares of {stock_data.ticker} successfully. You now have {user.wallet.purchasing_power} in purchasing power."}



@app.get('/{user_id}/portfolio')
def view_portfolio(user_id: int, db: Session = Depends(connect)):
    
    
    
    portfolio = db.query(Portfolio).filter(Portfolio.user_id == user_id).first()
    
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    stock_list = []

    # Loop through stocks in the portfolio
    for stock in portfolio.stocks:
        # Fetch the latest price dynamically
        current_price = get_stock_quote(stock.ticker)  # Replace with actual function for fetching prices

        # If the current price is valid, update the database if necessary
        if current_price and (stock.current_price is None or stock.current_price != current_price):
            stock.current_price = current_price
            db.add(stock)  # Add the updated stock to the session

        # Append stock details to the response list
        stock_list.append({
            "ticker": stock.ticker,
            "quantity": stock.quantity,
            "average_price": stock.average_price,
            "current_price": current_price or stock.current_price,  # Use the fetched price or the existing one
        })

    # Commit updates to the database
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update stock prices: {str(e)}")

    # Return the portfolio data
    return {
        "user_id": user_id,
        "stocks": stock_list,
        "timestamp": portfolio.timestamp
    }

@app.get('/{user_id}/wallet')
async def view_wallet(user_id: int, db: Session = Depends(connect)):
   
    # Fetch the user's wallet
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    # Fetch the user's portfolio
    portfolio = db.query(Portfolio).filter(Portfolio.user_id == user_id).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    # Initialize holding value
    holding_value = 0.0

    # Fetch the stocks in the portfolio and calculate their value
    StockList = []
    for stock_item in portfolio.stocks:
        ticker = stock_item.ticker
        quantity = stock_item.quantity

        # Assuming current price is fixed here; in real case, use an API to fetch real-time price
        current_price = get_stock_quote(ticker) 
        stock_value = quantity * current_price
        holding_value += stock_value

        StockList.append({
            "ticker": ticker,
            "quantity": quantity,
            "current_price": current_price,
            "stock_value": stock_value
        })

    # Calculate total value (purchasing power + holding value of stocks)
    total_value = wallet.purchasing_power + holding_value

    # Update wallet with new values
    wallet.holding_value = holding_value
    wallet.total_value = total_value
    db.commit()
    db.refresh(wallet)

    # Return the updated wallet information
    return {
        "purchasing_power": wallet.purchasing_power,
        "holding_value": wallet.holding_value,
        "total_value": wallet.total_value,
        "portfolio": StockList
    }


@app.post("/{user_id}/wallet")
async def add_money(user_id: int, request: schemas.AddMoneyRequest, db: Session = Depends(connect)):
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()

    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    if request.amount < 0:
        raise HTTPException(status_code=400, detail="amount must be greater than 0")
    
    wallet.purchasing_power += request.amount

    db.commit()
    db.refresh(wallet)

    return {
        "purchasing_power": wallet.purchasing_power,
        "holding_value": wallet.holding_value,
        "total_value": wallet.purchasing_power + wallet.holding_value
    }

@app.post("/wallet/transfer")
async def transfer_money(transfer: schemas.TransferRequest, db: Session = Depends(connect)):

    from_user_id = transfer.from_user_id
    to_username = transfer.to_username
    amount = transfer.amount

    # Fetch sender's wallet
    from_wallet = db.query(Wallet).filter(Wallet.user_id == from_user_id).first()
    if not from_wallet or from_wallet.purchasing_power < amount:
        raise HTTPException(status_code=400, detail="Insufficient funds")
    
    # Fetch receiver's user object using username
    to_user = db.query(User).filter(User.username == to_username).first()
    if not to_user:
        raise HTTPException(status_code=404, detail="Receiver not found")

    # Fetch receiver's wallet using the user_id from the to_user object
    to_wallet = db.query(Wallet).filter(Wallet.user_id == to_user.id).first()
    if not to_wallet:
        raise HTTPException(status_code=404, detail="Receiver wallet not found")
    
    # Deduct from sender's wallet
    from_wallet.purchasing_power -= amount
    from_wallet.total_value = from_wallet.purchasing_power + from_wallet.holding_value

    # Add to receiver's wallet
    to_wallet.purchasing_power += amount
    to_wallet.total_value = to_wallet.purchasing_power + to_wallet.holding_value

    # Create wallet transaction record
    transaction = WalletTransaction(from_user_id=from_user_id, to_user_id=to_user.id, amount=amount, timestamp = datetime)
    db.add(transaction)

    # Commit the changes
    db.commit()

    # Ensure both wallets are returned in the response
    return {
        "message": "Transfer successful", 
        "from_wallet": from_wallet, 
        "to_wallet": to_wallet,  # Make sure the receiver's wallet is included here
        "Amount": amount, 
        "Balance": from_wallet.purchasing_power,
        "to_wallet_balance": to_wallet.purchasing_power
    }

@app.get('/{user_id}/transactions')
async def user_transactions(user_id: int, db: Session = Depends(connect)):
    # Check if the user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="No user found")

    # Query the transactions table for this user
    user_transactions = db.query(Transaction).filter(Transaction.user_id == user_id).all()

    # Check if there are any transactions for the user
    if not user_transactions:
        raise HTTPException(status_code=404, detail="No transactions found for this user")

    return user_transactions



@app.get('/{user_id}/WalletTrans')
async def user_transfers(user_id: int, db: Session = Depends(connect)):
    # Check if the user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="No user found")

    # Query the transactions table for this user
    user_transfers = db.query(WalletTransaction).filter(WalletTransaction.from_user_id == user_id).all()

    # Check if there are any transactions for the user
    if not user_transfers:
        raise HTTPException(status_code=404, detail="No transactions found for this user")

    return user_transfers


@app.get("/{user_id}/portfolio/growth", response_model= schemas.PortfolioGrowthResponse)
def get_port_growth(user_id: int, db: Session = Depends(connect)):
    """
    Calculate the total value of a portfolio based on its current stock holdings.
    """
    # Fetch the user's portfolio
    portfolio_logs = db.query(PortfolioHistory).filter(PortfolioHistory.user_id == user_id).all()

    if not portfolio_logs:
        raise HTTPException(status_code=404, detail="No portfolio found")

    # Calculate the total portfolio value by summing (quantity * current_price) for each stock
    growth_history = [{"date": log.date.isoformat(), "value": log.value} for log in portfolio_logs]
    
    print(growth_history)  # Debugging step

    return {"growth_history": growth_history}




from datetime import datetime

@app.post("/{user_id}/portfolio/log")
def log_portfolio_value(user_id: int, db: Session = Depends(connect)):
    # Fetch the user's portfolio
    portfolio = db.query(Portfolio).filter(Portfolio.user_id == user_id).first()

    if not portfolio:
        raise HTTPException(status_code=404, detail="No portfolio found")
    
    stock_holdings = db.query(StockHolding).filter(StockHolding.portfolio_id == portfolio.id).all()

    if not stock_holdings:
        raise HTTPException(status_code=404, detail="no stock holdings for this portfolio")
    

    total_value = 0

    for stock in stock_holdings:
        stock_value = stock.quantity * stock.current_price

        print(f"Ticker: {stock.ticker}, Quantity: {stock.quantity}, Current Price: {stock.current_price}, Stock Value: {stock_value}")

        total_value += stock_value

    new_log = PortfolioHistory(
        user_id = user_id,
        portfolio_id = portfolio.id,
        date = datetime.now(),
        value = total_value
    )
    db.add(new_log)
    db.commit()
    
    return {"total_value": total_value, "date": datetime.now().date()}



@app.put("/update_daily_log")
async def update_daily_log(user_id: int, portfolio_data: dict, db: Session = Depends(connect)):
    today = datetime.today()
    existing_log = db.query(PortfolioHistory).filter_by(user_id=user_id, datetime=today).first()
    
    if existing_log:
        raise HTTPException(status_code=400, detail="log for today exists")
    
    new_log = PortfolioHistory(user_id=user_id, datetime=today, data=portfolio_data)
    db.add(new_log)
    db.commit()
    return {"message": "portfolio logged"}


    
@app.put("stocks/update-price", response_model=None)
def update_stock_prices(update: schemas.UpdateStockPrice, db: Session = Depends(connect)):

    stock = db.query(StockHolding).filter(StockHolding.ticker == update.ticker).all()

    if not stock:
        raise HTTPException(status_code=404, detail="stock-not foudn")
    
    stock.current_price = update.current_price

    print(f"updating {stock.ticker} updated price to {update.current_price}")

    try: 
        db.commit()

    except Exception as e:
        db.rollback()
        print("error comitting updating price")
        raise HTTPException(status_code=500, detail="error updting price")
    
    return {"updated": f"price for {stock.ticker} updated to {update.current_price}"}


@app.delete("/clear-spending")
async def clear_spending(db: Session = Depends(connect)):
    try:
        # Delete all records in the Spending table
        db.query(Spending).delete()
        db.commit()
        return {"message": "All records in the Spending table have been deleted."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to clear spending data: {str(e)}")


@app.post("/upload-spending-csv/")
async def upload_spending_csv(
    user_id: int = Query(...), file: UploadFile = File(...), db: Session = Depends(connect)
):
    try:
        df = pd.read_csv(file.file)
        df.rename(columns={'Date': 'date', 'Amount': 'amount', 'Category': 'category', 'Store Name': 'store_name', 'Type': 'type'}, inplace=True)
        
        # Debug: Print the columns to verify
        print("CSV Columns after renaming:", df.columns)
        
        required_columns = {'amount', 'category', 'store_name', 'type', 'date'}
        if not required_columns.issubset(df.columns):
            raise HTTPException(status_code=400, detail="CSV is missing required columns")

        for index, row in df.iterrows():
            spending_record = Spending(
                user_id=user_id, 
                amount=row['amount'], 
                category=row['category'], 
                store_name=row['store_name'], 
                type=row['type'], 
                date=datetime.strptime(row['date'], '%Y-%m-%d') if isinstance(row['date'], str) else row['date']
            )


            db.add(spending_record)
        db.commit()
        return {"message": "CSV data successfully uploaded and stored in the database"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to upload CSV data: {str(e)}")

@app.get('/Spending/{user_id}', response_model=List[schemas.SpendingSchema])
def get_spending_sheet(user_id: int, db: Session = Depends(connect)):
    spending_records = db.query(Spending).filter(Spending.user_id == user_id).all()
    if not spending_records:
        raise HTTPException(status_code=404, detail="No spending records found for the user.")
    return spending_records

@app.get("/Spending/category/{category_name}")
def get_spending_category(category_name: str, user_id: int = Query(...), db: Session = Depends(connect)):
    transactions = db.query(Spending).filter(
        Spending.category.ilike(f"%{category_name}%"),
        Spending.user_id == user_id
    ).all()
    if not transactions:
        raise HTTPException(status_code=404, detail=f"No transactions found for category {category_name} for user {user_id}")
    return transactions

@app.get("/Spending/spending_summary", response_model=schemas.SpendingSummary)
def get_spending_summary(user_id: int = Query(...), db: Session = Depends(connect)):
    summary = db.query(
        func.sum(Spending.amount).label('total_spent'),
        func.avg(Spending.amount).label('average_spent'),
        func.max(Spending.amount).label('max_spent'),
        func.count(Spending.amount).label('total_purchased')
    ).filter(Spending.user_id == user_id).first()
    if not summary or summary.total_spent is None:
        raise HTTPException(status_code=404, detail="No spending data available for the user.")

    store_breakdown = db.query(
        Spending.store_name,
        Spending.category,
        func.sum(Spending.amount).label('total_store_spent')
    ).filter(Spending.user_id == user_id).group_by(Spending.store_name, Spending.category).all()

    store_breakdown_list = [
        schemas.StoreBreakdown(
            store_name=record.store_name,
            category=record.category,
            total_store_spent=record.total_store_spent
        ) for record in store_breakdown
    ]
    spending_summary = schemas.SpendingSummary(
        total_spent=summary.total_spent,
        average_spent=summary.average_spent,
        max_spent=summary.max_spent,
        total_purchased=summary.total_purchased,
        store_breakdown=store_breakdown_list
    )
    return spending_summary



@app.post("/Spending", response_model=schemas.SpendingSchema)
def create_spending_record(spending_data: schemas.SpendingSchema, db: Session = Depends(connect)):
    # Create a new Spending record based on the SpendingSchema
    new_spending = Spending(
        user_id=spending_data.user_id,
        amount=spending_data.amount,
        category=spending_data.category,
        store_name=spending_data.store_name,
        type=spending_data.type,
        date=spending_data.date
    )
    db.add(new_spending)
    db.commit()
    db.refresh(new_spending)

    return new_spending  # Returns the newly created Spending record, matching SpendingSchema



def calculate_savings_plan(data: schemas.SavingsPlanCreate):
    years_to_retirement = data.retirement_age - data.current_age

    if years_to_retirement <= 0:
        raise ValueError("Retirement age must be greater than current age")

    annual_return_rate = 0.07  # Example 7% annual return
    monthly_return_rate = annual_return_rate / 12  # Convert annual return rate to monthly

    months_to_retirement = years_to_retirement * 12

    if data.monthly_contribution > 0:
        future_value_contributions = data.monthly_contribution * ((1 + monthly_return_rate) ** months_to_retirement - 1) / monthly_return_rate
    else:
        future_value_contributions = 0

    future_value_current_savings = data.current_savings * (1 + monthly_return_rate) ** months_to_retirement

    total_retirement_savings = future_value_contributions + future_value_current_savings

    monthly_savings_needed = (total_retirement_savings / months_to_retirement) if months_to_retirement > 0 else 0

    return {
        "total_retirement_savings": total_retirement_savings,
        "years_to_retirement": years_to_retirement,
        "monthly_savings_needed": monthly_savings_needed,
        "message": "Your savings plan has been successfully calculated!"
    }



@app.post("/generate_savings_plan/{user_id}", response_model=schemas.SavingsPlanResponse)
def generate_savings_plan(user_id: int, data: schemas.SavingsPlanCreate, db: Session = Depends(connect)):
    try:
        # Calculate the savings plan
        result = calculate_savings_plan(data)

        # Save the questionnaire data and the calculated results to the database
        new_plan = SavingsPlan(
            user_id=user_id,  # Associate with user_id
            total_retirement_savings=result["total_retirement_savings"],
            years_to_retirement=result["years_to_retirement"],
            monthly_savings_needed=result["monthly_savings_needed"],
            retirement_age=data.retirement_age,
            current_age=data.current_age,
            monthly_contribution=data.monthly_contribution,
            current_savings=data.current_savings,
            monthly_expenses=data.monthly_expenses,
            message=result["message"],
            annual_salary=data.annual_salary,
            risk_tolerance=data.risk_tolerance
        )

        db.add(new_plan)
        db.commit()
        db.refresh(new_plan)

        return new_plan
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


    
@app.get("/savings_plan/{user_id}", response_model=schemas.SavingsPlanResponse)
def get_savings_plan(user_id: int, db: Session = Depends(connect)):
    plan = db.query(SavingsPlan).filter(SavingsPlan.user_id == user_id).order_by(SavingsPlan.id.desc()).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Savings plan not found for user")

    return plan


@app.get("/Spending/{user_id}/expense", response_model=List[schemas.SpendingSchema])
def get_expense(user_id: int, db: Session = Depends(connect)):
    find_expenses = db.query(Spending).filter(Spending.user_id == user_id, Spending.type == "EXPENSE").all()

    if not find_expenses:
        raise HTTPException(status_code=404, detail="no expenses found")

    return find_expenses

@app.get("/Spending/{user_id}/income", response_model=List[schemas.SpendingSchema])
def get_income(user_id: int, db: Session = Depends(connect)):
    find_income = db.query(Spending).filter(Spending.user_id == user_id, Spending.type == "INCOME").all()

    if not find_income:
        raise HTTPException(status_code=404, detail="no expenses found")

    return find_income


@app.get("/Spending/{user_id}/investment", response_model=List[schemas.SpendingSchema])
def get_investment(user_id: int, db: Session = Depends(connect)):
    find_investment = db.query(Spending).filter(Spending.user_id == user_id, Spending.type == "INVESTMENT").all()

    if not find_investment:
        raise HTTPException(status_code=404, detail="no expenses found")

    return find_investment

@app.get("/Spending/{user_id}/total", response_model=float)
def get_total_by_type(user_id: int, type: Optional[str] = None, db: Session = Depends(connect)):
    if type not in {"EXPENSE", "INCOME", "INVESTMENT"}:
        raise HTTPException(status_code=400, detail="Invalid type. Must be 'Expense', 'Income', or 'Investment'")

    total_amount = db.query(func.sum(Spending.amount)).filter(
        Spending.user_id == user_id, Spending.type == type
    ).scalar()

    if total_amount is None:
        raise HTTPException(status_code=404, detail=f"No records found for type {type}")

    return total_amount




@app.get("/Spending/{user_id}/expense/monthly", response_model=Dict[str, Dict[str, Union[float, List[Dict]]]])
def get_monthly_expenses_with_details(
    user_id: int,
    start_date: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(..., description="End date in YYYY-MM-DD format"),
    db: Session = Depends(connect)
):
    # Parse the date strings to datetime objects
    try:
        start_datetime = datetime.strptime(start_date, "%Y-%m-%d")
        end_datetime = datetime.strptime(end_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD format.")

    # Query monthly expense totals
    monthly_expenses = db.query(
        func.to_char(Spending.date, 'YYYY-MM').label("month"),
        func.sum(Spending.amount).label("total")
    ).filter(
        Spending.user_id == user_id,
        Spending.type == "EXPENSE",
        Spending.date >= start_datetime,
        Spending.date <= end_datetime
    ).group_by("month").all()

    # Query transaction details within the specified date range
    transactions = db.query(
        func.to_char(Spending.date, 'YYYY-MM').label("month"),
        Spending.date,
        Spending.amount,
        Spending.category,
        Spending.store_name
    ).filter(
        Spending.user_id == user_id,
        Spending.type == "EXPENSE",
        Spending.date >= start_datetime,
        Spending.date <= end_datetime
    ).all()

    if not monthly_expenses:
        raise HTTPException(status_code=404, detail="No expenses found for this date range")

    # Convert result to a dictionary
    monthly_expenses_dict = {}
    for month, total in monthly_expenses:
        monthly_expenses_dict[month] = {
            "total": total,
            "transactions": [
                {
                    "date": transaction.date,
                    "amount": transaction.amount,
                    "category": transaction.category,
                    "store_name": transaction.store_name
                }
                for transaction in transactions if transaction.month == month
            ]
        }

    return monthly_expenses_dict



@app.get("/Spending/{user_id}/investment/monthly", response_model=Dict[str, Dict[str, Union[float, List[Dict]]]])
def get_monthly_investment_with_details(
    user_id: int,
    start_date: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(..., description="End date in YYYY-MM-DD format"),
    db: Session = Depends(connect)
):
    # Parse the date strings to datetime objects
    try:
        start_datetime = datetime.strptime(start_date, "%Y-%m-%d")
        end_datetime = datetime.strptime(end_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD format.")

    # Query monthly expense totals
    monthly_investment = db.query(
        func.to_char(Spending.date, 'YYYY-MM').label("month"),
        func.sum(Spending.amount).label("total")
    ).filter(
        Spending.user_id == user_id,
        Spending.type == "INVESTMENT",
        Spending.date >= start_datetime,
        Spending.date <= end_datetime
    ).group_by("month").all()

    # Query transaction details within the specified date range
    transactions = db.query(
        func.to_char(Spending.date, 'YYYY-MM').label("month"),
        Spending.date,
        Spending.amount,
        Spending.category,
        Spending.store_name
    ).filter(
        Spending.user_id == user_id,
        Spending.type == "INVESTMENT",
        Spending.date >= start_datetime,
        Spending.date <= end_datetime
    ).all()

    if not monthly_investment:
        raise HTTPException(status_code=404, detail="No expenses found for this date range")

    # Convert result to a dictionary
    monthly_invest_dict = {}
    for month, total in monthly_investment:
        monthly_invest_dict[month] = {
            "total": total,
            "transactions": [
                {
                    "date": transaction.date,
                    "amount": transaction.amount,
                    "category": transaction.category,
                    "store_name": transaction.store_name
                }
                for transaction in transactions if transaction.month == month
            ]
        }

    return monthly_invest_dict


@app.get("/Spending/{user_id}/income/monthly", response_model=Dict[str, Dict[str, Union[float, List[Dict]]]])
def get_monthly_income_with_details(
    user_id: int,
    start_date: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(..., description="End date in YYYY-MM-DD format"),
    db: Session = Depends(connect)
):
    # Parse the date strings to datetime objects
    try:
        start_datetime = datetime.strptime(start_date, "%Y-%m-%d")
        end_datetime = datetime.strptime(end_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD format.")

    # Query monthly expense totals
    monthly_income = db.query(
        func.to_char(Spending.date, 'YYYY-MM').label("month"),
        func.sum(Spending.amount).label("total")
    ).filter(
        Spending.user_id == user_id,
        Spending.type == "INCOME",
        Spending.date >= start_datetime,
        Spending.date <= end_datetime
    ).group_by("month").all()

    # Query transaction details within the specified date range
    transactions = db.query(
        func.to_char(Spending.date, 'YYYY-MM').label("month"),
        Spending.date,
        Spending.amount,
        Spending.category,
        Spending.store_name
    ).filter(
        Spending.user_id == user_id,
        Spending.type == "INCOME",
        Spending.date >= start_datetime,
        Spending.date <= end_datetime
    ).all()

    if not monthly_income:
        raise HTTPException(status_code=404, detail="No expenses found for this date range")

    # Convert result to a dictionary
    monthly_income_dict = {}
    for month, total in monthly_income:
        monthly_income_dict[month] = {
            "total": total,
            "transactions": [
                {
                    "date": transaction.date,
                    "amount": transaction.amount,
                    "category": transaction.category,
                    "store_name": transaction.store_name
                }
                for transaction in transactions if transaction.month == month
            ]
        }

    return monthly_income_dict


@app.get("/Spending/{user_id}/transactions/monthly", response_model=List[Dict])
def get_monthly_transactions(
    user_id: int,
    start_date: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(..., description="End date in YYYY-MM-DD format"),
    db: Session = Depends(connect)
):
    # Parse the date strings to datetime objects
    try:
        start_datetime = datetime.strptime(start_date, "%Y-%m-%d")
        end_datetime = datetime.strptime(end_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD format.")

    # Query transactions within the specified date range
    transactions = db.query(
        Spending.date,
        Spending.amount,
        Spending.category,
        Spending.store_name,
        Spending.type
    ).filter(
        Spending.user_id == user_id,
        Spending.date >= start_datetime,
        Spending.date <= end_datetime
    ).all()

    if not transactions:
        raise HTTPException(status_code=404, detail="No transactions found for this date range")

    # Format the response
    return [
        {
            "date": transaction.date,
            "amount": transaction.amount,
            "category": transaction.category,
            "store_name": transaction.store_name,
            "type": transaction.type
        }
        for transaction in transactions
    ]

@app.get("/Spending/{user_id}/transactions/yearly", response_model=List[schemas.TransactionResponse])
async def get_yearly_transact(user_id: int, year: int, db: Session = Depends(connect)):
    try:
        start_date = datetime(year, 1, 1)
        end_date = datetime(year, 12, 31, 23, 59, 59)
        
        # Fetch all transactions for the given user and year
        transactions = db.query(Spending).filter(
            Spending.user_id == user_id,
            Spending.date >= start_date,
            Spending.date <= end_date
        ).all()
        
        if not transactions:
            raise HTTPException(status_code=404, detail="No transactions found for this user and year")
        
        return transactions
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    


def calculate_total_portfolio_value(db: Session, user_id: int) -> float:
    # Fetch the user's portfolio
    portfolio = db.query(Portfolio).filter(Portfolio.user_id == user_id).first()
    if not portfolio:
        return 0.0  # Return 0 if no portfolio exists for the user

    # Fetch all StockHoldings related to this portfolio
    stocks = db.query(StockHolding).filter(StockHolding.portfolio_id == portfolio.id).all()
    total_value = sum(stock.quantity * stock.current_price for stock in stocks)
    return round(total_value, 2)


def calculate_stock_performance(db: Session, user_id: int) -> dict:
    # Fetch the user's portfolio
    portfolio = db.query(Portfolio).filter(Portfolio.user_id == user_id).first()
    if not portfolio:
        return {"best_performing": None, "least_performing": None}

    # Fetch all StockHoldings related to this portfolio
    stocks = db.query(StockHolding).filter(StockHolding.portfolio_id == portfolio.id).all()
    if not stocks:
        return {"best_performing": None, "least_performing": None}

    # Calculate performance
    performance = [
        {
            "ticker": stock.ticker,
            "quantity": stock.quantity,
            "average_price": stock.average_price,
            "current_price": stock.current_price,
            "performance": ((stock.current_price - stock.average_price) / stock.average_price) * 100
        }
        for stock in stocks
    ]

    # Determine best and least performing stocks
    best_performing = max(performance, key=lambda x: x["performance"])
    least_performing = min(performance, key=lambda x: x["performance"])

    return {
        "best_performing": {
            "ticker": best_performing["ticker"],
            "performance": round(best_performing["performance"], 2),
            "current_price": best_performing["current_price"],
            "average_price": best_performing["average_price"],
            "quantity": best_performing["quantity"]
        },
        "least_performing": {
            "ticker": least_performing["ticker"],
            "performance": round(least_performing["performance"], 2),
            "current_price": least_performing["current_price"],
            "average_price": least_performing["average_price"],
            "quantity": least_performing["quantity"]
        }
    }


def get_portfolio_analysis(db: Session, user_id: int) -> dict:
    total_value = calculate_total_portfolio_value(db, user_id)
    performance_data = calculate_stock_performance(db, user_id)

    return {
        "total_value": total_value,
        "best_performing": performance_data.get("best_performing"),
        "least_performing": performance_data.get("least_performing")
    }



@app.get("/{user_id}/portfolio/analysis")
def get_portfolio_analysis_endpoint(user_id: int, db: Session = Depends(connect)):
    try:
        # Fetch the user's portfolio
        portfolio = db.query(Portfolio).filter(Portfolio.user_id == user_id).first()
        if not portfolio:
            raise HTTPException(status_code=404, detail="Portfolio not found")

        # Use the relationship to access stocks
        stock_list = portfolio.stocks
        if not stock_list:
            return {
                "total_value": 0.0,
                "best_performing": None,
                "least_performing": None
            }

        # Calculate total portfolio value
        total_value = sum(
            (stock.quantity or 0) * (stock.current_price or 0) for stock in stock_list
        )

        # Calculate performance for each stock
        performance_data = [
            {
                "ticker": stock.ticker,
                "quantity": stock.quantity or 0,
                "average_price": stock.average_price or 0,
                "current_price": stock.current_price if stock.current_price and stock.current_price > 0 else None,
                "performance": (
                    ((stock.current_price or 0) - (stock.average_price or 0))
                    / (stock.average_price or 1)
                ) * 100 if stock.average_price else 0,
                "value": stock.current_price * stock.quantity
            }
            for stock in stock_list
        ]


        valid_performance_data = [stock for stock in performance_data if stock["current_price"]]

        # If no valid stocks, return None for least_performing
        if not valid_performance_data:
            return {
                "total_value": round(total_value, 2),
                "best_performing": None,
                "least_performing": None
            }

        # Find best and least performing stocks
        best_performing = max(performance_data, key=lambda x: x["performance"])
        least_performing = min(performance_data, key=lambda x: x["performance"])

        print("Stock List:", stock_list)
        print("Performance Data:", performance_data)


        # Return analysis
        return {
            "total_value": round(total_value, 2),
            "best_performing": {
                "ticker": best_performing["ticker"],
                "performance": round(best_performing["performance"], 2),
                "current_price": best_performing["current_price"],
                "average_price": best_performing["average_price"],
                "quantity": best_performing["quantity"],
                "value": best_performing["value"]

            },
            "least_performing": {
                "ticker": least_performing["ticker"],
                "performance": round(least_performing["performance"], 2),
                "current_price": least_performing["current_price"],
                "average_price": least_performing["average_price"],
                "quantity": least_performing["quantity"],
                "value": least_performing["value"]

            }
        }
    except HTTPException as http_ex:
        raise http_ex  # Properly propagate 404 error
    except Exception as e:
        print(f"Error processing request for user_id {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")



