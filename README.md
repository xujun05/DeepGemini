<div align="center">
<h1>DeepGemini 🌟</h1>
<p>A Flexible Multi-Model Orchestration API with OpenAI Compatibility</p>

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Python 3.11](https://img.shields.io/badge/Python-3.11-blue?style=flat-square&logo=python)](https://www.python.org)
[![OpenAI Compatible](https://img.shields.io/badge/OpenAI-Compatible-412991?style=flat-square&logo=openai)](https://platform.openai.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

</div>

## ✨ Features

- **Multi-Model Orchestration**: Seamlessly combine multiple AI models in customizable workflows
- **Provider Flexibility**: Support for multiple AI providers including DeepSeek, Claude, Gemini, and more
- **OpenAI Compatible**: Drop-in replacement for OpenAI's API in existing applications
- **Stream Support**: Real-time streaming responses for better user experience
- **Advanced Configuration**: Fine-grained control over model parameters and system prompts
- **Database Integration**: SQLite-based configuration storage with Alembic migrations
- **Web Management UI**: Built-in interface for managing models and configurations

## 🚀 Quick Start

### 1. Installation

```bash
git clone https://github.com/ErlichLiu/DeepGemini.git
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

Visit `http://localhost:8000` to access the web management interface.

## 🔧 Model Configuration

DeepGemini supports various AI providers:

- **DeepSeek**: Advanced reasoning capabilities
- **Claude**: Refined text generation
- **Gemini**: Google's AI model
- **Custom**: Add your own provider integration

Each model can be configured with:
- API credentials
- Model parameters (temperature, top_p, etc.)
- System prompts
- Usage type (reasoning/execution/both)

## 🔄 Workflow Configuration

Create custom workflows by combining models:

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


