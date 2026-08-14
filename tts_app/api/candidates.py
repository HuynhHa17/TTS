import json
from flask import Blueprint, request, jsonify
from sqlalchemy import or_
from core.database import get_session
from core.models import (
    Candidate, IdentityDocument, Education, WorkExperience,
    SkillExperience, JapanExperience, FamilyMember, CandidateAssignment, Organization,
    to_dict
)

candidates_bp = Blueprint("candidates", __name__)

def _build_full_profile(c):
    c_dict = to_dict(c)
    if c_dict and c_dict.get("custom_fields"):
        try:
            c_dict["custom_fields"] = json.loads(c_dict["custom_fields"])
        except:
            c_dict["custom_fields"] = {}
            
    return {
        "candidate": c_dict,
        "identityDocuments": [to_dict(x) for x in c.identity_documents],
        "educations": [to_dict(x) for x in c.educations],
        "workExperiences": [to_dict(x) for x in c.work_experiences],
        "skillExperiences": [to_dict(x) for x in c.skill_experiences],
        "japanExperiences": [to_dict(x) for x in c.japan_experiences],
        "familyMembers": [to_dict(x) for x in c.family_members],
        "assignment": to_dict(c.assignment) if c.assignment else None,
        "supervisingOrg": to_dict(c.assignment.supervising_org) if c.assignment and c.assignment.supervising_org else None,
        "acceptingOrg": to_dict(c.assignment.accepting_org) if c.assignment and c.assignment.accepting_org else None,
        "sendingOrg": to_dict(c.assignment.sending_org) if c.assignment and c.assignment.sending_org else None,
    }

@candidates_bp.route("/candidates", methods=["GET"])
def list_candidates():
    db = get_session()
    try:
        q      = request.args.get("q", "").strip()
        page   = int(request.args.get("page", 1))
        limit  = int(request.args.get("limit", 50))
        status = request.args.get("status", "")

        query = db.query(Candidate)
        if q:
            query = query.filter(or_(
                Candidate.full_name_vn.ilike(f"%{q}%"),
                Candidate.profile_code.ilike(f"%{q}%"),
                Candidate.phone.ilike(f"%{q}%"),
            ))
        if status:
            query = query.filter(Candidate.status == status)

        total  = query.count()
        items  = query.order_by(Candidate.id).offset((page - 1) * limit).limit(limit).all()

        results = []
        for c in items:
            c_dict = to_dict(c)
            if c_dict and c_dict.get("custom_fields"):
                try:
                    c_dict["custom_fields"] = json.loads(c_dict["custom_fields"])
                except:
                    c_dict["custom_fields"] = {}
            results.append(c_dict)

        return jsonify(results)
    finally:
        db.close()

@candidates_bp.route("/candidates/<int:cid>", methods=["GET"])
def get_candidate(cid):
    db = get_session()
    try:
        c = db.query(Candidate).filter(Candidate.id == cid).first()
        if not c:
            return jsonify({"error": "Not found"}), 404
        return jsonify(_build_full_profile(c))
    finally:
        db.close()

