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
        const path: string = `testing/${file.name}`;
        const storageRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file);

        // Await the upload task completion
        await uploadTask;

        // Get download URL and collect in array
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        urls.push(path);
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
