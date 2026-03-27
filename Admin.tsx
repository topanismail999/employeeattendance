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
  const [filterDateEnd, setFilterDateEnd] = useState(''); 
  const [searchTerm, setSearchTerm] = useState('');
  const [searchKaryawan, setSearchKaryawan] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterJabatan, setFilterJabatan] = useState('ALL');
  
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
      listTitle: "Daftar Karyawan",
      members: "Anggota",
      colName: "Nama",
      colShift: "Shift",
      colJabatan: "Jabatan",
      colOpt: "Opsi",
      historyTitle: "Riwayat Absensi",
      searchPlace: "Cari Nama...",
      colNo: "No",
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
      filterAll: "Semua Tipe",
      filterIn: "Masuk",
      filterOut: "Pulang",
      filterJabatanAll: "Semua Jabatan",
      totalExport: "Total Karyawan Unik",
      s_ontime: "Tepat Waktu",
      s_late: "Terlambat",
      s_early: "Pulang Awal",
      s_overtime: "Lembur",
      j_hrd: "HRD",
      j_spv: "Supervisor",
      j_adm: "Admin",
      j_tailor: "Penjahit",
      j_helper: "Helper",
      j_picker: "Picker",
      j_packing: "Packing"
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
      listTitle: "员工名单",
      members: "成员",
      colName: "姓名",
      colShift: "班次",
      colJabatan: "职位",
      colOpt: "操作",
      historyTitle: "出勤记录",
      searchPlace: "搜索姓名...",
      colNo: "编号",
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
      filterAll: "所有类型",
      filterIn: "上班签到",
      filterOut: "下班签退",
      filterJabatanAll: "所有职位",
      totalExport: "唯一员工总数",
      s_ontime: "准时",
      s_late: "迟到",
      s_early: "早退",
      s_overtime: "加班",
      j_hrd: "人力资源 (HRD)",
      j_spv: "主管 (Supervisor)",
      j_adm: "行政 (Admin)",
      j_tailor: "裁缝 (Penjahit)",
      j_helper: "助手 (Helper)",
      j_picker: "拣货员 (Picker)",
      j_packing: "包装员 (Packing)"
    }
  };

  const daftarJabatan = [
    { id: "HRD", label: t[lang].j_hrd },
    { id: "Supervisor", label: t[lang].j_spv },
    { id: "Admin", label: t[lang].j_adm },
    { id: "Penjahit", label: t[lang].j_tailor },
    { id: "Helper", label: t[lang].j_helper },
    { id: "Picker", label: t[lang].j_picker },
    { id: "Packing", label: t[lang].j_packing }
  ];

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: dKaryawan } = await supabase.from('karyawan').select('*').order('nama', { ascending: true });
    const { data: dLogs } = await supabase.from('logs_absensi').select('*').order('created_at', { ascending: false });
    setKaryawan(dKaryawan || []);
    setLogs(dLogs || []);
    setLoading(false);
  };

  const getJabatanLabel = (id: string) => {
    const found = daftarJabatan.find(j => j.id === id);
    return found ? found.label : id;
  };

  // REVISED LOGIC: Sinkronisasi Shift Siang & Malam
  const getStatusLabel = (log: any) => {
    const time = log.jam; 
    const type = log.tipe.toUpperCase();
    const shift = log.shift || "Siang";

    if (type === 'MASUK') {
      // Shift Siang: 08:00 | Shift Malam: 17:15
      const limit = shift === 'Siang' ? '08:00' : '17:15';
      return time <= limit ? t[lang].s_ontime : t[lang].s_late;
    } else {
      // LOGIKA PULANG (CHECK-OUT)
      if (shift === 'Siang') {
        const outLimit = '17:00';
        const otLimit = '18:00'; // Lembur jika > +1 jam
        
        if (time >= otLimit) return t[lang].s_overtime;
        if (time < outLimit) return t[lang].s_early;
        return t[lang].s_ontime;
      } else {
        // Shift Malam: 17:15 - 02:15
        const outLimit = '02:15';
        const otLimit = '03:15'; // Lembur jika > +1 jam (02:15 + 1 jam)

        // Case 1: Pulang di hari yang sama (sebelum tengah malam)
        // Karena shift malam selesai jam 02:15 pagi, 
        // jam 17:15 s/d 23:59 pasti dihitung Pulang Awal.
        if (time >= '17:15' && time <= '23:59') return t[lang].s_early;

        // Case 2: Pulang setelah tengah malam (00:00 ke atas)
        if (time < outLimit) return t[lang].s_early;
        if (time >= outLimit && time < otLimit) return t[lang].s_ontime;
        if (time >= otLimit && time < '12:00') return t[lang].s_overtime;
        
        return t[lang].s_ontime;
      }
    }
  };

  const filteredKaryawan = karyawan.filter(k => 
    k.nama.toLowerCase().includes(searchKaryawan.toLowerCase())
  );

  const filteredLogs = logs.filter(log => {
    const logDate = log.created_at.split('T')[0];
    const matchesDate = filterDate ? (filterDateEnd ? (logDate >= filterDate && logDate <= filterDateEnd) : logDate === filterDate) : true;
    const matchesSearch = log.nama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' ? true : log.tipe.toUpperCase() === filterType;
    const matchesJabatan = filterJabatan === 'ALL' ? true : log.jabatan === filterJabatan;
    return matchesDate && matchesSearch && matchesType && matchesJabatan;
  });

  const exportToExcel = () => {
    const headers = ["No", t[lang].colName, t[lang].colJabatan, "Shift", "Type", "Time", "Date", t[lang].colStatus];
    const rows = filteredLogs.map((log, i) => [
      i + 1,
      log.nama,
      getJabatanLabel(log.jabatan),
      log.shift || "-",
      log.tipe,
      log.jam,
      log.created_at.split('T')[0],
      getStatusLabel(log)
    ]);

    const csvContent = "\uFEFF" + [
      [`REPORT: ${filterDate || 'All'} - ${filterDateEnd || 'Now'}`],
      headers,
      ...rows,
      [""],
      [`${t[lang].totalExport}: ${new Set(filteredLogs.map(l => l.nama)).size}`]
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Absensi_Pro_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const addKaryawan = async (e: any) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { nama, pin, shift, jabatan } = e.target.elements;
    const { error } = await supabase.from('karyawan').insert([
      { nama: nama.value, pin: pin.value, shift: shift.value, jabatan: jabatan.value }
    ]);
    if (!error) {
      Swal.fire({ title: lang === 'ID' ? 'BERHASIL!' : '成功！', text: `${nama.value} ${t[lang].successAdd}`, icon: 'success', confirmButtonColor: '#4f46e5', borderRadius: '2rem' });
      e.target.reset();
      fetchData();
    }
    setIsSubmitting(false);
  };

  const deleteData = async (table: string, id: string, name: string) => {
    const result = await Swal.fire({
      title: t[lang].confirmTitle, text: `${name}. ${t[lang].confirmText}`, icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: t[lang].confirmBtn, borderRadius: '1.5rem'
    });
    if (result.isConfirmed) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (!error) { Swal.fire(t[lang].deleted, '', 'success'); fetchData(); }
    }
  };

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
              
              <select name="jabatan" className="w-full bg-white border border-slate-100 p-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 italic font-bold text-slate-600" required>
                <option value="" disabled selected>{t[lang].colJabatan}</option>
                {daftarJabatan.map(j => <option key={j.id} value={j.id}>{j.label}</option>)}
              </select>

              <select name="shift" className="w-full bg-white border border-slate-100 p-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-100">
                <option value="Siang">{t[lang].shiftSiang}</option>
                <option value="Malam">{t[lang].shiftMalam}</option>
              </select>
              <button disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg shadow-indigo-100 mt-4 transition-all active:scale-95">
                {isSubmitting ? t[lang].btnProcess : t[lang].btnSave}
              </button>
            </form>
          </div>

          {/* TABEL KARYAWAN */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 lg:col-span-2 shadow-sm relative overflow-hidden flex flex-col h-[500px]">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-400"></div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex flex-col">
                 <h2 className="text-xl font-black uppercase italic text-slate-900">{t[lang].listTitle}</h2>
                 <span className="text-[10px] font-black text-indigo-400 uppercase italic">{karyawan.length} {t[lang].members}</span>
                </div>
                <input type="text" placeholder={t[lang].searchPlace} onChange={(e) => setSearchKaryawan(e.target.value)} className="bg-slate-50 border border-slate-100 text-[10px] font-bold p-2 px-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 w-48 shadow-inner" />
            </div>
            <div className="overflow-y-auto pr-2 custom-scrollbar">
              <table className="w-full text-left border-separate border-spacing-y-3">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                    <th className="pb-4 pl-4">{t[lang].colName}</th>
                    <th className="pb-4 text-center">{t[lang].colJabatan}</th>
                    <th className="pb-4 text-center">PIN</th>
                    <th className="pb-4 text-center">{t[lang].colShift}</th>
                    <th className="pb-4 text-right pr-4">{t[lang].colOpt}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKaryawan.map(k => (
                    <tr key={k.id} className="bg-slate-50/50 hover:bg-slate-50 transition-all">
                      <td className="py-4 pl-4 rounded-l-2xl font-black text-xs uppercase italic text-slate-700">{k.nama}</td>
                      <td className="py-4 text-center text-[9px] font-black text-indigo-400 uppercase italic">{getJabatanLabel(k.jabatan)}</td>
                      <td className="py-4 text-center font-mono text-indigo-600 font-bold tracking-widest text-xs">{k.pin}</td>
                      <td className="py-4 text-center"><span className="text-[9px] font-bold bg-white border border-slate-200 px-2 py-1 rounded-lg uppercase">{k.shift === 'Siang' ? t[lang].shiftSiang : t[lang].shiftMalam}</span></td>
                      <td className="py-4 text-right pr-4 rounded-r-2xl">
                        <button onClick={() => deleteData('karyawan', k.id, k.nama)} className="text-rose-400 hover:text-rose-600 p-2 transition-all active:scale-90"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* TABEL LOG */}
        <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm">
          <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex flex-col xl:flex-row justify-between items-center gap-6">
             <div className="flex items-center gap-4">
                <h3 className="font-black text-xs uppercase tracking-[0.3em] text-slate-500 italic">{t[lang].historyTitle}</h3>
                <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-lg">{filteredLogs.length} Data</span>
                <button onClick={exportToExcel} className="bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-black px-4 py-2 rounded-xl uppercase tracking-widest transition-all shadow-lg shadow-emerald-100">Export Pro</button>
             </div>
             
             <div className="flex flex-wrap items-center gap-3">
               <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 gap-1">
                 <span className="text-[8px] font-bold text-slate-400 uppercase">From:</span>
                 <input type="date" onChange={(e) => setFilterDate(e.target.value)} className="text-[10px] font-bold p-2 outline-none" />
                 <span className="text-[8px] font-bold text-slate-400 uppercase">To:</span>
                 <input type="date" onChange={(e) => setFilterDateEnd(e.target.value)} className="text-[10px] font-bold p-2 outline-none" />
               </div>

               <select onChange={(e) => setFilterJabatan(e.target.value)} className="bg-white border border-slate-200 text-[10px] font-bold p-2 rounded-xl outline-none">
                 <option value="ALL">{t[lang].filterJabatanAll}</option>
                 {daftarJabatan.map(j => <option key={j.id} value={j.id}>{j.label}</option>)}
               </select>

               <select onChange={(e) => setFilterType(e.target.value)} className="bg-white border border-slate-200 text-[10px] font-bold p-2 rounded-xl outline-none">
                 <option value="ALL">{t[lang].filterAll}</option>
                 <option value="MASUK">{t[lang].filterIn}</option>
                 <option value="PULANG">{t[lang].filterOut}</option>
               </select>

               <input type="text" placeholder={t[lang].searchPlace} onChange={(e) => setSearchTerm(e.target.value)} className="bg-white border border-slate-200 text-[10px] font-bold p-2 px-4 rounded-xl outline-none w-40" />
               <button onClick={fetchData} className="text-[9px] font-black uppercase text-indigo-600 hover:text-indigo-800 tracking-[0.2em] flex items-center gap-2 ml-2">
                 {loading && <span className="animate-spin">◌</span>} {t[lang].refresh}
               </button>
             </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 uppercase text-[9px] tracking-[0.3em] font-black">
                <tr>
                  <th className="p-8 w-16">{t[lang].colNo}</th>
                  <th className="p-8">{t[lang].colVisual}</th>
                  <th className="p-8">{t[lang].colInfo}</th>
                  <th className="p-8">{t[lang].colTime}</th>
                  <th className="p-8 text-center">{t[lang].colStatus}</th>
                  <th className="p-8 text-right">{t[lang].colAction}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 italic">
                {filteredLogs.map((log, index) => {
                  const statusLabel = getStatusLabel(log);
                  const isBadStatus = statusLabel === t[lang].s_late || statusLabel === t[lang].s_early;
                  const isOvertime = statusLabel === t[lang].s_overtime;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="p-8 font-black text-slate-300 text-xs">{(index + 1).toString().padStart(2, '0')}</td>
                      <td className="p-6">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 border-2 border-white shadow-sm overflow-hidden transition-transform group-hover:scale-105 flex items-center justify-center">
                          {log.foto_url ? (
                            <img src={`${log.foto_url}?t=${new Date(log.created_at).getTime()}`} className="w-full h-full object-cover" alt="Log" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50">
                              <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-8">
                          <p className="text-slate-900 font-black uppercase text-xs tracking-tight">{log.nama}</p>
                          <p className="text-[8px] text-indigo-500 font-black uppercase tracking-widest">{getJabatanLabel(log.jabatan)}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-tighter italic">
                            {new Date(log.created_at).toLocaleDateString(lang === 'ID' ? 'id-ID' : 'zh-CN', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </p>
                      </td>
                      <td className="p-8">
                        <div className="flex flex-col">
                          <span className="text-indigo-600 font-black text-lg font-mono tracking-tighter">{log.jam}</span>
                          <span className={`text-[8px] uppercase font-black tracking-widest ${log.tipe.toUpperCase() === 'MASUK' ? 'text-emerald-500' : 'text-orange-500'}`}>{log.tipe}</span>
                        </div>
                      </td>
                      <td className="p-8 text-center">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] inline-block shadow-sm 
                          ${isOvertime ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                            isBadStatus ? 'bg-rose-50 text-rose-600 border border-rose-100' : 
                            'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="p-8 text-right">
                          <button onClick={() => deleteData('logs_absensi', log.id, `${log.nama}`)} className="bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white p-2 rounded-xl transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </td>
                    </tr>
                  );
                })}
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
