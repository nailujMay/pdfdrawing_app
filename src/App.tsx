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

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Upload />} />
      </Routes>
    </Router>
  );
}

export default App;
