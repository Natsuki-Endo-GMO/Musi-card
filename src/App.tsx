import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import AdminLogin from './pages/AdminLogin'
import Dashboard from './pages/Dashboard'
import UserPage from './pages/UserPage'
import CreateUser from './pages/CreateUser'
import ManageUsers from './pages/ManageUsers'
import EditUser from './pages/EditUser'
import SpotifyCallback from './pages/SpotifyCallback'
import Migration from './pages/Migration'
import StorageDebugPanel from './components/StorageDebugPanel'
import DataSourceIndicator from './components/DataSourceIndicator'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users/:username" element={<UserPage />} />
        <Route path="/create" element={<CreateUser />} />
        <Route path="/admin" element={<ManageUsers />} />
        <Route path="/edit/:username" element={<EditUser />} />
        <Route path="/callback" element={<SpotifyCallback />} />
        <Route path="/migration" element={<Migration />} />
      </Routes>
      <StorageDebugPanel />
      <DataSourceIndicator />
    </>
  )
}

export default App 