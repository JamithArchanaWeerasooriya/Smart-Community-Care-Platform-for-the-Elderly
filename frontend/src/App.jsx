import './App.css';
import { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Header from './components/header/Header';
import Home from './pages/home/Home';
import MyReminders from './pages/my-reminders/MyReminders';
import VoiceButton from './components/VoiceButton/VoiceButton';
import { init, handleIntent, setNavigate } from './components/VoiceButton/VoiceController.js';

function App() {

  

  return (
    <BrowserRouter>
      <Routes>
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
      </Routes>
      <VoiceButton init={init} onIntent={handleIntent}/>
    </>
  );
}

export default App;
