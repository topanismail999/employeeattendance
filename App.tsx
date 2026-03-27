import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Swal from 'sweetalert2'; // Install: npm install sweetalert2

export default function App() {
  const [pin, setPin] = useState('');
  const [settings, setSettings] = useState<any>(null);

  // Ambil setting jam masuk/pulang dari database
  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('settings').select('*').single();
      setSettings(data);
    };
    fetchSettings();
  }, []);

  const handleAbsen = async (tipe: 'MASUK' | 'PULANG') => {
    if (pin.length < 4) return Swal.fire('Oops', 'Masukkan PIN valid', 'error');

    // 1. Cek PIN Karyawan
    const { data: karyawan, error } = await supabase
      .from('karyawan')
      .select('*')
      .eq('pin', pin)
      .single();

    if (error || !karyawan) return Swal.fire('Error', 'PIN tidak terdaftar!', 'error');

    const jamSekarang = new Date().toLocaleTimeString('it-IT', { hour12: false }).slice(0, 5);
    let statusLog = 'On Time';
    let pesanAlert = 'Absen Berhasil!';

    // 2. Logic Terlambat / Pulang Cepat
    if (tipe === 'MASUK' && jamSekarang > settings.jam_masuk) {
      statusLog = 'Terlambat';
      pesanAlert = 'Kamu terlambat, tapi jangan patah semangat! Hari ini harus lebih produktif ya! 🔥';
    } else if (tipe === 'PULANG' && jamSekarang < settings.jam_pulang) {
      statusLog = 'Pulang Cepat';
      pesanAlert = 'Waduh, belum jamnya pulang nih. Tetap semangat sebentar lagi!';
    }

    // 3. Simpan ke Database
    const { error: errInsert } = await supabase.from('logs_absensi').insert([{
      karyawan_id: karyawan.id,
      nama: karyawan.nama,
      tipe,
      jam: jamSekarang,
      status: statusLog,
      foto: 'https://via.placeholder.com/150' // Simulasi path foto
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
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-white font-sans p-6">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-10 shadow-2xl text-center">
        <h1 className="text-4xl font-black mb-2 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">PRESENSI PRO</h1>
        <p className="text-slate-400 text-sm mb-8 font-medium">Silakan masukkan PIN Anda</p>
        
        {/* Simulasi Kamera */}
        <div className="w-full h-48 bg-slate-900 rounded-3xl mb-6 border-2 border-dashed border-slate-700 flex items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-indigo-500/10 group-hover:bg-transparent transition-all"></div>
          <p className="text-xs text-slate-500 italic">Kamera Siap (Auto Capture)</p>
        </div>

        <input 
          type="password" 
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="••••" 
          className="w-full bg-slate-950 border border-white/10 text-center text-3xl tracking-[1rem] py-5 rounded-3xl mb-8 focus:ring-4 focus:ring-indigo-500/50 outline-none transition-all"
        />

        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => handleAbsen('MASUK')} className="bg-indigo-600 hover:bg-indigo-500 py-5 rounded-3xl font-bold shadow-xl shadow-indigo-500/20 active:scale-95 transition-all">ABSEN MASUK</button>
          <button onClick={() => handleAbsen('PULANG')} className="bg-slate-800 hover:bg-slate-700 py-5 rounded-3xl font-bold active:scale-95 transition-all">ABSEN PULANG</button>
        </div>
      </div>
    </div>
  );
}
