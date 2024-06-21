import { Link } from "react-router-dom";
import { useState, useRef, ChangeEvent, FormEvent, useEffect } from "react";
import { storage } from "../firebase/firebaseConfig";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid"; // Import the UUID library
import axios from "axios";

import { ChakraProvider } from "@chakra-ui/react";
import { Button, ButtonGroup, Input, Box, Progress } from "@chakra-ui/react";

interface UploadProgress {
  file: File;
  progress: number;
  url: string | null;
}

function Upload() {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<string>("");
  const [downloadURLs, setDownloadURLs] = useState<string[]>([]);
  const [excelURL, setExcelURL] = useState<string>("");
  const [stopProgress, setStopProgress] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleDownload = () => {
    if (excelURL) {
      const link = document.createElement("a");
      link.href = excelURL;
      // link.download = "data.xlsx"; // Optional: specify the filename
      link.click();
    }
  };

  const renderFileNamesAndTypes = () => {
    return files.map((file, index) => (
      <div key={index}>
        <p>{file.name}</p>
      </div>
    ));
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

        urls.push(path);
      }
      // Log all download URLs once
      console.log("All firebase paths: ", urls);
      setDownloadURLs(urls); // Optionally update state for UI
    } catch (error) {
      console.error("Error uploading files:", error);
    }

    const requestBody = {
      urls: urls,
    };

    // Send POST request using Axios
    axios
      .post("http://127.0.0.1:5000/api", requestBody, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        setExcelURL(response.data.url);
        console.log(excelURL);
      })
      .catch((error) => {
        console.error("Error sending POST request:", error);
        // Handle error sending request or receiving response
      });
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    console.log("useEffect in effect");
    console.log(progress);

    const fetchProgress = async () => {
      try {
        const progress = await axios.get("http://127.0.0.1:5000/progress");
        setProgress(progress.data.progress);
        console.log(progress.data.progress);

        if (progress.data.progress === 100) {
          setStopProgress(true);
          clearInterval(interval);
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchProgress();

    if (!stopProgress) {
      interval = setInterval(fetchProgress, 2000);
    }

    // Clean up interval to avoid memory leaks
    return () => clearInterval(interval);
  }, [stopProgress]);

  return (
    <ChakraProvider>
      <div className="m-32">
        <h1 className="flex justify-center my-8 text-4xl ">
          Engineering Drawing Parser
        </h1>

        <div className="flex flex-col justify-center items-center border-2 w-3/4 h-3/4 mx-auto p-10 rounded-lg">
          <div className="my-4">
            <h2>Uploaded Files:</h2>
            {files.length > 0 ? (
              renderFileNamesAndTypes()
            ) : (
              <p>No files uploaded yet.</p>
            )}
          </div>
          <input
            type="file"
            multiple
            id="file"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer "
          />
          <Button className="" onClick={handleUpload}>
            Process
          </Button>
        </div>
        {progress ? (
          <Progress value={Number(progress)} className="my-4" />
        ) : null}

        <div className="flex justify-center">
          {stopProgress && (
            <a href={excelURL} download>
              <button className="m-4 border-2 px-4 py-1">Download Excel</button>
            </a>
          )}
        </div>
      </div>
    </ChakraProvider>
  );
}

export default Upload;
