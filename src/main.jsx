import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ParkProvider } from './context/ParkContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ParkProvider>
      <App />
    </ParkProvider>
  </React.StrictMode>,
)
