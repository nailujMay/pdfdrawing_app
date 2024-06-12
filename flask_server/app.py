from flask import Flask,jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/data")
def home():
    data = {"data":["draw1","draw2","draw3"]}
    return jsonify(data)

if __name__ == "__main__":
    app.run(debug = True)