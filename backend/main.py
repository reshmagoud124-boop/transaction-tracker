
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from backend.database import engine, get_db
from backend import models, schemas

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Transaction Tracker API",
    description="Backend API for managing personal finances",
    version="1.0.0"
)

# Allow React frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "Transaction Tracker API is running!",
        "status": "success"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


# READ: Get all transactions
@app.get("/transactions", response_model=list[schemas.TransactionResponse])
def get_transactions(db: Session = Depends(get_db)):
    return db.query(models.Transaction).all()


# CREATE: Add a transaction
@app.post(
    "/transactions",
    response_model=schemas.TransactionResponse,
    status_code=201
)
def create_transaction(
    transaction: schemas.TransactionCreate,
    db: Session = Depends(get_db)
):
    if transaction.type not in ["Income", "Expense"]:
        raise HTTPException(
            status_code=400,
            detail="Type must be Income or Expense"
        )

    new_transaction = models.Transaction(**transaction.model_dump())

    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)

    return new_transaction


# UPDATE: Edit an existing transaction
@app.put(
    "/transactions/{transaction_id}",
    response_model=schemas.TransactionResponse
)
def update_transaction(
    transaction_id: int,
    transaction: schemas.TransactionCreate,
    db: Session = Depends(get_db)
):
    existing_transaction = db.query(models.Transaction).filter(
        models.Transaction.id == transaction_id
    ).first()

    if existing_transaction is None:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )

    if transaction.type not in ["Income", "Expense"]:
        raise HTTPException(
            status_code=400,
            detail="Type must be Income or Expense"
        )

    for key, value in transaction.model_dump().items():
        setattr(existing_transaction, key, value)

    db.commit()
    db.refresh(existing_transaction)

    return existing_transaction


# DELETE: Remove a transaction
@app.delete("/transactions/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db)
):
    existing_transaction = db.query(models.Transaction).filter(
        models.Transaction.id == transaction_id
    ).first()

    if existing_transaction is None:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )

    db.delete(existing_transaction)
    db.commit()

    return {"message": "Transaction deleted successfully"}
 