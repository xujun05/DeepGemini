# 使用 Python 3.11 作为基础镜像
FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 安装 uv
RUN pip install uv

# 复制项目文件
COPY . .

# 使用 uv 安装依赖
RUN uv sync

# 设置数据库文件权限
RUN touch /app/deepgemini.db && chmod 666 /app/deepgemini.db

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"] 