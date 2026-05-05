import './App.css';
import { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Header from './components/header/Header';
import Home from './pages/home/Home';
import MyReminders from './pages/my-reminders/MyReminders';
import EmotionMonitor from './pages/emotion-monitor/EmotionDashboard';
import SleepDashboard from './pages/sleep-monitor/SleepDashboard.jsx';
import VoiceButton from './components/VoiceButton/VoiceButton';
import { init, handleIntent, setNavigate } from './components/VoiceButton/VoiceController.js';
import CaregiverDashboard from './pages/caregiver/CaregiverDashboard.jsx';
import SleepMonitor from './pages/sleep-monitor/SleepMonitor.jsx';
import AISleepAssistant from './pages/sleep-monitor/AISleepAssistant.jsx';
import AdminDashboard from "./pages/AdminDashboard";
import CaretakerDashboard from "./pages/CaretakerDashboard";

function App() {

  

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/caregiver/*" element={<CaregiverDashboard />} />
        <Route path="*" element={(<LayoutWithHeader/>)}/>
        <Route path="/caretaker/:caretakerId" element={<CaretakerDashboard />} />
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
        <Route path="/fall-detection" element={<AdminDashboard />} />
        <Route path="/sleep-monitor" element={<SleepDashboard />} />
        <Route path="/monitor" element={<SleepMonitor/>} />
        <Route path="/ai-assistant" element={<AISleepAssistant />} />
      </Routes>
      <VoiceButton init={init} onIntent={handleIntent}/>
    </>
  );
}

export default App;
