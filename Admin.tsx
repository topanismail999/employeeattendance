import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Link } from 'react-router-dom';

declare var Swal: any;

export default function Admin() {
  const [karyawan, setKaryawan] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All'); // State baru untuk filter Masuk/Pulang
  
  const [lang, setLang] = useState<'ID' | 'CN'>('ID');

  const t = {
    ID: {
      back: "Back",
      front: "← Depan",
      regTitle: "Daftarkan PIN Baru",
      namePlace: "Nama Lengkap",
      pinPlace: "PIN (4 Digit)",
      shiftSiang: "Shift Siang",
      shiftMalam: "Shift Malam",
      btnSave: "Simpan Data",
      btnProcess: "Memproses...",
      listTitle: "Kontrol Filter",
      members: "Anggota",
      colName: "Nama",
      colShift: "Shift",
      colOpt: "Opsi",
      historyTitle: "Riwayat Absensi",
      searchPlace: "Cari Nama...",
      colVisual: "Visual",
      colInfo: "Informasi",
      colTime: "Waktu & Tipe",
      colStatus: "Status",
      colAction: "Aksi",
      noData: "Data Tidak Ditemukan",
      confirmTitle: "Apakah Anda yakin?",
      confirmText: "Data tidak dapat dikembalikan!",
      confirmBtn: "Ya, Hapus!",
      successAdd: "Berhasil terdaftar",
      deleted: "Terhapus!",
      refresh: "Segarkan",
      all: "Semua Tipe",
      typeIn: "Masuk",
      typeOut: "Pulang",
      totalRow: "Total Karyawan Unik"
    },
    CN: {
      back: "后台",
      front: "← 前台",
      regTitle: "注册新密码 (PIN)",
      namePlace: "全名",
      pinPlace: "密码 (4 位数)",
      shiftSiang: "白班",
      shiftMalam: "晚班",
      btnSave: "保存数据",
      btnProcess: "处理中...",
      listTitle: "筛选控制",
      members: "成员",
      colName: "姓名",
      colShift: "班次",
      colOpt: "操作",
      historyTitle: "出勤记录",
      searchPlace: "搜索姓名...",
      colVisual: "照片",
      colInfo: "员工信息",
      colTime: "时间与类型",
      colStatus: "状态",
      colAction: "操作",
      noData: "未找到数据",
      confirmTitle: "您确定吗？",
      confirmText: "数据删除后将无法恢复！",
      confirmBtn: "是的，删除！",
      successAdd: "注册成功",
      deleted: "已删除！",
      refresh: "刷新",
      all: "所有类型",
      typeIn: "上班",
      typeOut: "下班",
      totalRow: "唯一员工总数"
    }
  };

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
        title: lang === 'ID' ? 'BERHASIL!' : '成功！',
        text: `${nama.value} ${t[lang].successAdd}`,
        icon: 'success',
        confirmButtonColor: '#4f46e5',
        borderRadius: '2rem',
      });
      e.target.reset();
      fetchData();
    } else {
      Swal.fire({ title: 'Error', text: error.message, icon: 'error' });
    }
    setIsSubmitting(false);
  };

  const deleteData = async (table: string, id: string, name: string) => {
    const result = await Swal.fire({
      title: t[lang].confirmTitle,
      text: `${name}. ${t[lang].confirmText}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: t[lang].confirmBtn,
      borderRadius: '1.5rem'
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (!error) {
        Swal.fire(t[lang].deleted, '', 'success');
        fetchData();
      }
    }
  };

  const exportToCSV = () => {
    // Header sesuai bahasa
    const headers = [t[lang].colName, 'Tipe', 'Jam', 'Status', 'Tanggal'];
    
    // Konversi tipe log sesuai bahasa
    const csvData = filteredLogs.map(log => [
      log.nama, 
      log.tipe === 'Masuk' ? t[lang].typeIn : t[lang].typeOut, 
      log.jam, 
      log.status,
      new Date(log.created_at).toLocaleDateString()
    ]);

    // Hitung total karyawan unik dalam filter saat ini
    const totalKaryawan = new Set(filteredLogs.map(l => l.nama)).size;
    
    // Tambahkan baris total di akhir
    const footer = ["", "", "", t[lang].totalRow, totalKaryawan];

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + csvData.map(e => e.join(",")).join("\n")
      + "\n\n" + footer.join(",");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Laporan_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const filteredLogs = logs.filter(log => {
    const matchesDate = filterDate ? log.created_at.startsWith(filterDate) : true;
    const matchesSearch = log.nama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' ? true : log.tipe === filterType;
    return matchesDate && matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-6 md:p-12 font-sans selection:bg-indigo-100">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 italic uppercase">
              {t[lang].back}<span className="text-indigo-600">Office</span>
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-slate-400 text-xs font-bold tracking-[0.2em] italic uppercase">Buymoreworkers System</p>
              <div className="flex bg-slate-200 p-1 rounded-lg scale-90">
                <button onClick={() => setLang('ID')} className={`px-2 py-0.5 rounded text-[10px] font-bold ${lang === 'ID' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>ID</button>
                <button onClick={() => setLang('CN')} className={`px-2 py-0.5 rounded text-[10px] font-bold ${lang === 'CN' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>CN</button>
              </div>
            </div>
          </div>
          <Link to="/" className="px-6 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">
            {t[lang].front}
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* REGISTRASI PIN */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden h-fit">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600"></div>
            <h2 className="text-xl font-black mb-6 uppercase italic text-slate-900">{t[lang].regTitle}</h2>
            <form onSubmit={addKaryawan} className="space-y-4">
              <input name="nama" placeholder={t[lang].namePlace} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all" required />
              <input name="pin" placeholder={t[lang].pinPlace} maxLength={4} className="w-full bg-white border border-slate-100 p-4 rounded-2xl text-sm font-mono tracking-widest outline-none focus:ring-2 focus:ring-indigo-100 transition-all" required />
              <select name="shift" className="w-full bg-white border border-slate-100 p-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-100">
                <option value="Siang">{t[lang].shiftSiang}</option>
                <option value="Malam">{t[lang].shiftMalam}</option>
              </select>
              <button disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg shadow-indigo-100 mt-4 transition-all active:scale-95">
                {isSubmitting ? t[lang].btnProcess : t[lang].btnSave}
              </button>
            </form>
          </div>

          {/* FILTER TYPE (MENGGANTIKAN TABEL DAFTAR) */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 lg:col-span-2 shadow-sm relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-400"></div>
            <h2 className="text-xl font-black uppercase italic text-slate-900 mb-8">{t[lang].listTitle}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => setFilterType('All')}
                className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-2 ${filterType === 'All' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-indigo-200'}`}
              >
                <span className="text-2xl">📊</span>
                <span className="font-black text-[10px] uppercase tracking-widest">{t[lang].all}</span>
              </button>

              <button 
                onClick={() => setFilterType('Masuk')}
                className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-2 ${filterType === 'Masuk' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-100 hover:border-emerald-200'}`}
              >
                <span className="text-2xl">🕒</span>
                <span className="font-black text-[10px] uppercase tracking-widest">{t[lang].typeIn}</span>
              </button>

              <button 
                onClick={() => setFilterType('Pulang')}
                className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-2 ${filterType === 'Pulang' ? 'border-rose-500 bg-rose-50/50' : 'border-slate-100 hover:border-rose-200'}`}
              >
                <span className="text-2xl">🚪</span>
                <span className="font-black text-[10px] uppercase tracking-widest">{t[lang].typeOut}</span>
              </button>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center text-slate-400 italic">
               <span className="text-[10px] font-bold uppercase tracking-widest">{karyawan.length} {t[lang].members} Registered</span>
               <span className="text-[10px] font-bold uppercase tracking-widest">{filteredLogs.length} Activities Shown</span>
            </div>
          </div>
        </div>

        {/* TABEL LOG */}
        <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm">
          <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row justify-between items-center gap-6">
             <div className="flex items-center gap-4">
                <h3 className="font-black text-xs uppercase tracking-[0.3em] text-slate-500 italic">{t[lang].historyTitle}</h3>
                <button onClick={exportToCSV} className="bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-black px-4 py-2 rounded-xl uppercase tracking-widest transition-all shadow-lg shadow-emerald-100">Export CSV</button>
             </div>
             <div className="flex flex-wrap items-center gap-3">
               <input type="date" onChange={(e) => setFilterDate(e.target.value)} className="bg-white border border-slate-200 text-[10px] font-bold p-2 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100" />
               <input type="text" placeholder={t[lang].searchPlace} onChange={(e) => setSearchTerm(e.target.value)} className="bg-white border border-slate-200 text-[10px] font-bold p-2 px-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 w-40" />
               <button onClick={fetchData} className="text-[9px] font-black uppercase text-indigo-600 hover:text-indigo-800 tracking-[0.2em] flex items-center gap-2 ml-2">
                 {loading && <span className="animate-spin">◌</span>} {t[lang].refresh}
               </button>
             </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 uppercase text-[9px] tracking-[0.3em] font-black">
                <tr>
                  <th className="p-8">{t[lang].colVisual}</th>
                  <th className="p-8">{t[lang].colInfo}</th>
                  <th className="p-8">{t[lang].colTime}</th>
                  <th className="p-8 text-center">{t[lang].colStatus}</th>
                  <th className="p-8 text-right">{t[lang].colAction}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 italic">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="p-6">
                      <div className="w-14 h-14 rounded-2xl bg-slate-200 border-2 border-white shadow-sm overflow-hidden transition-transform group-hover:scale-105">
                        {log.foto_url ? <img src={log.foto_url} className="w-full h-full object-cover" alt="Log" /> : <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400">No Image</div>}
                      </div>
                    </td>
                    <td className="p-8">
                        <p className="text-slate-900 font-black uppercase text-xs tracking-tight">{log.nama}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-tighter italic">
                          {new Date(log.created_at).toLocaleDateString(lang === 'ID' ? 'id-ID' : 'zh-CN', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </td>
                    <td className="p-8">
                      <div className="flex flex-col">
                        <span className="text-indigo-600 font-black text-lg font-mono tracking-tighter">{log.jam}</span>
                        <span className={`text-[8px] uppercase font-black tracking-widest ${log.tipe === 'Masuk' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {log.tipe === 'Masuk' ? t[lang].typeIn : t[lang].typeOut}
                        </span>
                      </div>
                    </td>
                    <td className="p-8 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] inline-block shadow-sm ${log.status === 'On Time' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>{log.status}</span>
                    </td>
                    <td className="p-8 text-right">
                        <button onClick={() => deleteData('logs_absensi', log.id, `${log.nama}`)} className="bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white p-2 rounded-xl transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredLogs.length === 0 && <div className="p-20 text-center text-slate-300 uppercase font-black tracking-widest text-xs italic">{t[lang].noData}</div>}
          </div>
        </div>
      </div>
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 20px; }`}</style>
    </div>
  );
}
