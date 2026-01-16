from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from database import Base

class FoodLog(Base):
    __tablename__ = "food_logs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    weight = Column(Float)
    total_cal = Column(Float)
    created_at = Column(DateTime, default=datetime.now)