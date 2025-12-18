import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SimulationLayout } from './components/SimulationLayout';
import { PremiumBlog } from './pages/PremiumBlog';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminAds } from './pages/admin/AdminAds';
import { AdminPosts } from './pages/admin/AdminPosts';
import { AdminEvents } from './pages/admin/AdminEvents';
import { InvestorSimulator } from './pages/admin/InvestorSimulator';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PremiumBlog />} />
        <Route path="/street-preview" element={<SimulationLayout />} />



        // ... other imports ...

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="categories" element={<AdminCategories />} />
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
