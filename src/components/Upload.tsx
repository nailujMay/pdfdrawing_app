import { Link } from "react-router-dom";
import { useState, useRef, ChangeEvent, FormEvent, useEffect } from "react";
import { storage } from "../firebase/firebaseConfig";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid"; // Import the UUID library
import axios from "axios";
import ProgressBar from "./ProgressBar";
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
import { Flex, Text, Button, Progress, Heading } from "@radix-ui/themes";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { isDisabled } from "@testing-library/user-event/dist/utils";

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
  const [start, setStart] = useState<boolean>(false);

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

  console.log(stopProgress);
  console.log(progress);

  const handleReload = () => {
    fetchData();
    window.location.reload();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const renderFileNamesAndTypes = () => {
    return files.map((file, index) => (
      <div key={index}>
        <p>{file.name}</p>
      </div>
    ));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert("No drawings uploaded");
    } else {
      const urls: string[] = [];
      setProgress(25);
      setProgressBar(true);
      setStart(true);

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
    }
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
      interval = setInterval(fetchProgress, 3000);
    }

    // Clean up interval to avoid memory leaks
    return () => clearInterval(interval);
  }, [stopProgress]);

  return (
    <Theme>
      <div className=" my-24 w-5/6 justify-center items-center mx-auto  ">
        <div className="flex flex-col items-center text-center">
          <Heading size="9" className="flex justify-center my-2 ">
            Engineering Drawing Parser
          </Heading>
          <Heading weight="medium" className="my-1">
            Upload a drawing package to summarize the bill of materials{" "}
          </Heading>
        </div>
        <div className="relative flex flex-col justify-center border-2 rounded-lg w-[75vw] h-[50vh] mx-auto my-4">
          {!stopProgress ? (
            <div className="my-6 flex flex-col items-center">
              <Heading weight="medium" size="5" className="my-2">
                Upload Files
              </Heading>
              <div>
                {files.length > 0 ? (
                  renderFileNamesAndTypes()
                ) : (
                  <Heading
                    weight="regular"
                    size="3"
                    className="flex justify-center my-2 "
                  >
                    No files uploaded yet
                  </Heading>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col m-4 justify-center items-center">
              <Heading size="3" className="my-2">
                Processing Finished
              </Heading>
              <div className="flex ">
                <a href={excelURL} download className="mx-2">
                  <Button className="mx-2">Download Excel</Button>
                </a>
                <Button variant="soft" className="mx-2" onClick={handleReload}>
                  Upload another package
                </Button>
              </div>
            </div>
          )}

          {progressBar ? (
            <div className="mx-8 my-4">
              <ProgressBar progress={progress} fileNames={currFileNames} />
            </div>
          ) : null}
          {!stopProgress && (
            <input
              type="file"
              multiple
              id="file"
              onChange={handleFileChange}
              placeholder="Upload files"
              className="absolute w-full h-full cursor-pointer opacity-0"
              disabled={stopProgress}
            />
          )}
        </div>
        {!start ? (
          <div className="flex justify-center items-center m-2">
            <Button size="3" variant="solid" onClick={handleUpload}>
              Process
            </Button>
          </div>
        ) : null}
      </div>
    </Theme>
  );
}

export default Upload;
