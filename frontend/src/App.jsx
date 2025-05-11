import React from 'react';
import {Route, Routes} from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Features from './components/Features';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Contact from './components/Contact';
import Docs from './components/Docs';
import Contributors from './components/Contributors';
import Privacy from './components/Privacy';
export default function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/features" element={<Features />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/contributors" element={<Contributors />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="*" element={<Home />} />  
      </Routes>
    </div>
  );
}
