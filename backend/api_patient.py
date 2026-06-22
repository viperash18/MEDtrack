from flask import Blueprint, request, jsonify, current_app
from db import query
from auth import role_required, current_user
from slots import available_slots, today_str
from booking import create_appointment

bp = Blueprint("api_patient", __name__, url_prefix="/api/patient")


def appt_to_dict(a):
    return {
        "id": a["id"], "appt_date": a["appt_date"], "appt_time": a["appt_time"],
        "reason": a["reason"], "status": a["status"], "note": a["note"],
        "doctor_name": a["doctor_name"], "specialization": a["specialization"], "room": a["room"],
    }


@bp.route("/slots")
@role_required("patient", "reception", "admin")
def slots():
    doctor_id = request.args.get("doctor_id")
    appt_date = request.args.get("appt_date") or today_str()
    doctor = query("SELECT * FROM doctors WHERE id = ? AND active = 1", (doctor_id,), one=True) if doctor_id else None
    free = available_slots(doctor, appt_date) if doctor else []
    return jsonify({"slots": free})


@bp.route("/book", methods=["POST"])
@role_required("patient")
def book():
    user = current_user()
    data = request.get_json() or {}
    doctor_id = data.get("doctor_id")
    appt_date = data.get("appt_date")
    appt_time = data.get("appt_time")
    reason = (data.get("reason") or "").strip()

    if not (doctor_id and appt_date and appt_time):
        return jsonify({"error": "doctor_id, appt_date, appt_time required."}), 400

    doctor = query("SELECT * FROM doctors WHERE id = ? AND active = 1", (doctor_id,), one=True)
    if not doctor:
        return jsonify({"error": "Doctor not available."}), 404

    ok, msg = create_appointment(user["patient_id"], doctor_id, appt_date, appt_time, reason, "patient")
    if ok:
        sio = current_app.extensions["socketio"]
        sio.emit("appointment_update", {"type": "new"})
        return jsonify({"message": msg}), 201
    return jsonify({"error": msg}), 409


@bp.route("/appointments")
@role_required("patient")
def appointments():
    user = current_user()
    rows = query(
        """SELECT a.*, d.name AS doctor_name, d.specialization, d.room
             FROM appointments a JOIN doctors d ON d.id = a.doctor_id
            WHERE a.patient_id = ?
            ORDER BY (a.status IN ('completed','cancelled')) ASC, a.appt_date, a.appt_time""",
        (user["patient_id"],),
    )
    return jsonify({"appointments": [appt_to_dict(a) for a in rows]})


@bp.route("/doctors")
@role_required("patient")
def doctors():
    rows = query("SELECT id, name, specialization, room, work_start, work_end, slot_minutes FROM doctors WHERE active = 1 ORDER BY name")
    return jsonify({"doctors": [dict(r) for r in rows]})
