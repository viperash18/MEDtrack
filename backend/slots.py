from datetime import date, datetime, timedelta
from db import query


def today_str():
    return date.today().isoformat()


def generate_slots(doctor):
    start = datetime.strptime(doctor["work_start"], "%H:%M")
    end = datetime.strptime(doctor["work_end"], "%H:%M")
    step = timedelta(minutes=doctor["slot_minutes"])
    slots, t = [], start
    while t < end:
        slots.append(t.strftime("%H:%M"))
        t += step
    return slots


def available_slots(doctor, appt_date):
    taken_rows = query(
        """SELECT appt_time FROM appointments
            WHERE doctor_id = ? AND appt_date = ? AND status != 'cancelled'""",
        (doctor["id"], appt_date),
    )
    taken = {r["appt_time"] for r in taken_rows}
    return [s for s in generate_slots(doctor) if s not in taken]
