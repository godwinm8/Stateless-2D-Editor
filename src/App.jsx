import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import CanvasPage from "./pages/CanvasPage";
import React from "react";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/canvas/:id" element={<CanvasPage />} />
      </Routes>
    </Router>
  );
}
