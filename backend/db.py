import sqlite3
from flask import g, current_app


def get_db():
    if "db" not in g: #if the g object is empty so create new g obect
        g.db = sqlite3.connect(current_app.config["DATABASE"])#this is actually connecting the g object with the database 
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")#SQlite by default disables foriegn keys s to turn it on
    return g.db


def close_db(exception=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    db = get_db()
    with current_app.open_resource("schema.sql") as f:
        db.executescript(f.read().decode("utf-8"))
    db.commit()


def query(sql, params=(), one=False):
    cur = get_db().execute(sql, params)
    rows = cur.fetchall()
    cur.close()
    return (rows[0] if rows else None) if one else rows


def execute(sql, params=()):
    db = get_db()
    cur = db.execute(sql, params)
    db.commit()
    last_id = cur.lastrowid
    cur.close()
    return last_id
