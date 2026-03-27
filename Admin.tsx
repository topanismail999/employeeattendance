import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Link } from 'react-router-dom';

export default function Admin() {
  const [karyawan, setKaryawan] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: dKaryawan } = await supabase.from('karyawan').select('*');
    const { data: dLogs } = await supabase.from('logs_absensi').select('*').order('created_at', { ascending: false });
    const { data: dSett } = await supabase.from('settings').select('*').single();
    
    setKaryawan(dKaryawan || []);
    setLogs(dLogs || []);
    setSettings(dSett || {});
  };

  const addKaryawan = async (e: any) => {
    e.preventDefault();
    const nama = e.target.nama.value;
    const pin = e.target.pin.value;
    const shift = e.target.shift.value;
    await supabase.from('karyawan').insert([{ nama, pin, shift }]);
    e.target.reset();
    fetchData();
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-black tracking-tight text-white">ADMIN <span className="text-indigo-500">CONTROL</span></h1>
          <Link to="/" className="text-xs font-bold text-slate-500 hover:text-white transition-all uppercase tracking-widest">← Kembali ke Absen</Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pendaftaran PIN */}
          <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-xl">
            <h2 className="text-xl font-bold mb-6 text-indigo-400">Registrasi Karyawan</h2>
            <form onSubmit={addKaryawan} className="space-y-4">
              <input name="nama" placeholder="Nama Lengkap" className="w-full bg-slate-900 border border-white/10 p-4 rounded-2xl" required />
              <input name="pin" placeholder="PIN (4 Digit)" maxLength={4} className="w-full bg-slate-900 border border-white/10 p-4 rounded-2xl" required />
              <select name="shift" className="w-full bg-slate-900 border border-white/10 p-4 rounded-2xl">
                <option value="Siang">Shift Siang</option>
                <option value="Malam">Shift Malam</option>
              </select>
              <button className="w-full bg-indigo-600 py-4 rounded-2xl font-bold hover:bg-indigo-500 transition-all">SIMPAN DATA</button>
            </form>
          </div>

          {/* Analitik Performa Buruk */}
          <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 lg:col-span-2">
            <h2 className="text-xl font-bold mb-6 text-red-400 uppercase tracking-widest text-sm">Peringatan: Absen Terburuk</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {karyawan.map(k => {
                const lateCount = logs.filter(l => l.karyawan_id === k.id && l.status === 'Terlambat').length;
                const earlyCount = logs.filter(l => l.karyawan_id === k.id && l.status === 'Pulang Cepat').length;
                if (lateCount === 0 && earlyCount === 0) return null;
                return (
                  <div key={k.id} className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white text-sm">{k.nama}</p>
                      <p className="text-[10px] text-slate-500">{k.shift} Shift</p>
                    </div>
                    <div className="text-right">
                      <p className="text-red-400 text-xs font-black">{lateCount} Terlambat</p>
                      <p className="text-orange-400 text-xs font-black">{earlyCount} Pulang Cepat</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tabel Log Real-time */}
        <div className="bg-white/5 rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-white/5 bg-white/5">
            <h3 className="font-bold">Log Absensi Terbaru</h3>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/50 text-slate-500 uppercase text-[10px] tracking-widest">
              <tr>
                <th className="p-6">Karyawan</th>
                <th className="p-6">Waktu & Tipe</th>
                <th className="p-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-white/5 transition-all">
                  <td className="p-6 font-bold">{log.nama}</td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-400 font-mono">{log.jam}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-800 rounded uppercase">{log.tipe}</span>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm ${
                      log.status === 'On Time' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                    }`}>{log.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
