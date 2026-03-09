import './App.css';
import { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Header from './components/header/Header';
import Home from './pages/home/Home';
import MyReminders from './pages/my-reminders/MyReminders';
import EmotionMonitor from './pages/emotion-monitor/EmotionDashboard';
import SleepMonitor from './pages/sleep-monitor/SleepMonitor';
import FallDetection from './pages/fall-detection/FallDetection.jsx';
import VoiceButton from './components/VoiceButton/VoiceButton';
import { init, handleIntent, setNavigate } from './components/VoiceButton/VoiceController.js';
import CaregiverDashboard from './pages/caregiver/CaregiverDashboard.jsx';

function App() {

  

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/caregiver/*" element={<CaregiverDashboard />} />
        <Route path="*" element={(<LayoutWithHeader/>)}/>
      </Routes>
    </BrowserRouter>
  );
}

function LayoutWithHeader() {

  const navigate = useNavigate();
  setNavigate(navigate);

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/my-reminders" element={<MyReminders />} />
        <Route path="/emotion-monitor" element={<EmotionMonitor />} />
        <Route path="/sleep-monitor" element={<SleepMonitor />} />
        <Route path="/fall-detection" element={<FallDetection />} />
      </Routes>
      <VoiceButton init={init} onIntent={handleIntent}/>
    </>
  );
}

export default App;
