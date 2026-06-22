from flask import Blueprint, request, jsonify
from db import query, execute
from auth import hash_password, verify_password, make_token, current_user, login_required

bp = Blueprint("api_auth", __name__, url_prefix="/api/auth")


def row_to_dict(row):
    return dict(row) if row else None


@bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    if not (name and email and len(password) >= 6):
        return jsonify({"error": "Name, email, and 6+ char password required."}), 400
    if query("SELECT 1 FROM users WHERE email = ?", (email,), one=True):
        return jsonify({"error": "Email already registered."}), 409

    # Self-registration is always patient role
    from booking import find_or_create_patient
    patient_id = find_or_create_patient(name, data.get("phone", ""), data.get("age"), data.get("gender", ""))
    uid = execute(
        "INSERT INTO users (name, email, password_hash, role, patient_id) VALUES (?, ?, ?, 'patient', ?)",
        (name, email, hash_password(password), patient_id),
    )
    user = query("SELECT * FROM users WHERE id = ?", (uid,), one=True)
    return jsonify({"token": make_token(user), "user": {
        "id": user["id"], "name": user["name"], "role": user["role"]
    }}), 201


@bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    user = query("SELECT * FROM users WHERE email = ?", (email,), one=True)
    if not user or not verify_password(password, user["password_hash"]):
        return jsonify({"error": "Invalid email or password."}), 401
    return jsonify({"token": make_token(user), "user": {
        "id": user["id"], "name": user["name"], "role": user["role"],
        "patient_id": user["patient_id"], "doctor_id": user["doctor_id"]
    }})


@bp.route("/me")
@login_required
def me():
    u = current_user()
    return jsonify({
        "id": u["id"], "name": u["name"], "role": u["role"],
        "patient_id": u["patient_id"], "doctor_id": u["doctor_id"]
    })
