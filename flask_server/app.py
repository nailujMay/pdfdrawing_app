from datetime import timedelta
import io
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
    pdf_names = []
    data = request.json  # Get JSON data from POST request
    urls = data.get('urls', [])


    # grab data from firebase via urls and download each drawing as bytes
    for url in urls:
        try:
            blob = bucket.blob(url)
            file_bytes = blob.download_as_bytes()
            file_obj = io.BytesIO(file_bytes)
            file_obj.name = blob.name
            print(file_obj.name)
            pdf_ByteURLs.append(file_obj)
            pdf_names.append(file_obj)

     
        except Exception as e:
            logging.error(f"Error processing URL {url}: {e}")
            return jsonify({'message': f"Error processing URL {url}", 'error': str(e)}), 500

    # Create assistant
    assistantID = assistant.createAssistant()
    # Create Dataframe
    df = pd.DataFrame()
    
    # for every two files process drawings
    for i in range(0, len(pdf_ByteURLs),2):
        # Create assistant thread
        thread = client.beta.threads.create()
        # Make an array of the two drawings
        pdf_files_group = pdf_ByteURLs[i:i+2]
        # Append to the exisiting df with the new data
        df = assistant.process_pdfs(pdf_names, pdf_files_group, assistantID, df,thread.id)
        # print(df)

    # create excel file from dataframe 
    # store excel file in folder 

    # return success

    # Example: Logging URLs to console
    print('Received URLs:', urls)
    # print("Converted to bytes", pdf_ByteURLs)
    print('Firebase PDF URLs', pdf_ByteURLs)

    # Example: Sending response back to client
    response = {'message': 'Received and processed URLs successfully','uploaded_urls': urls}
    return jsonify(response), 200
if __name__ == "__main__":
    app.run(debug = True)



