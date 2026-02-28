import pandas as pd
import matplotlib.pyplot as plt
from sqlalchemy import create_engine

# 1. 连接数据库 - 已更新密码为：13579github
engine = create_engine("postgresql://postgres:13579github@localhost:5432/gym_assistant")

# 2. 用 Pandas 读取数据
try:
    df = pd.read_sql("SELECT * FROM food_logs", engine)

    # 3. 绘图逻辑
    if not df.empty:
        df['created_at'] = pd.to_datetime(df['created_at'])
        # 按日期排序并绘图
        df.sort_values('created_at').set_index('created_at')['total_cal'].plot(marker='o')
        plt.title("Calories Intake Trend")
        plt.xlabel("Date")
        plt.ylabel("Calories (kcal)")
        plt.grid(True)
        plt.show()
    else:
        print("数据库中尚无记录，请先在网页端输入数据！")
except Exception as e:
    print(f"连接失败，请检查密码或数据库状态。错误信息: {e}")