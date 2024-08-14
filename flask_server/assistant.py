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

# client access the OpenAI api via the given API key.  
client = OpenAI(api_key=os.getenv("TMG_OpenAI_API"))

def process_pdfs(pdf_names,pdf_byteFiles,assistant_id,df,threadID):
  vector_store = client.beta.vector_stores.create(name="Engineering Drawings", expires_after={
  "anchor": "last_active_at",
  "days": 1
  })
  
  file_batch = client.beta.vector_stores.file_batches.upload_and_poll(
    vector_store_id=vector_store.id, files=pdf_byteFiles
  )

  assistant = client.beta.assistants.update(
  assistant_id=assistant_id,
  tool_resources={"file_search": {"vector_store_ids": [vector_store.id]}},
  )

  #create a new thread 
  # print (pdf_files)
  message = client.beta.threads.messages.create(
    thread_id = threadID,
    role = "user",
    content = f"""
        can you give me just a CSV response that lists out the bill of materials in each of the following files: {pdf_names}? Here is an example of the format. 
        [file_name, "description", "part_number", "weight", "material", quanitity]. Can you get rid of any commas in the description name and put N/A if not found. Do not skip any items. Not all files contain a bill of materials.  
        """,
  )
  
  #run the message
  run = client.beta.threads.runs.create_and_poll(
      thread_id=threadID, assistant_id=assistant_id, max_prompt_tokens= 36000, temperature= 1, top_p=1
  )
  
  print(run.last_error)
  print("")
  print(run.usage.total_tokens)

  messages = list(client.beta.threads.messages.list(thread_id=threadID, run_id=run.id))

  try:
    message_content = messages[0].content[0].text
    response = message_content.value
    # print(response)
  except Exception as e:
  # Print the error traceback
    print('error with chatgpt message')
    print(messages)
    traceback.print_exc()

  try:
    regex_pattern = r"```(?:csv|plaintext)?\s*(.*?)\s*```"
    # Use regex to extract JSON data
    match = re.search(regex_pattern, response, re.DOTALL)
    # match = re.findall(regex_pattern, response, re.DOTALL)
    # Check if a match is found
    if match:
      csv_response = match.group(1)  # Extract the JSON data from the match
      csv_data = io.StringIO(csv_response)
    else:
      print("No match found.")
    # annotations = message_content.annotations
  except Exception as e:
  # Print the error traceback
    print('error with csv extraction ')
    traceback.print_exc()

  try:
    expected_num_fields = 6
    valid_lines = []    
    for line in csv_data:
      # Split the line into fields
      fields = line.strip().split(',')
      
      # Check if the number of fields matches the expected number
      if len(fields) == expected_num_fields:
          valid_lines.append(fields)
      else:
          print(f"Skipping invalid line: {line.strip()}")
    new_df = pd.DataFrame(valid_lines, columns=[
      "File Name", "Description", "Part Number", "Weight", "Material", "Quantity"
    ])
    # print(new_df)
    df = pd.concat([df, new_df], ignore_index=True)
    print('extracted csv data')  # Print the extracted JSON data
  except Exception as e:
    # Print the error traceback
    print('error with dataframe')
    traceback.print_exc()

  # clean up the dataframe
  df = df.applymap(lambda x: x.replace('"', '') if isinstance(x, str) else x)

  deleted_vector_store = client.beta.vector_stores.delete(
  vector_store_id= vector_store.id
  )
  return df

def createAssistant():
  assistant = client.beta.assistants.create(
  name="Drawing Assistant",
  instructions="Can you analyze all these drawings and help me provide quoting information?",
  model="gpt-4o",
  tools=[{"type": "file_search"}],
  temperature=1,
  )
  return assistant.id