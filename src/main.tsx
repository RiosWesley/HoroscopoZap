
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/mercadopago.css'

createRoot(document.getElementById("root")!).render(<App />);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js');
  });
}
