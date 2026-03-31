import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPageAggregator } from '@/features/consultoria/components/LandingPageAggregator';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/consultoria" element={<LandingPageAggregator />} />
        {/* Novas landings serão adicionadas aqui */}
        <Route path="*" element={<Navigate to="/consultoria" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
