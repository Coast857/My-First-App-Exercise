import pandas as pd
import matplotlib.pyplot as plt
from sqlalchemy import create_engine

# 1. 连接数据库
engine = create_engine("postgresql://postgres:123456@localhost:5432/gym_assistant")

# 2. 用 Pandas 读取数据 (建模必备技能)
df = pd.read_sql("SELECT * FROM food_logs", engine)

# 3. 简单绘图：展示热量摄入趋势
if not df.empty:
    df['created_at'] = pd.to_datetime(df['created_at'])
    df.set_index('created_at')['total_cal'].plot()
    plt.title("Calories Intake Trend")
    plt.show()
else:
    print("数据库还没数据呢，先去网页上输几行！")