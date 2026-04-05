import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { CategoriasPage } from './pages/CategoriasPage';
import { MotivosPage } from './pages/MotivosPage';
import { TransaccionesPage } from './pages/TransaccionesPage';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/categorias" element={<CategoriasPage />} />
          <Route path="/motivos" element={<MotivosPage />} />
          <Route path="/transacciones" element={<TransaccionesPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
