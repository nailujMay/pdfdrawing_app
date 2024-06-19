from openai import OpenAI
from dotenv import load_dotenv
import os 
import re
import numpy as np
import io
import pandas as pd
import traceback
import time
load_dotenv()

from flask import Flask,jsonify, request
from flask_cors import CORS
import requests
import assistant
from firebase import bucket
import logging

client = OpenAI(api_key=os.getenv("TMG_OpenAI_API"))

app = Flask(__name__)
CORS(app)

@app.route("/data")
def home():
    data = {"data":["draw1","draw2","draw3"]}
    return jsonify(data)


@app.route('/api', methods=['POST'])
def upload_urls():
    # need foldername 
    pdf_ByteURLs = []
    data = request.json  # Get JSON data from POST request
    urls = data.get('urls', [])


    # grab data from firebase via urls and download each drawing as bytes
    for url in urls:
        try:
            blob = bucket.blob(url)
            file_bytes = blob.download_as_bytes()
            pdf_ByteURLs.append(file_bytes)
        except Exception as e:
            logging.error(f"Error processing URL {url}: {e}")
            return jsonify({'message': f"Error processing URL {url}", 'error': str(e)}), 500


        # append to pdfByteArray
    
    # Create assistant
    
    # for every two files in pdfByteArray

        # Create opeai thread
        # create a file group (2drawings) from the byte array
        # df = processPDFs()

    # create excel file from dataframe 
    # store excel file in folder 

    # return success

    # Example: Logging URLs to console
    print('Received URLs:', urls)
    print("Converted to bytes", pdf_ByteURLs)

    # Example: Sending response back to client
    response = {'message': 'Received and processed URLs successfully','uploaded_urls': urls}
    return jsonify(response), 200
if __name__ == "__main__":
    app.run(debug = True)



