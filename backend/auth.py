from functools import wraps
from flask import request, jsonify, g
from werkzeug.security import generate_password_hash, check_password_hash
import jwt as pyjwt
import os
from db import query

SECRET = os.environ.get("SECRET_KEY", "dev-secret-change-me")


def hash_password(raw):
    return generate_password_hash(raw)


def verify_password(raw, hashed):
    return check_password_hash(hashed, raw)


def make_token(user_row):
    return pyjwt.encode(
        {"user_id": user_row["id"], "role": user_row["role"], "name": user_row["name"]},
        SECRET, algorithm="HS256"
    )


def decode_token(token):
    return pyjwt.decode(token, SECRET, algorithms=["HS256"])


def current_user():
    if "user" not in g:#so this g.user check is done for a small time interval like when we call a function instead of asking again and agin aabout the user details we save it into the g.user fopr a small span of time 
        #for example if you go to the restraunt and order so the waiter(g object) stores your name and bartender the cashier the cheif keeps your name and uses it instead of coming to your place again and again to ask your user name or other details onec the food is delivered the http request is over.
        g.user = None
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            try:
                payload = decode_token(auth[7:])
                g.user = query("SELECT * FROM users WHERE id = ?", (payload["user_id"],), one=True)
            except Exception:
                pass
    return g.user


def login_required(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        if current_user() is None:
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return wrapped


def role_required(*roles):
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            user = current_user()
            if user is None:
                return jsonify({"error": "Unauthorized"}), 401
            if user["role"] not in roles:
                return jsonify({"error": "Forbidden"}), 403
            return f(*args, **kwargs)
        return wrapped
    return decorator
