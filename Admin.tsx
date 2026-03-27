import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { Link } from 'react-router-dom';

const Admin: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      // Ganti 'profiles' dengan nama tabel yang ada di Supabase kamu
      const { data: result, error: fetchError } = await supabase
        .from('profiles') 
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setData(result || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Data Management</h2>
          <p className="text-slate-400">Monitoring database real-time</p>
        </div>
        <div className="flex gap-3">
          <Link to="/" className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors">← Kembali</Link>
          <button onClick={fetchData} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-sm font-medium shadow-lg transition-all">
            Refresh Data
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-xl text-red-200 text-center">
            Gagal mengambil data: {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-slate-900/50 rounded-3xl border border-slate-800">
                <p className="text-slate-500 italic">Belum ada data tersedia di tabel ini.</p>
              </div>
            ) : (
              data.map((item, index) => (
                <div key={index} className="group bg-slate-900/40 backdrop-blur-md border border-slate-800 p-6 rounded-2xl hover:border-indigo-500/50 transition-all duration-300 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded">ID: {index + 1}</span>
                    <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                  </div>
                  <div className="space-y-2 overflow-hidden">
                     {/* Menampilkan isi objek secara dinamis */}
                    <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap">
                      {JSON.stringify(item, null, 2)}
                    </pre>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
