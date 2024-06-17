from flask import Flask,jsonify, request
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

@app.route("/data")
def home():
    data = {"data":["draw1","draw2","draw3"]}
    return jsonify(data)

@app.route("/upload", methods=['POST'])
def upload():
    data = requests.get_json()
    download_urls = data.get('downloadURLs', [])

    for file_url in download_urls:
        # Fetch the file from Firebase Storage
        response = requests.get(file_url)
        if response.status_code == 200:
            file_content = response.content
            # Process the file_content as needed
            print(f"File processed successfully: {file_url}")
        else:
            print(f"Failed to fetch file: {file_url}")

    return jsonify({"message": "Files processed successfully"}), 200

@app.route('/api', methods=['POST'])
def upload_urls():
    data = request.json  # Get JSON data from POST request
    urls = data.get('urls', [])

    # Process or store the URLs as needed
    # Example: Logging URLs to console
    print('Received URLs:', urls)

    # Example: Sending response back to client
    response = {'message': 'Received and processed URLs successfully','uploaded_urls': urls}
    return jsonify(response), 200
if __name__ == "__main__":
    app.run(debug = True)



