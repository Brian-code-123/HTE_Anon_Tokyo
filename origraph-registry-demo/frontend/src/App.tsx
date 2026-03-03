import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './layout/AppShell'
import { AnchorPage } from './pages/AnchorPage'
import { ChainPage } from './pages/ChainPage'
import { CompaniesPage } from './pages/CompaniesPage'
import { CompanyFlowPage } from './pages/CompanyFlowPage'
import { DashboardPage } from './pages/DashboardPage'
import { DemoOverviewPage } from './pages/DemoOverviewPage'
import { ExtensionPanelPage } from './pages/ExtensionPanelPage'
import { GuidedDemoPage } from './pages/GuidedDemoPage'
import { LandingPage } from './pages/LandingPage'
import { UserFlowPage } from './pages/UserFlowPage'
import { VerifyPage } from './pages/VerifyPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/registry" element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="demo" element={<DemoOverviewPage />} />
        <Route path="demo/live" element={<GuidedDemoPage />} />
        <Route path="demo/company" element={<CompanyFlowPage />} />
        <Route path="demo/user" element={<UserFlowPage />} />
        <Route path="companies" element={<CompaniesPage />} />
        <Route path="anchor" element={<AnchorPage />} />
        <Route path="verify" element={<VerifyPage />} />
        <Route path="chain" element={<ChainPage />} />
        <Route path="extension" element={<ExtensionPanelPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
