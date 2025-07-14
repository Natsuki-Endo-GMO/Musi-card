import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import UserPage from './pages/UserPage'
import CreateUser from './pages/CreateUser'
import ManageUsers from './pages/ManageUsers'
import EditUser from './pages/EditUser'
import SpotifyCallback from './pages/SpotifyCallback'
import StorageDebugPanel from './components/StorageDebugPanel'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/users/:username" element={<UserPage />} />
        <Route path="/create" element={<CreateUser />} />
        <Route path="/manage" element={<ManageUsers />} />
        <Route path="/edit/:username" element={<EditUser />} />
        <Route path="/callback" element={<SpotifyCallback />} />
      </Routes>
      <StorageDebugPanel />
    </>
  )
}

export default App 