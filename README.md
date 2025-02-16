# Model Collaboration API

一个基于 FastAPI 的模型协作 API 服务，支持多模型配置和 OpenAI 兼容格式。

## 特性

- 支持多模型协作配置
- 支持流式和非流式输出
- OpenAI 兼容的 API 格式
- 可视化的模型和配置管理界面
- 支持 Docker 部署

## 快速开始

### 本地运行

1. 克隆项目
```bash
git clone [your-repo-url]
cd model-collaboration-api
```

2. 安装依赖
```bash
# 使用 uv 安装依赖
uv sync
# 激活虚拟环境
source .venv/bin/activate  # Linux/macOS
.venv\Scripts\activate     # Windows
```

3. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，填写必要的配置信息
```

4. 运行服务
```bash
uvicorn app.main:app --reload
```

### Docker 部署

使用 docker-compose:

```bash
docker-compose up -d
```

## API 使用

### 基础 URL
```
http://localhost:8000/v1
```

### 主要端点

- `GET /models` - 获取可用模型列表
- `GET /configurations` - 获取模型配置列表
- `POST /chat/completions` - 发送对话请求

### 示例请求

```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "your-config-name",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": true
  }'
```

## 配置管理

访问 `http://localhost:8000/static/index.html` 进行可视化配置管理：

- 添加/编辑模型
- 创建模型协作配置
- 管理系统提示词
- 切换配置状态

## 项目结构

```
app/
├── clients/          # 模型客户端实现
├── models/           # 数据模型和协作逻辑
├── static/          # 前端界面
├── utils/           # 工具函数
└── main.py          # 主应用入口
```

## 技术栈

- FastAPI
- SQLAlchemy
- Bootstrap
- Docker

## 许可证

[MIT License](LICENSE)