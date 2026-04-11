import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
const VITE_PINATA_JWT_API = import.meta.env.VITE_PINATA_JWT;
if (!VITE_PINATA_JWT_API || VITE_PINATA_JWT_API === "your_pinata_jwt_here") {
  console.warn(
    "CONFIGURATION ERROR: VITE_PINATA_JWT is missing or using placeholder value.",
    "color: yellow; background: black; font-weight: bold; font-size: 14px;"
  );
  console.warn("Check your .env file and restart the development server.");
}
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
