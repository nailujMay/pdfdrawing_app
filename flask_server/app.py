import datetime
import io
from openai import OpenAI
from dotenv import load_dotenv
import os 
import numpy as np
import io
import pandas as pd

load_dotenv()

from flask import Flask,jsonify, request, g, send_from_directory
from flask_cors import CORS
import assistant
from firebase import bucket, db
import logging
import cleanup

client = OpenAI(api_key=os.getenv("TMG_OpenAI_API"))

app = Flask(__name__, static_folder= "build")
CORS(app)

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    if path != "" and os.path.exists(app.static_folder + "/" + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")

# def df_to_excel_bytes(df):
#     excel_bytes = io.BytesIO()
#     with pd.ExcelWriter(excel_bytes, engine='openpyxl') as writer:
#         df.to_excel(writer, index=False)
#     excel_bytes.seek(0)
#     return excel_bytes

def dfs_to_excel_bytes(df_list, sheet_names):
    excel_bytes = io.BytesIO()
    with pd.ExcelWriter(excel_bytes, engine='openpyxl') as writer:
        for df, sheet_name in zip(df_list, sheet_names):
            df.to_excel(writer, sheet_name=sheet_name, index=False)
    excel_bytes.seek(0)
    return excel_bytes

@app.route('/reset', methods=['POST'])
def update_data():
    try:
        # Reset Firebase Realtime Database
        reset_data = {
        'curr_file_names': [],
        'percent_done': 0
            }
        reset_ref = db.collection("progress").document('upload_task')
        reset_ref.set(reset_data,merge = True)

        return jsonify({'message': 'Data updated successfully'}), 200

    except Exception as e:
        return jsonify({'message': 'Error updating data', 'error': str(e)}), 500

@app.route("/progress", methods=['GET'])
def getProgress():
    progress_data = []
    try:
        progress = db.collection('progress')
        docs = progress.get()

        for doc in docs:
            progress_data.append(doc.to_dict())

        print(progress_data)
        return jsonify({'data': progress_data}), 200

    except Exception as e:
        return jsonify({'message': 'Error fetching data', 'error': str(e)}), 500


@app.route('/api', methods=['POST'])
def upload_urls():
    # need foldername 
    pdf_ByteURLs = []
    pdf_names = []
    data = request.json  # Get JSON data from POST request
    urls = data.get('urls', [])
    pdfs_processed = 0
    progress_data = {
        'curr_file_names': [],
        'percent_done': 0
    }
    progress_ref = db.collection("progress").document('upload_task')
    

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
        try:
            progress_data['curr_file_names'] = urls[i:i+2]
            progress_data['percent_done'] = round( pdfs_processed/ len(pdf_ByteURLs) * 75)
            print(progress_data['percent_done'])
            print(progress_data['curr_file_names'])
            progress_ref.set(progress_data,merge = True)
        except Exception as e:
            logging.error(f"Error processing URL {url}: {e}")
    
    # Clean dataframe
    cleaned_df = cleanup.clean_df(df)
    summary_df = cleanup.materialSum(cleaned_df)

    # with pd.ExcelWriter('data.xlsx') as writer:
    #     # Write each DataFrame to a separate sheet
    #     cleaned_df.to_excel(writer, sheet_name='BOM', index=False)
    #     summary_df.to_excel(writer, sheet_name='Summary', index=False)

    # Example: Logging URLs to console
    print (cleaned_df)
    print(summary_df)
    print('Received URLs:', urls)
    # create excel file from dataframe 
    excel_bytes = dfs_to_excel_bytes([cleaned_df, summary_df], ['BOM', 'Summary'])
    # df.to_excel('Caneng_test2.xlsx', index=False)
    blob = bucket.blob('data.xlsx')  # Specify filename in Firebase Storage
    blob.upload_from_file(excel_bytes, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    url = blob.generate_signed_url(expiration=datetime.timedelta(hours=1))
    print(url)
 
    # Example: Sending response back to client
    response = {'message': 'Here is the excel download url','url': url}
    return jsonify(response), 200

if __name__ == "__main__":
    app.run(debug = True)



