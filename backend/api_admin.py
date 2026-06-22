from flask import Blueprint, request, jsonify
from db import query, execute
from auth import role_required, hash_password
from slots import today_str

bp = Blueprint("api_admin", __name__, url_prefix="/api/admin")


@bp.route("/stats")
@role_required("admin")
def stats():
    today = today_str()
    appts_today = query("SELECT COUNT(*) AS n FROM appointments WHERE appt_date = ? AND status != 'cancelled'", (today,), one=True)["n"]
    completed_today = query("SELECT COUNT(*) AS n FROM appointments WHERE appt_date = ? AND status = 'completed'", (today,), one=True)["n"]
    active_doctors = query("SELECT COUNT(*) AS n FROM doctors WHERE active = 1", one=True)["n"]
    total_patients = query("SELECT COUNT(*) AS n FROM patients", one=True)["n"]
    by_doctor = query(
        """SELECT d.name, d.specialization,
                  COUNT(a.id) AS booked,
                  SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) AS completed
             FROM doctors d
             LEFT JOIN appointments a ON a.doctor_id = d.id AND a.appt_date = ? AND a.status != 'cancelled'
            WHERE d.active = 1
            GROUP BY d.id ORDER BY booked DESC, d.name""",
        (today,),
    )
    return jsonify({
        "appts_today": appts_today, "completed_today": completed_today,
        "active_doctors": active_doctors, "total_patients": total_patients,
        "by_doctor": [dict(r) for r in by_doctor],
    })


@bp.route("/doctors", methods=["GET", "POST"])
@role_required("admin")
def doctors():
    if request.method == "POST":
        data = request.get_json() or {}
        name = (data.get("name") or "").strip()
        spec = (data.get("specialization") or "").strip()
        room = (data.get("room") or "").strip()
        work_start = data.get("work_start", "09:00")
        work_end = data.get("work_end", "17:00")
        slot_minutes = int(data.get("slot_minutes", 30))
        if not (name and spec):
            return jsonify({"error": "Name and specialization required."}), 400
        execute(
            "INSERT INTO doctors (name, specialization, room, work_start, work_end, slot_minutes) VALUES (?, ?, ?, ?, ?, ?)",
            (name, spec, room, work_start, work_end, slot_minutes),
        )
        return jsonify({"message": f"Added {name}."}), 201
    rows = query("SELECT * FROM doctors ORDER BY active DESC, name")
    return jsonify({"doctors": [dict(r) for r in rows]})


@bp.route("/doctors/<int:doctor_id>/toggle", methods=["POST"])
@role_required("admin")
def toggle_doctor(doctor_id):
    doc = query("SELECT * FROM doctors WHERE id = ?", (doctor_id,), one=True)
    if not doc:
        return jsonify({"error": "Not found"}), 404
    execute("UPDATE doctors SET active = ? WHERE id = ?", (0 if doc["active"] else 1, doctor_id))
    return jsonify({"active": not doc["active"]})


@bp.route("/staff", methods=["GET", "POST"])
@role_required("admin")
def staff():
    if request.method == "POST":
        data = request.get_json() or {}
        name = (data.get("name") or "").strip()
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""
        role = data.get("role") or ""
        doctor_id = data.get("doctor_id") or None
        if role not in ("admin", "reception", "doctor"):
            return jsonify({"error": "Invalid role."}), 400
        if not (name and email) or len(password) < 6:
            return jsonify({"error": "Name, email, and 6+ char password required."}), 400
        if query("SELECT 1 FROM users WHERE email = ?", (email,), one=True):
            return jsonify({"error": "Email already in use."}), 409
        if role == "doctor" and not doctor_id:
            return jsonify({"error": "Doctor account must be linked to a doctor profile."}), 400
        execute(
            "INSERT INTO users (name, email, password_hash, role, doctor_id) VALUES (?, ?, ?, ?, ?)",
            (name, email, hash_password(password), role, doctor_id if role == "doctor" else None),
        )
        return jsonify({"message": f"Created {role} account for {name}."}), 201

    users = query(
        """SELECT u.id, u.name, u.email, u.role, u.created_at, d.name AS doctor_name
             FROM users u LEFT JOIN doctors d ON d.id = u.doctor_id
            WHERE u.role != 'patient' ORDER BY u.role, u.name"""
    )
    free_doctors = query(
        "SELECT * FROM doctors WHERE id NOT IN (SELECT doctor_id FROM users WHERE doctor_id IS NOT NULL) ORDER BY name"
    )
    return jsonify({"users": [dict(u) for u in users], "free_doctors": [dict(d) for d in free_doctors]})
