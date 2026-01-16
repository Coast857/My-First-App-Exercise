from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
import database
import models

# 1. 创建数据库表（如果不存在）
models.Base.metadata.create_all(bind=database.engine)

# 2. 初始化 FastAPI 应用（Uvicorn 找的就是这个变量！）
app = FastAPI()

# 3. 配置跨域（允许前端访问）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 定义数据格式 ---
class FoodEntry(BaseModel):
    name: str
    weight: float
    calories_per_100g: float

# --- 定义接口 ---

@app.get("/")
def read_root():
    return {"status": "FastAPI 后端运行正常"}

@app.post("/add-log/")
def add_food_log(entry: FoodEntry, db: Session = Depends(database.get_db)):
    # 后端计算逻辑
    calculated_cal = (entry.calories_per_100g / 100) * entry.weight
    
    # 创建数据库对象
    new_log = models.FoodLog(
        name=entry.name,
        weight=entry.weight,
        total_cal=calculated_cal
    )
    
    # 存入数据库
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    
    return {"message": "success", "total_calories": calculated_cal}

@app.get("/history/")
def get_history(db: Session = Depends(database.get_db)):
    return db.query(models.FoodLog).all()