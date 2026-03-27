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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-6 md:p-12 font-sans selection:bg-indigo-100">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 italic uppercase">Back<span className="text-indigo-600">Office</span></h1>
            <p className="text-slate-400 text-xs font-bold tracking-[0.2em] mt-1 italic">PREMIUM MANAGEMENT SYSTEM</p>
          </div>
          <Link to="/" className="px-6 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">← Halaman Depan</Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          {/* Section: Registrasi PIN */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600"></div>
            <h2 className="text-xl font-black mb-6 text-slate-900 tracking-tighter uppercase italic">Daftarkan Karyawan</h2>
            <form onSubmit={addKaryawan} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Nama Lengkap</label>
                <input name="nama" placeholder="Budi Santoso" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none transition-all" required />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">PIN Keamanan (4 Digit)</label>
                <input name="pin" placeholder="0000" maxLength={4} className="w-full bg-white border border-slate-100 p-4 rounded-2xl text-sm font-mono tracking-widest focus:ring-2 focus:ring-indigo-100 outline-none transition-all" required />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Shift Kerja</label>
                <select name="shift" className="w-full bg-white border border-slate-100 p-4 rounded-2xl text-sm text-slate-600 outline-none">
                  <option value="Siang">Shift Siang</option>
                  <option value="Malam">Shift Malam</option>
                </select>
              </div>
              <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 mt-4">Simpan Data Baru</button>
            </form>
          </div>

          {/* Section: Analitik Performa Buruk */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 lg:col-span-2 relative overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">Peringatan Disiplin</h2>
               <span className="bg-rose-50 text-rose-500 text-[9px] font-black px-3 py-1 rounded-full border border-rose-100 tracking-widest uppercase">Perhatian Khusus</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {karyawan.map(k => {
                const lateCount = logs.filter(l => l.karyawan_id === k.id && l.status === 'Terlambat').length;
                const earlyCount = logs.filter(l => l.karyawan_id === k.id && l.status === 'Pulang Cepat').length;
                if (lateCount === 0 && earlyCount === 0) return null;
                return (
                  <div key={k.id} className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] flex justify-between items-center group hover:bg-white hover:shadow-xl transition-all duration-300">
                    <div>
                      <p className="font-black text-slate-900 text-sm uppercase italic tracking-tight">{k.nama}</p>
                      <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-1">{k.shift} Mode</p>
                    </div>
                    <div className="text-right">
                      <div className="text-rose-500 text-[10px] font-black flex items-center justify-end gap-1">
                        <span>{lateCount}</span> <span className="text-[8px] opacity-40 uppercase">Late</span>
                      </div>
                      <div className="text-amber-500 text-[10px] font-black flex items-center justify-end gap-1 mt-1">
                        <span>{earlyCount}</span> <span className="text-[8px] opacity-40 uppercase">Early</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section: Log Riwayat Real-time */}
        <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.4)]"></div>
               <h3 className="font-black text-xs uppercase tracking-[0.3em] text-slate-500 italic">Live Attendance Feed</h3>
            </div>
            <button onClick={fetchData} className="text-[9px] font-black uppercase text-indigo-600 hover:text-indigo-800 transition-all tracking-[0.2em]">Refresh Feed</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 uppercase text-[9px] tracking-[0.3em] font-black">
                <tr>
                  <th className="p-8">Karyawan</th>
                  <th className="p-8">Waktu & Tipe</th>
                  <th className="p-8 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium italic">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-all group">
                    <td className="p-8 text-slate-900 font-black uppercase text-xs tracking-tight">{log.nama}</td>
                    <td className="p-8">
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-indigo-600 font-black text-lg tracking-tighter">{log.jam}</span>
                        <span className="text-[8px] px-2 py-1 bg-slate-100 rounded-md font-black tracking-widest text-slate-500 uppercase">{log.tipe}</span>
                      </div>
                    </td>
                    <td className="p-8 text-center">
                      <span className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] inline-block ${
                        log.status === 'On Time' 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                        : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}>{log.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
      `}</style>
    </div>
  );
}
