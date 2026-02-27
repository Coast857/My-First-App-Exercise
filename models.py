from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)  # 实际项目中应加密存储，这里简化为明文
    gender = Column(String, default="male")
    height = Column(Float, default=170.0) # cm
    weight = Column(Float, default=65.0)  # kg
    age = Column(Integer, default=20)
    bmr = Column(Float, default=0.0)      # 基础代谢率

    logs = relationship("FoodLog", back_populates="owner")

class FoodLog(Base):
    __tablename__ = "food_logs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    weight = Column(Float)
    total_cal = Column(Float)
    meal_type = Column(String) # "breakfast", "lunch", "dinner", "snack"
    log_date = Column(Date, default=datetime.now().date) # 记录日期
    created_at = Column(DateTime, default=datetime.now)
    
    user_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="logs")