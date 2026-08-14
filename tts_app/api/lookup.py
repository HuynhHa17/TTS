"""API: Lookup tables — Syndicates & Companies"""
from flask import Blueprint, request, jsonify
from core.database import get_session
from core.models import Syndicate, Company

lookup_bp = Blueprint("lookup", __name__)

# ── Syndicates ────────────────────────────────────────────────────────────────

@lookup_bp.route("/syndicates", methods=["GET"])
def list_syndicates():
    db = get_session()
    try:
        items = db.query(Syndicate).order_by(Syndicate.id).all()
        return jsonify([s.to_dict() for s in items])
    finally:
        db.close()


@lookup_bp.route("/syndicates", methods=["POST"])
def create_syndicate():
    db = get_session()
    try:
        data = request.get_json() or {}
        valid = set(Syndicate.__table__.columns.keys()) - {"id", "created_at"}
        s = Syndicate(**{k: v for k, v in data.items() if k in valid})
        db.add(s)
        db.commit()
        db.refresh(s)
        return jsonify(s.to_dict()), 201
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        db.close()


@lookup_bp.route("/syndicates/<int:sid>", methods=["PUT"])
def update_syndicate(sid):
    db = get_session()
    try:
        s = db.query(Syndicate).filter(Syndicate.id == sid).first()
        if not s:
            return jsonify({"error": "Không tìm thấy"}), 404
        data  = request.get_json() or {}
        valid = set(Syndicate.__table__.columns.keys()) - {"id", "created_at"}
        for k, v in data.items():
            if k in valid:
                setattr(s, k, v)
        db.commit()
        return jsonify(s.to_dict())
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        db.close()


@lookup_bp.route("/syndicates/<int:sid>", methods=["DELETE"])
def delete_syndicate(sid):
    db = get_session()
    try:
        s = db.query(Syndicate).filter(Syndicate.id == sid).first()
        if not s:
            return jsonify({"error": "Không tìm thấy"}), 404
        db.delete(s)
        db.commit()
        return jsonify({"ok": True})
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        db.close()


# ── Companies ────────────────────────────────────────────────────────────────

@lookup_bp.route("/companies", methods=["GET"])
def list_companies():
    db = get_session()
    try:
        items = db.query(Company).order_by(Company.id).all()
        return jsonify([c.to_dict() for c in items])
    finally:
        db.close()


@lookup_bp.route("/companies", methods=["POST"])
def create_company():
    db = get_session()
    try:
        data  = request.get_json() or {}
        valid = set(Company.__table__.columns.keys()) - {"id", "created_at"}
        c = Company(**{k: v for k, v in data.items() if k in valid})
        db.add(c)
        db.commit()
        db.refresh(c)
        return jsonify(c.to_dict()), 201
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        db.close()


@lookup_bp.route("/companies/<int:cid>", methods=["PUT"])
def update_company(cid):
    db = get_session()
    try:
        co = db.query(Company).filter(Company.id == cid).first()
        if not co:
            return jsonify({"error": "Không tìm thấy"}), 404
        data  = request.get_json() or {}
        valid = set(Company.__table__.columns.keys()) - {"id", "created_at"}
        for k, v in data.items():
            if k in valid:
                setattr(co, k, v)
        db.commit()
        return jsonify(co.to_dict())
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        db.close()


@lookup_bp.route("/companies/<int:cid>", methods=["DELETE"])
def delete_company(cid):
    db = get_session()
    try:
        co = db.query(Company).filter(Company.id == cid).first()
        if not co:
            return jsonify({"error": "Không tìm thấy"}), 404
        db.delete(co)
        db.commit()
        return jsonify({"ok": True})
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        db.close()
