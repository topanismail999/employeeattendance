import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Link } from 'react-router-dom';

export default function Admin() {
  const [karyawan, setKaryawan] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: dKaryawan } = await supabase.from('karyawan').select('*');
    const { data: dLogs } = await supabase.from('logs_absensi').select('*').order('created_at', { ascending: false });
    const { data: dSett } = await supabase.from('settings').select('*').single();
    
    setKaryawan(dKaryawan || []);
    setLogs(dLogs || []);
    setSettings(dSett || {});
    setLoading(false);
  };

  const addKaryawan = async (e: any) => {
    e.preventDefault();
    const { nama, pin, shift } = e.target.elements;
    await supabase.from('karyawan').insert([{ nama: nama.value, pin: pin.value, shift: shift.value }]);
    e.target.reset();
    fetchData();
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-6 md:p-12 font-sans selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white italic uppercase">Back<span className="text-indigo-500">Office</span></h1>
            <p className="text-slate-500 text-xs font-bold tracking-[0.2em] mt-1">SISTEM MONITORING KEHADIRAN V1.0</p>
          </div>
          <Link to="/" className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all shadow-xl">← Halaman Depan</Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          {/* Section: Registrasi PIN */}
          <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
            <h2 className="text-xl font-black mb-6 text-white tracking-tighter uppercase italic">Daftarkan Karyawan</h2>
            <form onSubmit={addKaryawan} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Nama Lengkap</label>
                <input name="nama" placeholder="Contoh: Budi Santoso" className="w-full bg-slate-900/50 border border-white/5 p-4 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" required />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">PIN Keamanan (4 Digit)</label>
                <input name="pin" placeholder="0000" maxLength={4} className="w-full bg-slate-950 border border-white/5 p-4 rounded-2xl text-sm font-mono tracking-widest focus:ring-2 focus:ring-indigo-500 outline-none transition-all" required />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Shift Kerja</label>
                <select name="shift" className="w-full bg-slate-900 border border-white/5 p-4 rounded-2xl text-sm text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none">
                  <option value="Siang">Shift Siang (Pagi - Sore)</option>
                  <option value="Malam">Shift Malam (Malam - Pagi)</option>
                </select>
              </div>
              <button className="w-full bg-indigo-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 mt-4">Simpan Data Baru</button>
            </form>
          </div>

          {/* Section: Analitik Performa Buruk */}
          <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 lg:col-span-2 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-xl font-black text-white tracking-tighter uppercase italic">Peringatan Disiplin</h2>
               <span className="bg-red-500/10 text-red-500 text-[9px] font-black px-3 py-1 rounded-full border border-red-500/20 tracking-widest uppercase">Perhatian Khusus</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {karyawan.map(k => {
                const lateCount = logs.filter(l => l.karyawan_id === k.id && l.status === 'Terlambat').length;
                const earlyCount = logs.filter(l => l.karyawan_id === k.id && l.status === 'Pulang Cepat').length;
                if (lateCount === 0 && earlyCount === 0) return null;
                return (
                  <div key={k.id} className="p-6 bg-red-500/5 border border-red-500/10 rounded-[2rem] flex justify-between items-center group hover:bg-red-500/10 transition-all duration-300">
                    <div>
                      <p className="font-black text-white text-sm uppercase italic tracking-tight">{k.nama}</p>
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mt-1">{k.shift} Mode</p>
                    </div>
                    <div className="text-right">
                      <div className="text-red-500 text-[10px] font-black flex items-center justify-end gap-1">
                        <span>{lateCount}</span> <span className="text-[8px] opacity-50">LATE</span>
                      </div>
                      <div className="text-orange-500 text-[10px] font-black flex items-center justify-end gap-1 mt-1">
                        <span>{earlyCount}</span> <span className="text-[8px] opacity-50">EARLY EXIT</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {karyawan.every(k => logs.filter(l => l.karyawan_id === k.id && (l.status === 'Terlambat' || l.status === 'Pulang Cepat')).length === 0) && (
                <div className="col-span-2 text-center py-10 opacity-30 text-xs italic tracking-widest uppercase">Semua karyawan disiplin hari ini</div>
              )}
            </div>
          </div>
        </div>

        {/* Section: Log Riwayat Real-time */}
        <div className="bg-white/5 backdrop-blur-xl rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/5 bg-white/2 flex justify-between items-center">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.8)]"></div>
               <h3 className="font-black text-sm uppercase tracking-[0.3em] text-slate-300">Live Attendance Feed</h3>
            </div>
            <button onClick={fetchData} className="text-[9px] font-black uppercase text-slate-500 hover:text-white transition-all tracking-[0.2em]">Refresh Feed</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/50 text-slate-500 uppercase text-[9px] tracking-[0.3em] font-black">
                <tr>
                  <th className="p-8">Identitas Karyawan</th>
                  <th className="p-8">Waktu & Tipe</th>
                  <th className="p-8 text-center">Status Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-white/5 transition-all group">
                    <td className="p-8">
                      <div className="flex flex-col">
                        <span className="font-black text-white uppercase group-hover:text-indigo-400 transition-colors tracking-tight">{log.nama}</span>
                        <span className="text-[9px] text-slate-500 font-mono tracking-tighter opacity-50">UID: {log.id.slice(0,8)}</span>
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="flex items-center gap-3">
                        <span className="text-indigo-400 font-mono font-black text-lg">{log.jam}</span>
                        <span className={`text-[8px] px-2 py-1 rounded-md font-black tracking-widest uppercase shadow-inner ${
                           log.tipe === 'MASUK' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-700/50 text-slate-400'
                        }`}>{log.tipe}</span>
                      </div>
                    </td>
                    <td className="p-8 text-center">
                      <span className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-
