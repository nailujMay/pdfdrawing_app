import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
import { Flex, Text, Button, Progress } from "@radix-ui/themes";
import { useState, useEffect } from "react";

interface ProgressBarProps {
  progress: number;
  fileUpload: boolean;
  fileNames: string[];
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, fileNames }) => {
  const [progressText, setProgressText] = useState<string>("");

  useEffect(() => {
    if (progress < 25) {
      setProgressText("Uploading files.....");
    } else if (progress < 100) {
      setProgressText(
        `Processing ${fileNames
          .map((fileNames) => `${fileNames}`)
          .join(" ")}.....`
      );
    }
  }, [progress, fileNames]);

  return (
    <div>
      <h1>{progressText}</h1>
      <Progress value={progress} />
    </div>
  );
};

// export default ProgressBar;
