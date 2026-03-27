import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Admin from './Admin';

// Memberitahu TypeScript bahwa Swal ada di index.html
declare var Swal: any;

const AttendanceForm = () => {
  const [pin, setPin] = useState('');
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('settings').select('*').single();
      setSettings(data);
    };
    fetchSettings();
  }, []);

  const handleAbsen = async (tipe: 'MASUK' | 'PULANG') => {
    if (pin.length < 4) return Swal.fire('Oops', 'Masukkan PIN valid', 'error');
    setLoading(true);

    const { data: karyawan, error } = await supabase
      .from('karyawan')
      .select('*')
      .eq('pin', pin)
      .single();

    if (error || !karyawan) {
      setLoading(false);
      return Swal.fire('Error', 'PIN tidak terdaftar!', 'error');
    }

    const jamSekarang = new Date().toLocaleTimeString('it-IT', { hour12: false }).slice(0, 5);
    let statusLog = 'On Time';
    let pesanAlert = 'Absen Berhasil! Selamat bekerja.';

    if (tipe === 'MASUK' && jamSekarang > (settings?.jam_masuk_siang || '08:00')) {
      statusLog = 'Terlambat';
      pesanAlert = 'Kamu terlambat, tapi jangan patah semangat! Hari ini harus lebih produktif ya! 🔥';
    } else if (tipe === 'PULANG' && jamSekarang < (settings?.jam_pulang_siang || '17:00')) {
      statusLog = 'Pulang Cepat';
      pesanAlert = 'Waduh, belum jamnya pulang nih. Tetap semangat sebentar lagi!';
    }

    const { error: errInsert } = await supabase.from('logs_absensi').insert([{
      karyawan_id: karyawan.id,
      nama: karyawan.nama,
      tipe,
      jam: jamSekarang,
      status: statusLog,
      foto_url: 'https://via.placeholder.com/150'
    }]);

    if (!errInsert) {
      Swal.fire({
        title: 'BERHASIL!',
        text: pesanAlert,
        icon: statusLog === 'Terlambat' ? 'warning' : 'success',
        confirmButtonColor: '#6366f1'
      });
      setPin('');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] p-6">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-10 shadow-2xl text-center">
        <h1 className="text-3xl font-black mb-8 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 font-sans">PRESENSI KARYAWAN</h1>
        
        <div className="w-full h-40 bg-slate-900 rounded-3xl mb-8 border-2 border-dashed border-slate-700 flex items-center justify-center text-slate-500 text-xs italic">
          [ Area Preview Foto Kamera ]
        </div>

        <input 
          type="password" 
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="PIN" 
          className="w-full bg-slate-950 border border-white/10 text-center text-3xl tracking-[1rem] py-5 rounded-3xl mb-8 focus:ring-4 focus:ring-indigo-500/50 outline-none"
        />

        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => handleAbsen('MASUK')} disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 py-5 rounded-3xl font-bold transition-all active:scale-95 shadow-lg shadow-indigo-500/20">MASUK</button>
          <button onClick={() => handleAbsen('PULANG')} disabled={loading} className="bg-slate-800 hover:bg-slate-700 py-5 rounded-3xl font-bold transition-all active:scale-95">PULANG</button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AttendanceForm />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}
