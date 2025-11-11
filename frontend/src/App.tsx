import './App.css'
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthPage } from "./routers/AppRouters.ts";

function App() {
  return (
    <>
        <Routes>
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="/auth" element={<AuthPage/>} />
        </Routes>
    </>
  )
}

export default App
