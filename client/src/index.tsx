import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";

const container = document.getElementById("root");
if (!container) {
  throw new Error("no #root element to mount into");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
