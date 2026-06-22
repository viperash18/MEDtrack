import sqlite3
from db import get_db, query, execute


def find_or_create_patient(name, phone, age=None, gender=""):
    existing = query("SELECT * FROM patients WHERE phone = ?", (phone,), one=True)
    if existing:
        return existing["id"]
    return execute(
        "INSERT INTO patients (name, phone, age, gender) VALUES (?, ?, ?, ?)",
        (name, phone, age, gender or ""),
    )


def create_appointment(patient_id, doctor_id, appt_date, appt_time, reason, created_by):
    db = get_db()
    try:
        db.execute(
            """INSERT INTO appointments
                   (patient_id, doctor_id, appt_date, appt_time, reason, created_by)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (patient_id, doctor_id, appt_date, appt_time, reason, created_by),
        )
        db.commit()
        return True, "Appointment booked."
    except sqlite3.IntegrityError:
        db.rollback()
        return False, "That slot was just taken. Please pick another time."
