"""API: Lookup tables — Syndicates & Companies"""
from flask import Blueprint, request, jsonify
from core.database import get_session
from core.models import Organization, to_dict

lookup_bp = Blueprint("lookup", __name__)


def _map_org_input(data: dict, org_type: str) -> dict:
    d = dict(data or {})
    d["type"] = org_type
    # Map legacy aliases
    if "ten_vnm" in d and "name_vn" not in d:
        d["name_vn"] = d["ten_vnm"]
    if "ten_jpn" in d and "name_jp" not in d:
        d["name_jp"] = d["ten_jpn"]
    if "chu_tich_vnm" in d and "representative_vn" not in d:
        d["representative_vn"] = d["chu_tich_vnm"]
    if "chu_tich_jpn" in d and "representative_jp" not in d:
        d["representative_jp"] = d["chu_tich_jpn"]
    if "giam_doc_vnm" in d and "representative_vn" not in d:
        d["representative_vn"] = d["giam_doc_vnm"]
    if "giam_doc_jpn" in d and "representative_jp" not in d:
        d["representative_jp"] = d["giam_doc_jpn"]
    if "dia_chi_vnm" in d and "address_vn" not in d:
        d["address_vn"] = d["dia_chi_vnm"]
    if "dia_chi_jpn" in d and "address_jp" not in d:
        d["address_jp"] = d["dia_chi_jpn"]
    if "so_dien_thoai" in d and "phone" not in d:
        d["phone"] = d["so_dien_thoai"]
    return d


def _serialize_org(org: Organization) -> dict:
    if not org:
        return {}
    res = to_dict(org)
    # Add legacy keys for backward compatibility
    res["ten_vnm"] = org.name_vn or ""
    res["ten_jpn"] = org.name_jp or ""
    res["chu_tich_vnm"] = org.representative_vn or ""
    res["chu_tich_jpn"] = org.representative_jp or ""
    res["giam_doc_vnm"] = org.representative_vn or ""
    res["giam_doc_jpn"] = org.representative_jp or ""
    res["dia_chi_vnm"] = org.address_vn or ""
    res["dia_chi_jpn"] = org.address_jp or ""
    res["so_dien_thoai"] = org.phone or ""
    return res


# ── Syndicates (type='supervising') ──────────────────────────────────────────

@lookup_bp.route("/syndicates", methods=["GET"])
def list_syndicates():
    db = get_session()
    try:
        items = db.query(Organization).filter(Organization.type == "supervising").order_by(Organization.id).all()
        return jsonify([_serialize_org(s) for s in items])
    finally:
        db.close()


@lookup_bp.route("/syndicates", methods=["POST"])
def create_syndicate():
    db = get_session()
    try:
        data = _map_org_input(request.get_json() or {}, "supervising")
        valid = set(Organization.__table__.columns.keys()) - {"id"}
        s = Organization(**{k: v for k, v in data.items() if k in valid})
        db.add(s)
        db.commit()
        db.refresh(s)
        return jsonify(_serialize_org(s)), 201
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        db.close()


@lookup_bp.route("/syndicates/<int:sid>", methods=["PUT"])
def update_syndicate(sid):
    db = get_session()
    try:
        s = db.query(Organization).filter(Organization.id == sid, Organization.type == "supervising").first()
        if not s:
            return jsonify({"error": "Không tìm thấy"}), 404
        data = _map_org_input(request.get_json() or {}, "supervising")
        valid = set(Organization.__table__.columns.keys()) - {"id", "type"}
        for k, v in data.items():
            if k in valid:
                setattr(s, k, v)
        db.commit()
        return jsonify(_serialize_org(s))
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        db.close()


@lookup_bp.route("/syndicates/<int:sid>", methods=["DELETE"])
def delete_syndicate(sid):
    db = get_session()
    try:
        s = db.query(Organization).filter(Organization.id == sid, Organization.type == "supervising").first()
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


# ── Companies (type='accepting') ─────────────────────────────────────────────

@lookup_bp.route("/companies", methods=["GET"])
def list_companies():
    db = get_session()
    try:
        items = db.query(Organization).filter(Organization.type == "accepting").order_by(Organization.id).all()
        return jsonify([_serialize_org(c) for c in items])
    finally:
        db.close()


@lookup_bp.route("/companies", methods=["POST"])
def create_company():
    db = get_session()
    try:
        data = _map_org_input(request.get_json() or {}, "accepting")
        valid = set(Organization.__table__.columns.keys()) - {"id"}
        c = Organization(**{k: v for k, v in data.items() if k in valid})
        db.add(c)
        db.commit()
        db.refresh(c)
        return jsonify(_serialize_org(c)), 201
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        db.close()


@lookup_bp.route("/companies/<int:cid>", methods=["PUT"])
def update_company(cid):
    db = get_session()
    try:
        co = db.query(Organization).filter(Organization.id == cid, Organization.type == "accepting").first()
        if not co:
            return jsonify({"error": "Không tìm thấy"}), 404
        data = _map_org_input(request.get_json() or {}, "accepting")
        valid = set(Organization.__table__.columns.keys()) - {"id", "type"}
        for k, v in data.items():
            if k in valid:
                setattr(co, k, v)
        db.commit()
        return jsonify(_serialize_org(co))
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        db.close()


@lookup_bp.route("/companies/<int:cid>", methods=["DELETE"])
def delete_company(cid):
    db = get_session()
    try:
        co = db.query(Organization).filter(Organization.id == cid, Organization.type == "accepting").first()
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
