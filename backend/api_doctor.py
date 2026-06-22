from flask import Blueprint, request, jsonify, current_app
from db import query, execute
from auth import role_required, current_user
from slots import today_str

bp = Blueprint("api_doctor", __name__, url_prefix="/api/doctor")

NEXT_STATUS = {
    "booked": "checked-in",
    "checked-in": "in-progress",
    "in-progress": "completed",
}


def appt_dict(a):
    return {
        "id": a["id"], "appt_time": a["appt_time"], "appt_date": a["appt_date"],
        "reason": a["reason"], "status": a["status"], "note": a["note"],
        "patient_name": a["patient_name"], "age": a["age"],
        "gender": a["gender"], "phone": a["phone"],
    }


@bp.route("/queue")
@role_required("doctor")
def queue():
    user = current_user()
    day = request.args.get("date") or today_str()
    rows = query(
        """SELECT a.*, p.name AS patient_name, p.age, p.gender, p.phone
             FROM appointments a JOIN patients p ON p.id = a.patient_id
            WHERE a.doctor_id = ? AND a.appt_date = ? AND a.status != 'cancelled'
            ORDER BY a.appt_time""",
        (user["doctor_id"], day),
    )
    return jsonify({"appointments": [appt_dict(a) for a in rows]})


@bp.route("/advance/<int:appt_id>", methods=["POST"])
@role_required("doctor")
def advance(appt_id):
    user = current_user()
    appt = query("SELECT * FROM appointments WHERE id = ? AND doctor_id = ?", (appt_id, user["doctor_id"]), one=True)
    if not appt:
        return jsonify({"error": "Not found"}), 404
    nxt = NEXT_STATUS.get(appt["status"])
    if not nxt:
        return jsonify({"error": "Cannot advance from this status"}), 400
    data = request.get_json() or {}
    note = (data.get("note") or "").strip()
    if nxt == "completed" and note:
        execute("UPDATE appointments SET status = ?, note = ? WHERE id = ?", (nxt, note, appt_id))
    else:
        execute("UPDATE appointments SET status = ? WHERE id = ?", (nxt, appt_id))
    current_app.extensions["socketio"].emit("appointment_update", {"type": "status", "id": appt_id, "status": nxt})
    return jsonify({"status": nxt})


@bp.route("/cancel/<int:appt_id>", methods=["POST"])
@role_required("doctor")
def cancel(appt_id):
    user = current_user()
    appt = query("SELECT * FROM appointments WHERE id = ? AND doctor_id = ?", (appt_id, user["doctor_id"]), one=True)
    if not appt:
        return jsonify({"error": "Not found"}), 404
    execute("UPDATE appointments SET status = 'cancelled' WHERE id = ? AND status != 'completed'", (appt_id,))
    current_app.extensions["socketio"].emit("appointment_update", {"type": "cancelled", "id": appt_id})
    return jsonify({"status": "cancelled"})
