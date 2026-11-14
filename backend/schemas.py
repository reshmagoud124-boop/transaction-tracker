
from pydantic import BaseModel, Field


class TransactionCreate(BaseModel):
    title: str
    amount: float = Field(gt=0)
    category: str
    type: str
    date: str
    description: str | None = None


class TransactionResponse(BaseModel):
    id: int
    title: str
    amount: float
    category: str
    type: str
    date: str
    description: str | None = None

    model_config = {"from_attributes": True}
