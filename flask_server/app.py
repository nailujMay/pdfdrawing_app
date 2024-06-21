import datetime
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
progress = 0

def df_to_excel_bytes(df):
    excel_bytes = io.BytesIO()
    with pd.ExcelWriter(excel_bytes, engine='openpyxl') as writer:
        df.to_excel(writer, index=False)
    excel_bytes.seek(0)
    return excel_bytes

@app.route("/progress", methods=['GET'])
def getProgress():
    global progress
    print("Almost finished  ", progress)
    return jsonify({"progress": progress})


@app.route('/api', methods=['POST'])
def upload_urls():
    # need foldername 
    pdf_ByteURLs = []
    pdf_names = []
    data = request.json  # Get JSON data from POST request
    urls = data.get('urls', [])
    global progress
    progress = 0 
    pdfs_processed = 0


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
    
        pdfs_processed = pdfs_processed + len(pdf_files_group)
        # update progress for status 
        progress =round( pdfs_processed/ len(pdf_ByteURLs) * 100)

    # Example: Logging URLs to console
    print (df)
    print('Received URLs:', urls)
    # create excel file from dataframe 
    excel_bytes = df_to_excel_bytes(df)
    df.to_excel('Caneng_test2.xlsx', index=False)
    blob = bucket.blob('data.xlsx')  # Specify filename in Firebase Storage
    blob.upload_from_file(excel_bytes, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    url = blob.generate_signed_url(expiration=datetime.timedelta(hours=1))
    print(url)
    # progress = 0
    


    # store excel file in folder 

    # return success
 

    # Example: Sending response back to client
    response = {'message': 'Here is the excel download url','url': url}
    return jsonify(response), 200
if __name__ == "__main__":
    app.run(debug = True)



