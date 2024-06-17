import { Link } from "react-router-dom";
import { useState, useRef, ChangeEvent, FormEvent } from "react";
import { storage } from "../firebase/firebaseConfig";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid"; // Import the UUID library
import axios from "axios";

interface UploadProgress {
  file: File;
  progress: number;
  url: string | null;
}

function Upload() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [downloadURLs, setDownloadURLs] = useState<string[]>([]);
  const [data, setData] = useState<string>("");
  const [response, setResponse] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    const urls: string[] = [];

    try {
      for (const file of files) {
        const storageRef = ref(storage, `test3/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        // Await the upload task completion
        await uploadTask;

        // Get download URL and collect in array
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        urls.push(downloadURL);
      }

      // Log all download URLs once
      console.log("All download URLs:", urls);

      setDownloadURLs(urls); // Optionally update state for UI

      const requestBody = {
        urls: urls,
      };

      // Send POST request using Axios
      axios
        .post("http://127.0.0.1:5000/api", requestBody, {
          headers: {
            "Content-Type": "application/json",
            // Add any other headers as needed
          },
        })
        .then((response) => {
          console.log("POST request successful:", response.data);
          // Handle success response from server if needed
        })
        .catch((error) => {
          console.error("Error sending POST request:", error);
          // Handle error sending request or receiving response
        });
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setData(e.target.value);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      // Make POST request
      const res = await axios.post<{ response: string }>(
        "http://127.0.0.1:5000/api",
        { data }
      );
      setResponse(res.data.response);
    } catch (error) {
      console.error("Error making POST request", error);
    }
  };

  // Create a file object with progress, filename, and url properties
  // Create an array to store all these objects

  // User uploads files to input field; array to store all these files, create a file object for each file

  // Create folder for file package
  // For each file in file_array upload to firebase storage.

  return (
    <>
      <div>
        <input type="file" multiple onChange={handleFileChange} />
        <button onClick={handleUpload}>Upload</button>
        {uploadProgress.map((progress, index) => (
          <div key={index}>
            <div>{progress.file.name}</div>
            <div>Progress: {progress.progress}%</div>
            {progress.url && (
              <a href={progress.url} target="_blank" rel="noopener noreferrer">
                Download File
              </a>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export default Upload;