@candidates_bp.route("/candidates", methods=["POST"])
def create_candidate():
    db = get_session()
    try:
        data = request.get_json() or {}
        c_data = data.get("candidate", {})
        
        count = db.query(Candidate).count()
        if not c_data.get("profile_code"):
            c_data["profile_code"] = f"TTS-{count + 1:03d}"
            
        if "custom_fields" in c_data and isinstance(c_data["custom_fields"], dict):
            c_data["custom_fields"] = json.dumps(c_data["custom_fields"])
            
        c = Candidate(**{k: v for k, v in c_data.items() if k in Candidate.__table__.columns.keys()})
        db.add(c)
        db.flush()

        for doc in data.get("identityDocuments", []):
            db.add(IdentityDocument(**{k: v for k, v in doc.items() if k in IdentityDocument.__table__.columns.keys() and k != 'id'}, candidate_id=c.id))
        
        for edu in data.get("educations", []):
            db.add(Education(**{k: v for k, v in edu.items() if k in Education.__table__.columns.keys() and k != 'id'}, candidate_id=c.id))

        for work in data.get("workExperiences", []):
            db.add(WorkExperience(**{k: v for k, v in work.items() if k in WorkExperience.__table__.columns.keys() and k != 'id'}, candidate_id=c.id))
            
        for skill in data.get("skillExperiences", []):
            db.add(SkillExperience(**{k: v for k, v in skill.items() if k in SkillExperience.__table__.columns.keys() and k != 'id'}, candidate_id=c.id))
            
        for jpe in data.get("japanExperiences", []):
            db.add(JapanExperience(**{k: v for k, v in jpe.items() if k in JapanExperience.__table__.columns.keys() and k != 'id'}, candidate_id=c.id))
            
        for fam in data.get("familyMembers", []):
            db.add(FamilyMember(**{k: v for k, v in fam.items() if k in FamilyMember.__table__.columns.keys() and k != 'id'}, candidate_id=c.id))

        db.commit()
        db.refresh(c)
        return jsonify(_build_full_profile(c)), 201
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        db.close()

@candidates_bp.route("/candidates/<int:cid>", methods=["PUT"])
def update_candidate(cid):
    db = get_session()
    try:
        c = db.query(Candidate).filter(Candidate.id == cid).first()
        if not c:
            return jsonify({"error": "Not found"}), 404
            
        data = request.get_json() or {}
        c_data = data.get("candidate", {})
        
        valid_cols = set(Candidate.__table__.columns.keys()) - {"id", "created_at"}
        
        if "custom_fields" in c_data and isinstance(c_data["custom_fields"], dict):
            c_data["custom_fields"] = json.dumps(c_data["custom_fields"])
            
        for k, v in c_data.items():
            if k in valid_cols:
                setattr(c, k, v)
                
        # We will keep it simple: drop all related records and recreate
        # In a production app you'd want to merge them by ID
        for rel in [c.identity_documents, c.educations, c.work_experiences, 
                    c.skill_experiences, c.japan_experiences, c.family_members]:
            for item in list(rel):
                db.delete(item)
                
        db.flush()
        
        for doc in data.get("identityDocuments", []):
            db.add(IdentityDocument(**{k: v for k, v in doc.items() if k in IdentityDocument.__table__.columns.keys() and k != 'id'}, candidate_id=c.id))
        for edu in data.get("educations", []):
            db.add(Education(**{k: v for k, v in edu.items() if k in Education.__table__.columns.keys() and k != 'id'}, candidate_id=c.id))
        for work in data.get("workExperiences", []):
            db.add(WorkExperience(**{k: v for k, v in work.items() if k in WorkExperience.__table__.columns.keys() and k != 'id'}, candidate_id=c.id))
        for skill in data.get("skillExperiences", []):
            db.add(SkillExperience(**{k: v for k, v in skill.items() if k in SkillExperience.__table__.columns.keys() and k != 'id'}, candidate_id=c.id))
        for jpe in data.get("japanExperiences", []):
            db.add(JapanExperience(**{k: v for k, v in jpe.items() if k in JapanExperience.__table__.columns.keys() and k != 'id'}, candidate_id=c.id))
        for fam in data.get("familyMembers", []):
            db.add(FamilyMember(**{k: v for k, v in fam.items() if k in FamilyMember.__table__.columns.keys() and k != 'id'}, candidate_id=c.id))

        db.commit()
        db.refresh(c)
        return jsonify(_build_full_profile(c))
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        db.close()

@candidates_bp.route("/candidates/<int:cid>", methods=["DELETE"])
def delete_candidate(cid):
    db = get_session()
    try:
        c = db.query(Candidate).filter(Candidate.id == cid).first()
        if not c:
            return jsonify({"error": "Not found"}), 404
        db.delete(c)
        db.commit()
        return jsonify({"ok": True})
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        db.close()
