import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Admin from './Admin';

const Home = () => (
  <div className="relative isolate overflow-hidden bg-slate-900 min-h-screen flex items-center justify-center">
    <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.100),theme(colors.slate.900))] opacity-20"></div>
    <div className="text-center px-6">
      <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-7xl mb-6">
        Supabase <span className="text-indigo-400">Premium</span> System
      </h1>
      <p className="text-lg leading-8 text-slate-300 max-w-2xl mx-auto mb-10">
        Kelola data Anda dengan antarmuka modern, aman, dan performa tinggi yang terhubung langsung ke database cloud.
      </p>
      <div className="flex items-center justify-center gap-x-6">
        <Link to="/admin" className="rounded-full bg-indigo-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg hover:bg-indigo-400 transition-all transform hover:scale-105">
          Buka Dashboard Admin
        </Link>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}

export default App;
