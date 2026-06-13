import logging
import os
import time
import shutil
import sys
from logging.handlers import TimedRotatingFileHandler

LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")
LOG_FILE = os.path.join(LOG_DIR, "todo.log")


class SafeTimedRotatingFileHandler(TimedRotatingFileHandler):
    """
    Windows-safe subclass of TimedRotatingFileHandler.

    On Windows the default handler crashes during rollover because it tries
    to rename an open file handle. This subclass closes the stream first,
    and skips gracefully if the rename still fails so logs keep flowing.
    """

    def doRollover(self):
        # Close the open file handle so Windows allows the rename.
        if self.stream:
            self.stream.close()
            self.stream = None  # type: ignore[assignment]

        # Calculate the dated backup filename (e.g. todo.log.2026-06-09).
        t = self.rolloverAt - self.interval
        dfn = self.rotation_filename(
            self.baseFilename + "." + time.strftime(self.suffix, time.localtime(t))
        )

        # Rename the current log to the backup name.
        if os.path.exists(self.baseFilename):
            try:
                if os.path.exists(dfn):
                    os.remove(dfn)
                shutil.move(self.baseFilename, dfn)
            except OSError as exc:
                print(
                    f"[logging] WARNING: Could not rotate log file: {exc}",
                    file=sys.stderr,
                )

        # Let the base class handle backup pruning (backupCount) and
        # advancing the rollover time.
        self.rolloverAt = self.computeRollover(int(time.time()))


def setup_logging():
    """Configure root logger with a daily rotating file handler and a console handler."""
    os.makedirs(LOG_DIR, exist_ok=True)

    log_format = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # --- Daily rotating file handler ---
    # Rotates at midnight; old files get the suffix: todo.log.YYYY-MM-DD
    # delay=True keeps the file closed until the first write, which avoids
    # a Windows file-lock error when the server starts after midnight.
    file_handler = SafeTimedRotatingFileHandler(
        filename=LOG_FILE,
        when="midnight",
        interval=1,
        backupCount=30,
        encoding="utf-8",
        utc=False,
        delay=True,
    )
    file_handler.setFormatter(log_format)
    file_handler.setLevel(logging.INFO)

    # --- Console handler (useful during dev with uvicorn) ---
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(log_format)
    console_handler.setLevel(logging.INFO)

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)

    # Avoid adding duplicate handlers if called more than once
    if not root_logger.handlers:
        root_logger.addHandler(file_handler)
        root_logger.addHandler(console_handler)
