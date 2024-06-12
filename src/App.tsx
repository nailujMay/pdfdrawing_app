import React from "react";
import { useState, useEffect } from "react";
import axios, { AxiosResponse } from "axios";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Dashboard";
import Upload from "./components/Upload";
interface Data {
  data: string[];
}

function App() {
  const [data, setData] = useState<string[] | null>();

  useEffect(() => {
    axios
      .get<Data>("http://127.0.0.1:5000/data")
      .then((response: AxiosResponse<Data>) => {
        setData(response.data.data); // Accessing the 'data' array from the response
        console.log(response.data.data);
      })
      .catch((error: any) => {
        console.error("Error fetching data:", error);
      });
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/process" element={<Upload />} />
      </Routes>
    </Router>
  );
}

export default App;
