"""
Database setup — SQLAlchemy + SQLite
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

import config

DATABASE_URL = f"sqlite:///{config.DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def init_db():
    """Create all tables if not exist and ensure new columns are added."""
    from core import models  # noqa: F401 – import to register models
    Base.metadata.create_all(bind=engine)
    
    # Auto-add columns if migrating an existing SQLite database
    from sqlalchemy import text
    with engine.connect() as conn:
        cols_to_add = [
            ("candidates", "guardian_name_en", "VARCHAR(200)"),
            ("candidates", "guardian_relationship", "VARCHAR(100)"),
            ("candidates", "guardian_job_vn", "VARCHAR(200)"),
            ("candidates", "guardian_job_en", "VARCHAR(200)"),
            ("candidates", "guardian_job_jp", "VARCHAR(200)"),
            ("family_members", "full_name_en", "VARCHAR(100)"),
            ("family_members", "occupation_en", "VARCHAR(100)"),
            ("family_members", "occupation_jp", "VARCHAR(100)"),
        ]
        for table, col, col_type in cols_to_add:
            try:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}"))
                conn.commit()
            except Exception:
                pass
    print("   ✅ Database ready.")


def get_db():
    """Get a DB session (use in Flask routes)."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_session():
    """Get a plain session (use outside request context)."""
    return SessionLocal()
