import logging
import re
import sys

# Masking pattern for API keys in logs
SECRET_PATTERNS = [
    r"(?i)(key|token|secret|password|authorization)=['\"]?([a-zA-Z0-9_\-\.]{8,})['\"]?",
    r"AIza[0-9A-Za-z-_]{35}",
]


class SecretMaskingFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            for pattern in SECRET_PATTERNS:
                record.msg = re.sub(pattern, "[REDACTED_SECRET]", record.msg)
        return True


def setup_logger(name: str = "wandergraph", level: int = logging.INFO) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(level)
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(level)
        formatter = logging.Formatter(
            fmt="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)
        handler.addFilter(SecretMaskingFilter())
        logger.addHandler(handler)
    return logger


logger = setup_logger()
