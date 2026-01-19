import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Welcome from './pages/Welcome' // <--- New Import
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import AdminPanel from './pages/AdminPanel'
import Exam from './pages/Exam'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />     {/* Home is now Welcome Page */}
        <Route path="/login" element={<Login />} />   {/* Login moved here */}
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/exam/:category" element={<Exam />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App