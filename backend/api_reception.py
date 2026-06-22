from flask import Blueprint, request, jsonify, current_app
from db import query, execute
from auth import role_required
from slots import available_slots, today_str
from booking import find_or_create_patient, create_appointment

bp = Blueprint("api_reception", __name__, url_prefix="/api/reception")


def appt_dict(a):
    return {
        "id": a["id"], "appt_time": a["appt_time"], "appt_date": a["appt_date"],
        "reason": a["reason"], "status": a["status"],
        "patient_name": a["patient_name"], "phone": a["phone"],
        "doctor_name": a["doctor_name"], "specialization": a["specialization"],
    }


@bp.route("/schedule")
@role_required("reception", "admin")
def schedule():
    day = request.args.get("day") or today_str()
    rows = query(
        """SELECT a.*, p.name AS patient_name, p.phone,
                  d.name AS doctor_name, d.specialization
             FROM appointments a
             JOIN patients p ON p.id = a.patient_id
             JOIN doctors  d ON d.id = a.doctor_id
            WHERE a.appt_date = ? AND a.status != 'cancelled'
            ORDER BY a.appt_time""",
        (day,),
    )
    return jsonify({"appointments": [appt_dict(a) for a in rows]})


@bp.route("/doctors")
@role_required("reception", "admin")
def doctors():
    rows = query("SELECT id, name, specialization, room, work_start, work_end, slot_minutes FROM doctors WHERE active = 1 ORDER BY name")
    return jsonify({"doctors": [dict(r) for r in rows]})


@bp.route("/slots")
@role_required("reception", "admin")
def slots():
    doctor_id = request.args.get("doctor_id")
    appt_date = request.args.get("appt_date") or today_str()
    doctor = query("SELECT * FROM doctors WHERE id = ?", (doctor_id,), one=True) if doctor_id else None
    free = available_slots(doctor, appt_date) if doctor else []
    return jsonify({"slots": free})


@bp.route("/book", methods=["POST"])
@role_required("reception", "admin")
def book():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    phone = (data.get("phone") or "").strip()
    age = data.get("age") or None
    gender = data.get("gender", "")
    doctor_id = data.get("doctor_id")
    appt_date = data.get("appt_date")
    appt_time = data.get("appt_time")
    reason = (data.get("reason") or "").strip()

    if not (name and phone and doctor_id and appt_date and appt_time):
        return jsonify({"error": "Name, phone, doctor, date and time required."}), 400

    patient_id = find_or_create_patient(name, phone, age, gender)
    ok, msg = create_appointment(patient_id, doctor_id, appt_date, appt_time, reason, "reception")
    if ok:
        current_app.extensions["socketio"].emit("appointment_update", {"type": "new"})
        return jsonify({"message": msg}), 201
    return jsonify({"error": msg}), 409


@bp.route("/checkin/<int:appt_id>", methods=["POST"])
@role_required("reception", "admin")
def checkin(appt_id):
    execute("UPDATE appointments SET status = 'checked-in' WHERE id = ? AND status = 'booked'", (appt_id,))
    current_app.extensions["socketio"].emit("appointment_update", {"type": "checkin", "id": appt_id})
    return jsonify({"status": "checked-in"})


@bp.route("/cancel/<int:appt_id>", methods=["POST"])
@role_required("reception", "admin")
def cancel(appt_id):
    execute("UPDATE appointments SET status = 'cancelled' WHERE id = ? AND status NOT IN ('completed')", (appt_id,))
    current_app.extensions["socketio"].emit("appointment_update", {"type": "cancelled", "id": appt_id})
    return jsonify({"status": "cancelled"})
