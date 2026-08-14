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
    """Create all tables if not exist."""
    from core import models  # noqa: F401 – import to register models
    Base.metadata.create_all(bind=engine)
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
