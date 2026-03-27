import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Link } from 'react-router-dom';

// Pastikan SweetAlert2 terpasang atau gunakan deklarasi jika menggunakan CDN
declare var Swal: any;

export default function Admin() {
  const [karyawan, setKaryawan] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State untuk Filter
  const [filterDate, setFilterDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: dKaryawan } = await supabase.from('karyawan').select('*').order('nama', { ascending: true });
    const { data: dLogs } = await supabase.from('logs_absensi').select('*').order('created_at', { ascending: false });
    setKaryawan(dKaryawan || []);
    setLogs(dLogs || []);
    setLoading(false);
  };

  const addKaryawan = async (e: any) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { nama, pin, shift } = e.target.elements;
    
    const { error } = await supabase.from('karyawan').insert([{ 
      nama: nama.value, 
      pin: pin.value, 
      shift: shift.value 
    }]);

    if (!error) {
      Swal.fire({
        title: 'BERHASIL!',
        text: `Karyawan ${nama.value} telah terdaftar.`,
        icon: 'success',
        confirmButtonColor: '#4f46e5',
        borderRadius: '2rem',
      });
      e.target.reset();
      fetchData();
    } else {
      Swal.fire({ title: 'GAGAL', text: error.message, icon: 'error' });
    }
    setIsSubmitting(false);
  };

  // FUNGSI HAPUS DATA (Karyawan atau Log)
  const deleteData = async (table: string, id: string, name: string) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: `Menghapus data ${name} tidak dapat dikembalikan!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus!',
      borderRadius: '1.5rem'
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (!error) {
        Swal.fire('Terhapus!', 'Data telah dihapus.', 'success');
        fetchData();
      } else {
        Swal.fire('Error', error.message, 'error');
      }
    }
  };

  // FUNGSI EXPORT KE CSV
  const exportToCSV = () => {
    const headers = ['Nama', 'Tipe', 'Jam', 'Status', 'Tanggal'];
    const csvData = filteredLogs.map(log => [
      log.nama,
      log.tipe,
      log.jam,
      log.status,
      new Date(log.created_at).toLocaleDateString()
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + csvData.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Absensi_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  // Logika Filter
  const filteredLogs = logs.filter(log => {
    const matchesDate = filterDate ? log.created_at.startsWith(filterDate) : true;
    const matchesSearch = log.nama.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDate && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-6 md:p-12 font-sans selection:bg-indigo-100">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 italic uppercase">Back<span className="text-indigo-600">Office</span></h1>
            <p className="text-slate-400 text-xs font-bold tracking-[0.2em] mt-1 italic uppercase">Buymoreworkers Management System</p>
          </div>
          <Link to="/" className="px-6 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">← Front</Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          {/* REGISTRASI PIN */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden h-fit">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600"></div>
            <h2 className="text-xl font-black mb-6 uppercase italic text-slate-900">Daftarkan PIN Baru</h2>
            <form onSubmit={addKaryawan} className="space-y-4">
              <input name="nama" placeholder="Nama Lengkap" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all" required />
              <input name="pin" placeholder="PIN (4 Digit)" maxLength={4} className="w-full bg-white border border-slate-100 p-4 rounded-2xl text-sm font-mono tracking-widest outline-none focus:ring-2 focus:ring-indigo-100 transition-all" required />
              <select name="shift" className="w-full bg-white border border-slate-100 p-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-100">
                <option value="Siang">Shift Siang (08:00 - 17:00)</option>
                <option value="Malam">Shift Malam (20:00 - 05:00)</option>
              </select>
              <button 
                disabled={isSubmitting} 
                className={`w-full ${isSubmitting ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg shadow-indigo-100 mt-4 transition-all active:scale-95`}
              >
                {isSubmitting ? 'Processing...' : 'Simpan Data'}
              </button>
            </form>
          </div>

          {/* TABEL MANAJEMEN KARYAWAN (DAFTAR PIN) */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 lg:col-span-2 shadow-sm relative overflow-hidden flex flex-col h-[500px]">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-400"></div>
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-black uppercase italic text-slate-900">Daftar Karyawan Terdaftar</h2>
               <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full uppercase italic">{karyawan.length} Members</span>
            </div>
            <div className="overflow-y-auto pr-2 custom-scrollbar">
              <table className="w-full text-left border-separate border-spacing-y-3">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                    <th className="pb-4 pl-4">Nama</th>
                    <th className="pb-4 text-center">PIN</th>
                    <th className="pb-4 text-center">Shift</th>
                    <th className="pb-4 text-right pr-4">Opsi</th>
                  </tr>
                </thead>
                <tbody>
                  {karyawan.map(k => (
                    <tr key={k.id} className="bg-slate-50/50 hover:bg-slate-50 transition-all">
                      <td className="py-4 pl-4 rounded-l-2xl font-black text-xs uppercase italic text-slate-700">{k.nama}</td>
                      <td className="py-4 text-center font-mono text-indigo-600 font-bold tracking-widest text-xs">{k.pin}</td>
                      <td className="py-4 text-center"><span className="text-[9px] font-bold bg-white border border-slate-200 px-2 py-1 rounded-lg uppercase">{k.shift}</span></td>
                      <td className="py-4 text-right pr-4 rounded-r-2xl">
                        <button onClick={() => deleteData('karyawan', k.id, k.nama)} className="text-rose-400 hover:text-rose-600 p-2 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* TABEL LOG ABSENSI (DENGAN FILTER & EXPORT) */}
        <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm">
          <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row justify-between items-center gap-6">
             <div className="flex items-center gap-4">
                <h3 className="font-black text-xs uppercase tracking-[0.3em] text-slate-500 italic">History Feed</h3>
                <button onClick={exportToCSV} className="bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-black px-4 py-2 rounded-xl uppercase tracking-widest transition-all shadow-lg shadow-emerald-100">Export CSV</button>
             </div>
             
             <div className="flex flex-wrap items-center gap-3">
               <input 
                  type="date" 
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="bg-white border border-slate-200 text-[10px] font-bold p-2 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100"
               />
               <input 
                  type="text" 
                  placeholder="Cari Nama..." 
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border border-slate-200 text-[10px] font-bold p-2 px-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 w-40"
               />
               <button onClick={fetchData} className="text-[9px] font-black uppercase text-indigo-600 hover:text-indigo-800 tracking-[0.2em] flex items-center gap-2 ml-2">
                 {loading && <span className="animate-spin">◌</span>} Refresh
               </button>
             </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 uppercase text-[9px] tracking-[0.3em] font-black">
                <tr>
                  <th className="p-8">Visual</th>
                  <th className="p-8">Informasi Karyawan</th>
                  <th className="p-8">Waktu & Tipe</th>
                  <th className="p-8 text-center">Status</th>
                  <th className="p-8 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 italic">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="p-6">
                      <div className="w-14 h-14 rounded-2xl bg-slate-200 border-2 border-white shadow-sm overflow-hidden transition-transform group-hover:scale-105">
                        {log.foto_url ? (
                          <img src={log.foto_url} className="w-full h-full object-cover" alt="Log" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400">No Image</div>
                        )}
                      </div>
                    </td>
                    <td className="p-8">
                        <p className="text-slate-900 font-black uppercase text-xs tracking-tight">{log.nama}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-tighter italic">
                          {new Date(log.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </td>
                    <td className="p-8">
                      <div className="flex flex-col">
                        <span className="text-indigo-600 font-black text-lg font-mono tracking-tighter">{log.jam}</span>
                        <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest">{log.tipe}</span>
                      </div>
                    </td>
                    <td className="p-8 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] inline-block shadow-sm ${
                        log.status === 'On Time' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}>{log.status}</span>
                    </td>
                    <td className="p-8 text-right">
                        <button onClick={() => deleteData('logs_absensi', log.id, `Absensi ${log.nama}`)} className="bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white p-2 rounded-xl transition-all">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredLogs.length === 0 && (
              <div className="p-20 text-center text-slate-300 uppercase font-black tracking-widest text-xs italic">Data Tidak Ditemukan</div>
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 20px; }
      `}</style>
    </div>
  );
}
