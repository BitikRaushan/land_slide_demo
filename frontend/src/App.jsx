import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { DashboardLayout } from '@/layouts/DashboardLayout'

import Dashboard from '@/pages/Dashboard'
import RiskMap from '@/pages/RiskMap'
import RoutePlanner from '@/pages/RoutePlanner'
import NodeMonitoring from '@/pages/NodeMonitoring'
import Analytics from '@/pages/Analytics'
import Alerts from '@/pages/Alerts'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/map" element={<RiskMap />} />
          <Route path="/route" element={<RoutePlanner />} />
          <Route path="/nodes" element={<NodeMonitoring />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/alerts" element={<Alerts />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
