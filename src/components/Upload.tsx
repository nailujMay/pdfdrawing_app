import { Link } from "react-router-dom";
import { useState } from "react";
import { storage } from "../firebase/firebaseConfig";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid"; // Import the UUID library

function Upload() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [progress, setProgress] = useState<number[]>([]);
  const [downloadURLs, setDownloadURLs] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList) {
      setFiles(fileList);
      setProgress(Array.from({ length: fileList.length }, () => 0));
      setDownloadURLs(Array.from({ length: fileList.length }, () => ""));
      console.log(files);
    }
  };

  const handleUpload = async () => {
    const folderName = uuidv4();

    if (!files) return;

    const uploadPromises = Array.from(files).map((file, index) => {
      return new Promise<void>((resolve, reject) => {
        const storageRef = ref(storage, `${folderName}/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress((prevProgress) => {
              const newProgress = [...prevProgress];
              newProgress[index] = progress;
              return newProgress;
            });
          },
          (error) => {
            console.error("Upload failed", error);
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setDownloadURLs((prevURLs) => {
              const newURLs = [...prevURLs];
              newURLs[index] = downloadURL;
              return newURLs;
            });
            console.log("File available at", downloadURL);
            resolve();
          }
        );
      });
    });

    Promise.all(uploadPromises)
      .then(() => {
        console.log("All files uploaded successfully");
      })
      .catch((error) => {
        console.error("Some files failed to upload:", error);
      });
  };

  return (
    <>
      <div>
        <Link to="/">
          <button>Dashboard</button>
        </Link>
        <h1>This is the upload page</h1>
        <input
          type="file"
          accept="applicatoin/pdf"
          multiple
          onChange={handleFileChange}
        ></input>
        <button onClick={handleUpload}>upload</button>
      </div>
    </>
  );
}

export default Upload;
