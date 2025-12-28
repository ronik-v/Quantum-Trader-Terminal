import './App.css'
import { Navigate, Route, Routes } from "react-router-dom";
import {AuthPage, SecuritiesDataPage} from "./routers/AppRouters.ts";

function App() {
  return (
    <>
        <Routes>
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="/auth" element={<AuthPage/>} />
            <Route path="/data" element={<SecuritiesDataPage/>} />
        </Routes>
    </>
  )
}

export default App
