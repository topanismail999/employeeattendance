import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Admin from './Admin';

declare var Swal: any;

const AttendanceForm = () => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    startVideo();
  }, []);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: { width: 300 } })
      .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
      .catch(err => console.error("Kamera error:", err));
  };

  const handleAbsen = async (tipe: 'MASUK' | 'PULANG') => {
    if (pin.length < 4) return Swal.fire({ icon: 'error', title: 'PIN SALAH', text: 'Masukkan 4 digit PIN Anda', background: '#fff', color: '#1e293b' });
    
    setLoading(true);
    
    // 1. Ambil Data Karyawan (Termasuk Jabatan dan Shift untuk Sinkronisasi)
    const { data: karyawan, error } = await supabase.from('karyawan').select('*').eq('pin', pin).single();
    if (error || !karyawan) {
      setLoading(false);
      return Swal.fire({ icon: 'error', title: 'TIDAK DITEMUKAN', text: 'PIN tidak terdaftar!', background: '#fff' });
    }

    // 2. Ambil Foto dari Video Stream
    let fotoUrl = '';
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context?.drawImage(videoRef.current, 0, 0);
      
      const blob = await new Promise<Blob | null>(resolve => canvasRef.current?.toBlob(resolve, 'image/jpeg', 0.8));
      if (blob) {
        const fileName = `${Date.now()}_${pin}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('absensi_photos')
          .upload(fileName, blob);
        
        if (!uploadError) {
          const { data: publicUrl } = supabase.storage.from('absensi_photos').getPublicUrl(fileName);
          fotoUrl = publicUrl.publicUrl;
        }
      }
    }

    const jamSekarang = new Date().toLocaleTimeString('it-IT', { hour12: false }).slice(0, 5);
    const shiftKaryawan = karyawan.shift || 'Siang';
    
    // LOGIKA SINKRONISASI STATUS (Sesuai Admin.tsx)
    let statusLog = ''; 
    let pesanAlert = `Halo ${karyawan.nama}, absen ${tipe.toLowerCase()} berhasil dicatat!`;
    let iconAlert = 'success';

    if (tipe === 'MASUK') {
      // Shift Siang: > 08:00 | Shift Malam: > 17:15
      const limitMasuk = shiftKaryawan === 'Siang' ? '08:00' : '17:15';
      if (jamSekarang > limitMasuk) {
        statusLog = 'Terlambat';
        pesanAlert = `Waduh ${karyawan.nama}, Anda Terlambat! Tetap semangat mengejar hari! 🔥`;
        iconAlert = 'warning';
      }
    } else {
      // LOGIKA PULANG (PULANG CEPAT)
      if (shiftKaryawan === 'Siang') {
        if (jamSekarang < '17:00') {
          statusLog = 'Terlalu Cepat Pulang';
          pesanAlert = 'Belum jam 17:00! Pastikan pekerjaan Anda sudah selesai sebelum pulang.';
          iconAlert = 'warning';
        }
      } else {
        // Shift Malam (Selesai 02:15)
        // Jika pulang antara jam 17:15 - 23:59 atau sebelum 02:15 pagi
        const isBeforeMidnight = jamSekarang >= '17:15' && jamSekarang <= '23:59';
        const isAfterMidnightButEarly = jamSekarang < '02:15';
        
        if (isBeforeMidnight || isAfterMidnightButEarly) {
          statusLog = 'Terlalu Cepat Pulang';
          pesanAlert = 'Belum waktunya ganti shift! Gunakan waktu istirahat dengan bijak.';
          iconAlert = 'warning';
        }
      }
    }

    // 3. Simpan Log ke DB (Menyimpan Shift & Jabatan agar Admin tidak perlu join table manual)
    const { error: errInsert } = await supabase.from('logs_absensi').insert([{
      karyawan_id: karyawan.id, 
      nama: karyawan.nama, 
      jabatan: karyawan.jabatan,
      shift: shiftKaryawan,
      tipe, 
      jam: jamSekarang, 
      status: statusLog, 
      foto_url: fotoUrl 
    }]);

    if (!errInsert) {
      Swal.fire({ 
        title: statusLog ? statusLog.toUpperCase() : 'BERHASIL!', 
        text: pesanAlert, 
        icon: iconAlert, 
        background: '#fff', 
        confirmButtonColor: statusLog ? '#f43f5e' : '#4f46e5' 
      });
      setPin('');
    } else {
      Swal.fire({ icon: 'error', title: 'GAGAL', text: 'Terjadi kesalahan sistem.' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-indigo-50 p-6">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-2xl border border-white rounded-[3.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] text-center relative overflow-hidden">
        <h1 className="text-3xl font-black mb-1 text-slate-900 italic uppercase">Digital<span className="text-indigo-600">Absensi</span></h1>
        <p className="text-[9px] text-slate-400 font-bold tracking-[0.3em] mb-6 uppercase tracking-widest">Premium Bio-Verification</p>
        
        {/* Preview Kamera Live */}
        <div className="w-full h-56 bg-slate-200 rounded-[2.5rem] mb-6 border-4 border-white shadow-inner relative overflow-hidden">
           <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale-[30%]" />
           <canvas ref={canvasRef} className="hidden" />
           <div className="absolute top-4 right-4 flex gap-1">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-[8px] font-black text-white uppercase drop-shadow-md">Live</span>
           </div>
        </div>

        <input 
          type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="••••" 
          className="w-full bg-slate-50 border border-slate-100 text-center text-4xl tracking-[1.5rem] py-5 rounded-3xl mb-6 focus:ring-4 focus:ring-indigo-100 outline-none font-mono text-slate-800"
        />

        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => handleAbsen('MASUK')} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-[1.5rem] font-black text-xs tracking-widest transition-all shadow-xl shadow-indigo-100 uppercase">Masuk</button>
          <button onClick={() => handleAbsen('PULANG')} disabled={loading} className="bg-slate-900 hover:bg-black text-white py-5 rounded-[1.5rem] font-black text-xs tracking-widest transition-all uppercase">Pulang</button>
        </div>

        <div className="mt-8">
          <Link to="/backoffice" className="text-[9px] text-slate-400 hover:text-indigo-600 uppercase tracking-[0.4em] font-black transition-all">Backoffice Access →</Link>
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
        <Route path="/backoffice" element={<Admin />} />
      </Routes>
    </Router>
  );
}
