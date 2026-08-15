"""
Database Backup Utility
- Tạo backup file .db trước khi thao tác quan trọng
- Giữ tối đa 10 bản backup gần nhất
- Lưu trong thư mục data/backups/
"""
import os
import shutil
import glob
from datetime import datetime

import config

BACKUP_DIR = os.path.join(config.DATA_DIR, "backups")
MAX_BACKUPS = 10


def create_backup(reason: str = "manual") -> str | None:
    """Tạo bản backup file .db.

    Args:
        reason: Lý do backup (startup, before_reload, manual)

    Returns:
        Đường dẫn file backup đã tạo, hoặc None nếu file DB không tồn tại.
    """
    if not os.path.isfile(config.DB_PATH):
        return None

    os.makedirs(BACKUP_DIR, exist_ok=True)

    timestamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
    db_name = os.path.basename(config.DB_PATH)
    backup_name = f"{db_name}.bak.{timestamp}.{reason}"
    backup_path = os.path.join(BACKUP_DIR, backup_name)

    shutil.copy2(config.DB_PATH, backup_path)

    # Dọn dẹp: giữ tối đa MAX_BACKUPS bản
    _cleanup_old_backups()

    return backup_path


def _cleanup_old_backups():
    """Xóa các bản backup cũ nhất, chỉ giữ MAX_BACKUPS bản."""
    pattern = os.path.join(BACKUP_DIR, "*.bak.*")
    backups = sorted(glob.glob(pattern), key=os.path.getmtime, reverse=True)

    for old_backup in backups[MAX_BACKUPS:]:
        try:
            os.remove(old_backup)
        except OSError:
            pass


def list_backups() -> list[dict]:
    """Liệt kê các bản backup hiện có.

    Returns:
        List[dict] với keys: filename, path, size_kb, created_at, reason
    """
    os.makedirs(BACKUP_DIR, exist_ok=True)
    pattern = os.path.join(BACKUP_DIR, "*.bak.*")
    backups = sorted(glob.glob(pattern), key=os.path.getmtime, reverse=True)

    result = []
    for bp in backups:
        stat = os.stat(bp)
        name = os.path.basename(bp)
        # Tách reason từ tên file: tts_master_v2.db.bak.2025-01-15_120000.startup
        parts = name.split(".")
        reason = parts[-1] if len(parts) > 4 else "unknown"

        result.append({
            "filename": name,
            "path": bp,
            "size_kb": round(stat.st_size / 1024, 1),
            "created_at": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S"),
            "reason": reason,
        })

    return result
