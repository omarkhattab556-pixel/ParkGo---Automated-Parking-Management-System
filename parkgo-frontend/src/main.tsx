import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode> // עוזר למצוא בעיות בקוד של React בזמן הפיתוח
);

//   מתחיל  INDEX HTML
// עובר ל MAIN TSX
//APP .TSX  זה זרימת הרכיבים של React