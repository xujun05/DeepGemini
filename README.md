<div align="center">
<h1>DeepGemini 🌟</h1>
<p>A Flexible Multi-Model Orchestration API with OpenAI Compatibility</p>

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Python 3.11](https://img.shields.io/badge/Python-3.11-blue?style=flat-square&logo=python)](https://www.python.org)
[![OpenAI Compatible](https://img.shields.io/badge/OpenAI-Compatible-412991?style=flat-square&logo=openai)](https://platform.openai.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

</div>

[中文](README_zh.md) | [English](#features)

## ✨ Features

- **Multi-Model Orchestration**: Seamlessly combine multiple AI models in customizable workflows
- **Provider Flexibility**: Support for multiple AI providers:
  - DeepSeek
  - Claude
  - Gemini
  - Grok3
  - OpenAI
  - OneAPI
  - OpenRouter
  - Tencent Cloud
- **OpenAI Compatible**: Drop-in replacement for OpenAI's API in existing applications
- **Stream Support**: Real-time streaming responses for better user experience
- **Advanced Configuration**: Fine-grained control over model parameters and system prompts
- **Database Integration**: SQLite-based configuration storage with Alembic migrations
- **Web Management UI**: Built-in interface for managing models and configurations
- **Multi-language Support**: English and Chinese interface

## Preview

![image](https://img.pub/p/02f96adb71b92d9e8009.png)

![image](https://img.pub/p/1ffdc3728b7944caf807.png)

![image](https://img.pub/p/439520386b4927c91688.png)


## 🚀 Quick Start

### 1. Installation

```bash
git clone https://github.com/sligter/DeepGemini.git
cd DeepGemini
uv sync
```
### 2. Configuration

```bash
cp .env.example .env
```


Required environment variables:
- `ALLOW_API_KEY`: Your API access key
- `ALLOW_ORIGINS`: Allowed CORS origins (comma-separated or "*")

### 3. Run the Application

```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Visit `http://localhost:8000/dashboard` to access the web management interface.



## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

1. Create and configure your `.env` file:

```bash
cp .env.example .env
```

2. Build and start the container:

```bash
docker-compose up -d
```

3. Access the web interface at `http://localhost:8000/dashboard`

### Using Docker Directly

1. Pull the image:
```bash
docker pull bradleylzh/deepgemini:latest
```

2. Create necessary files:

For Linux/Mac:
```bash
# Create .env file
cp .env.example .env

# Create empty database file
touch deepgemini.db
chmod 666 deepgemini.db
```

For Windows PowerShell:
```powershell
# Create .env file
cp .env.example .env

# Create empty database file
echo "" > deepgemini.db
```

3. Run the container:

For Linux/Mac:
```bash
docker run -d \
-p 8000:8000 \
-v $(pwd)/.env:/app/.env \
-v $(pwd)/deepgemini.db:/app/deepgemini.db \
-e DATABASE_URL=sqlite:///app/deepgemini.db \
--name deepgemini \
bradleylzh/deepgemini:latest
```

For Windows PowerShell:
```powershell
docker run -d -p 8000:8000 `
-v ${PWD}\.env:/app/.env `
-v ${PWD}\deepgemini.db:/app/deepgemini.db `
-e DATABASE_URL=sqlite:///app/deepgemini.db `
--name deepgemini `
bradleylzh/deepgemini:latest
```


## 🔧 Model Configuration

DeepGemini supports various AI providers:

- **DeepSeek**: Advanced reasoning capabilities
- **Claude**: Refined text generation and thinking
- **Gemini**: Google's AI model
- **Grok3**: Grok's AI model
- **Custom**: Add your own provider integration

Each model can be configured with:
- API credentials
- Model parameters (temperature, top_p, tool, etc.)
- System prompts
- Usage type (reasoning/execution/both)

## 🔄 Relay Chain Configuration

Create custom Relay Chain by combining models:

1. **Reasoning Step**: Initial analysis and planning
2. **Execution Step**: Final response generation
3. **Custom Steps**: Add multiple steps as needed

```json
{
"name": "advanced_workflow",
"steps": [
{
"model_id": 1,
"step_type": "reasoning",
"step_order": 1
},
{
"model_id": 2,
"step_type": "execution",
"step_order": 2
}
]
}
```
## 🛠 Tech Stack

- [FastAPI](https://fastapi.tiangolo.com/): Modern web framework
- [SQLAlchemy](https://www.sqlalchemy.org/): Database ORM
- [Alembic](https://alembic.sqlalchemy.org/): Database migrations
- [UV](https://github.com/astral-sh/uv): Fast Python package installer
- [aiohttp](https://docs.aiohttp.org/): Async HTTP client
- [deepclaude](https://github.com/getasterisk/deepclaude)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📬 Contact

For questions and support, please open an issue on GitHub.


