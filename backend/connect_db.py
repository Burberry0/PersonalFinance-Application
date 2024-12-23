from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import sessionmaker

# Example DATABASE_URL with a specified port
DATABASE_URL = "postgresql://brandonkohler:Cookie99@localhost:5433/postgres"

# Create the SQLAlchemy engine
engine = create_engine(DATABASE_URL)

# Create a configured "Session" class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)






def connect():
    db = SessionLocal()
    try:
        yield db
        # Log or handle success
        print("Database operation successful")
    except SQLAlchemyError as e:
        # Log the exception or handle it as necessary
        print(f"An error occurred: {e}")
        raise  # Optionally re-raise the exception
    finally:
        db.close()

if __name__ == "__main__":
    connect()

