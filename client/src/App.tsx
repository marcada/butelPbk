import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SimulationLayout } from './components/SimulationLayout';
import { PremiumBlog } from './pages/PremiumBlog';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminAds } from './pages/admin/AdminAds';
import { AdminBusinesses } from './pages/admin/AdminBusinesses';
import { AdminPosts } from './pages/admin/AdminPosts';
import { AdminEvents } from './pages/admin/AdminEvents';
import { InvestorSimulator } from './pages/admin/InvestorSimulator';
import './index.css';

import { Advertise } from './pages/Advertise';
import { BusinessDirectory } from './pages/BusinessDirectory';
import { BusinessLogin } from './pages/business/BusinessLogin';
import { BusinessDashboard } from './pages/business/BusinessDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PremiumBlog />} />
        <Route path="/street-preview" element={<SimulationLayout />} />
        <Route path="/advertise" element={<Advertise />} />

        <Route path="/directory" element={<BusinessDirectory />} />

        {/* Business Portal */}
        <Route path="/business/login" element={<BusinessLogin />} />
        <Route path="/business/:id/dashboard" element={<BusinessDashboard />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="businesses" element={<AdminBusinesses />} />
          <Route path="ads" element={<AdminAds />} />
          <Route path="posts" element={<AdminPosts />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="simulator" element={<InvestorSimulator />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
