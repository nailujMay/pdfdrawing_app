import { Link } from "react-router-dom";
import { useState, useRef, ChangeEvent, FormEvent, useEffect } from "react";
import { storage } from "../firebase/firebaseConfig";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid"; // Import the UUID library
import axios from "axios";
import ProgressBar from "./ProgressBar";
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
import { Flex, Text, Button, Progress } from "@radix-ui/themes";

interface UploadProgress {
  file: File;
  progress: number;
  url: string | null;
}

function Upload() {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [downloadURLs, setDownloadURLs] = useState<string[]>([]);
  const [excelURL, setExcelURL] = useState<string>("");
  const [stopProgress, setStopProgress] = useState<boolean>(false);
  const [currentFiles, setCurrentFiles] = useState<string[]>([]);
  const [progressBar, setProgressBar] = useState<boolean>(false);
  const [currFileNames, setCurrFileNames] = useState<string[]>([]);

  console.log(stopProgress);
  console.log(progress);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.post("http://127.0.0.1:5000/reset", {
          // Add any other data to update in Firebase Realtime Database
        });
        console.log(response.data); // Assuming your backend returns a success message
      } catch (error) {
        console.error("Error updating data:", error);
      }
    };
    // Call fetchData function when component mounts
    fetchData();
  }, []);

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
    // setStopProgress(false);
    setProgress(25);
    setProgressBar(true);

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

      console.log(progress);
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
        const progressAPI = await axios.get("http://127.0.0.1:5000/progress");
        setProgress(25 + Number(progressAPI.data.data[0].percent_done));
        setCurrFileNames(progressAPI.data.data[0].curr_file_names);
        console.log(progress);

        if (progressAPI.data.data[0].percent_done === 75) {
          setStopProgress(true);
          setProgress(0);
          setProgressBar(false);
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
    <Theme>
      <div className=" m-32 w-3/4 h-3/4 justify-center items-center mx-auto ">
        <h1 className="flex justify-center my-8 text-4xl ">
          Engineering Drawing Parser
        </h1>

        <div className="relative flex flex-col justify-center border-2 rounded-lg">
          <div className="my-6 flex flex-col items-center">
            <h2 className=" text-xl my-2">Upload Files</h2>
            <div>
              {files.length > 0 ? (
                renderFileNamesAndTypes()
              ) : (
                <p className="flex justify-center my-6 ">
                  No files uploaded yet
                </p>
              )}
            </div>
          </div>

          <input
            type="file"
            multiple
            id="file"
            onChange={handleFileChange}
            className="absolute w-full h-full cursor-pointer opacity-0 "
          />
        </div>
        <div className="flex justify-center my-2">
          <Button size="3" variant="soft" onClick={handleUpload}>
            Process
          </Button>
        </div>
        {stopProgress && (
          <a href={excelURL} download>
            <button className="m-4 border-2 px-4 py-1">Download Excel</button>
          </a>
        )}
        {progressBar ? (
          <ProgressBar progress={progress} fileNames={currFileNames} />
        ) : null}
      </div>
    </Theme>
  );
}

export default Upload;
