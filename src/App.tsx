import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Loading } from './components/UI';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { RegisterSuccessPage } from './pages/RegisterSuccessPage';

// Lazy loading de páginas
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const CategoriasPage = lazy(() => import('./pages/CategoriasPage').then(m => ({ default: m.CategoriasPage })));
const MotivosPage = lazy(() => import('./pages/MotivosPage').then(m => ({ default: m.MotivosPage })));
const TransaccionesPage = lazy(() => import('./pages/TransaccionesPage').then(m => ({ default: m.TransaccionesPage })));
const ConfiguracionPage = lazy(() => import('./pages/ConfiguracionPage').then(m => ({ default: m.ConfiguracionPage })));
const ReportesPage = lazy(() => import('./pages/ReportesPage').then(m => ({ default: m.ReportesPage })));
const UsersPage = lazy(() => import('./pages/UsersPage').then(m => ({ default: m.UsersPage })));
const CasasPage = lazy(() => import('./pages/CasasPage').then(m => ({ default: m.CasasPage })));
const PerfisPage = lazy(() => import('./pages/PerfisPage').then(m => ({ default: m.PerfisPage })));
const NumeroWhatsAppPage = lazy(() => import('./pages/NumeroWhatsAppPage').then(m => ({ default: m.NumeroWhatsAppPage })));

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <Loading />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// Redirect to /casas for admin, / for regular users
function RootRedirect() {
  const { user } = useAuth();
  if (user?.rol === 'ADMIN') {
    return <Navigate to="/casas" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

function AppContent() {
  const { selectedCasaId } = useAuth();
  
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register-success" element={<RegisterSuccessPage />} />
        
        {/* Protected routes - key forces remount when casa changes */}
        <Route path="*" element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={<Loading />}>
                <Routes key={selectedCasaId || 'default'}>
                  <Route path="/" element={<RootRedirect />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/categorias" element={<CategoriasPage />} />
                  <Route path="/motivos" element={<MotivosPage />} />
                  <Route path="/transacciones" element={<TransaccionesPage />} />
                  <Route path="/reportes" element={<ReportesPage />} />
                  <Route path="/configuracion" element={<ConfiguracionPage />} />
                  <Route path="/usuarios" element={<UsersPage />} />
                  <Route path="/casas" element={<CasasPage />} />
                  <Route path="/perfis" element={<PerfisPage />} />
                  <Route path="/numero" element={<NumeroWhatsAppPage />} />
                </Routes>
              </Suspense>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
