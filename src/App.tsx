import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { CategoriasPage } from './pages/CategoriasPage';
import { MotivosPage } from './pages/MotivosPage';
import { TransaccionesPage } from './pages/TransaccionesPage';
import { ConfiguracionPage } from './pages/ConfiguracionPage';
import { ReportesPage } from './pages/ReportesPage';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/categorias" element={<CategoriasPage />} />
            <Route path="/motivos" element={<MotivosPage />} />
            <Route path="/transacciones" element={<TransaccionesPage />} />
            <Route path="/reportes" element={<ReportesPage />} />
            <Route path="/configuracion" element={<ConfiguracionPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
