from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import database
import models

# 创建表
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic 模型 (用于接收前端数据) ---
class UserAuth(BaseModel):
    username: str
    password: str

class UserProfile(BaseModel):
    username: str
    gender: str
    height: float
    weight: float
    age: int
    bmr: float

class FoodEntry(BaseModel):
    user_id: int
    meal_type: str
    name: str
    weight: float
    calories_per_100g: float

# --- 接口逻辑 ---

@app.get("/")
def read_root():
    return {"status": "Gym Assistant API Ready"}

# 1. 注册
@app.post("/register/")
def register(user: UserAuth, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    new_user = models.User(username=user.username, password=user.password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"id": new_user.id, "username": new_user.username}

# 2. 登录
@app.post("/login/")
def login(user: UserAuth, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user or db_user.password != user.password:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    # 返回用户信息和BMR，方便前端缓存
    return {
        "id": db_user.id, 
        "username": db_user.username,
        "bmr": db_user.bmr,
        "gender": db_user.gender,
        "height": db_user.height,
        "weight": db_user.weight,
        "age": db_user.age
    }

# 3. 更新个人资料 (计算BMR后保存)
@app.post("/update-profile/")
def update_profile(profile: UserProfile, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.username == profile.username).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_user.gender = profile.gender
    db_user.height = profile.height
    db_user.weight = profile.weight
    db_user.age = profile.age
    db_user.bmr = profile.bmr
    
    db.commit()
    return {"status": "updated", "bmr": profile.bmr}

# 4. 添加饮食记录
@app.post("/add-log/")
def add_food_log(entry: FoodEntry, db: Session = Depends(database.get_db)):
    if entry.name == "无" or entry.weight <= 0:
        return {"message": "Skipped"}
        
    calculated_cal = (entry.calories_per_100g / 100) * entry.weight
    
    new_log = models.FoodLog(
        name=entry.name,
        weight=entry.weight,
        total_cal=calculated_cal,
        meal_type=entry.meal_type,
        user_id=entry.user_id,
        log_date=datetime.now().date()
    )
    
    db.add(new_log)
    db.commit()
    return {"message": "success", "cal": calculated_cal}

# 5. 获取最近7天数据 (用于画图)
@app.get("/weekly-stats/{user_id}")
def get_weekly_stats(user_id: int, db: Session = Depends(database.get_db)):
    # 获取过去7天
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=6)
    
    # SQL 聚合查询：按日期分组求和
    stats = db.query(
        models.FoodLog.log_date,
        func.sum(models.FoodLog.total_cal).label("daily_total")
    ).filter(
        models.FoodLog.user_id == user_id,
        models.FoodLog.log_date >= start_date
    ).group_by(models.FoodLog.log_date).all()
    
    # 格式化数据给前端
    data_map = {s[0]: s[1] for s in stats}
    result = []
    
    for i in range(7):
        current_date = start_date + timedelta(days=i)
        val = data_map.get(current_date, 0)
        result.append({
            "date": current_date.strftime("%m/%d"),
            "total": val
        })
        
    return result