import logging
import colorlog
import sys
import os
from dotenv import load_dotenv
from datetime import datetime

# 确保环境变量被加载
load_dotenv()

def get_log_level() -> int:
    """从环境变量获取日志级别
    
    Returns:
        int: logging 模块定义的日志级别
    """
    level_map = {
        'DEBUG': logging.DEBUG,
        'INFO': logging.INFO,
        'WARNING': logging.WARNING,
        'ERROR': logging.ERROR,
        'CRITICAL': logging.CRITICAL
    }
    
    level = os.getenv('LOG_LEVEL', 'INFO').upper()
    return level_map.get(level, logging.INFO)

def setup_logger(name: str = "DeepGemini") -> logging.Logger:
    """设置一个彩色的logger

    Args:
        name (str, optional): logger的名称. Defaults to "DeepClaude".

    Returns:
        logging.Logger: 配置好的logger实例
    """
    # 获取logger实例
    logger = colorlog.getLogger(name)
    
    # 清除现有处理器，避免重复
    if logger.handlers:
        for handler in logger.handlers:
            logger.removeHandler(handler)
    
    # 从环境变量获取日志级别
    log_level = get_log_level()
    
    # 设置日志级别
    logger.setLevel(log_level)
    
    # 创建控制台处理器
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    
    # 设置彩色日志格式
    formatter = colorlog.ColoredFormatter(
        "%(log_color)s%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        log_colors={
            'DEBUG':    'cyan',
            'INFO':     'green',
            'WARNING':  'yellow',
            'ERROR':    'red',
            'CRITICAL': 'red,bg_white',
        }
    )
    
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # 防止日志传播到父logger，这可以减少重复日志
    logger.propagate = False
    
    return logger

# 创建一个默认的logger实例
logger = setup_logger()
