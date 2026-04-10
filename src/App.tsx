import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { Loading } from './components/UI';

// Lazy loading de páginas
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const CategoriasPage = lazy(() => import('./pages/CategoriasPage').then(m => ({ default: m.CategoriasPage })));
const MotivosPage = lazy(() => import('./pages/MotivosPage').then(m => ({ default: m.MotivosPage })));
const TransaccionesPage = lazy(() => import('./pages/TransaccionesPage').then(m => ({ default: m.TransaccionesPage })));
const ConfiguracionPage = lazy(() => import('./pages/ConfiguracionPage').then(m => ({ default: m.ConfiguracionPage })));
const ReportesPage = lazy(() => import('./pages/ReportesPage').then(m => ({ default: m.ReportesPage })));

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Layout>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/categorias" element={<CategoriasPage />} />
              <Route path="/motivos" element={<MotivosPage />} />
              <Route path="/transacciones" element={<TransaccionesPage />} />
              <Route path="/reportes" element={<ReportesPage />} />
              <Route path="/configuracion" element={<ConfiguracionPage />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
