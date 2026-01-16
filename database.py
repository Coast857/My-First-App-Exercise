from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# ⚠️ 这里的 123456 要改成你安装 PostgreSQL 设置的密码
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:19780219yfM@localhost:5432/gym_assistant"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()