import os
from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO

from db import close_db

socketio = SocketIO(cors_allowed_origins="*")


def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    app.config["DATABASE"] = os.environ.get("DATABASE", "hospital.db")

    CORS(app, resources={r"/api/*": {"origins": "*"}})
    socketio.init_app(app)

    app.teardown_appcontext(close_db)

    # make socketio available in routes via app
    app.extensions["socketio"] = socketio

    import api_auth, api_patient, api_doctor, api_reception, api_admin
    app.register_blueprint(api_auth.bp)
    app.register_blueprint(api_patient.bp)
    app.register_blueprint(api_doctor.bp)
    app.register_blueprint(api_reception.bp)
    app.register_blueprint(api_admin.bp)

    return app


app = create_app()

if __name__ == "__main__":
    socketio.run(app, debug=True, port=int(os.environ.get("PORT", 5000)))
