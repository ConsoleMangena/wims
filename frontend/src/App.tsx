import './App.css'
import { Routes, Route } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import Home from './pages/Home'
import Species from './pages/Species'
import Sightings from './pages/Sightings'
import Reserves from './pages/Reserves'
import Hunters from './pages/Hunters'
import Licences from './pages/Licences'
import Poaching from './pages/Poaching'
import Quotas from './pages/Quotas'

export default function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<Home />} />
        <Route path="species" element={<Species />} />
        <Route path="sightings" element={<Sightings />} />
        <Route path="reserves" element={<Reserves />} />
        <Route path="hunters" element={<Hunters />} />
        <Route path="licences" element={<Licences />} />
        <Route path="poaching" element={<Poaching />} />
        <Route path="quotas" element={<Quotas />} />
      </Route>
    </Routes>
  )
}
