import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';

// We will create these pages next
import Gateway from './components/Gateway';
import VisionMode from './components/Vision/VisionMode';
import HearingMode from './components/Hearing/HearingMode';
import SpeechMode from './components/Speech/SpeechMode';
import Dashboard from './components/Dashboard/Dashboard';

import { SettingsProvider } from './context/SettingsContext';

function App() {
  return (
    <SettingsProvider>
      <Router>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<Gateway />} />
            <Route path="/vision" element={<VisionMode />} />
            <Route path="/hearing" element={<HearingMode />} />
            <Route path="/speech" element={<SpeechMode />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </div>
      </Router>
    </SettingsProvider>
  );
}

export default App;
