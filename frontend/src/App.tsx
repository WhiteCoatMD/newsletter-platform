import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import PostEditor from './pages/PostEditor';
import Analytics from './pages/Analytics';
import Subscribers from './pages/Subscribers';
import Templates from './pages/Templates';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';

import './styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="posts/new" element={<PostEditor />} />
              <Route path="posts/edit/:id" element={<PostEditor />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="subscribers" element={<Subscribers />} />
              <Route path="templates" element={<Templates />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;