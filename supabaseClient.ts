import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://atenydidkknrojmmksdo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0ZW55ZGlka2tucm9qbW1rc2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NTI3MjUsImV4cCI6MjA4ODAyODcyNX0.mU_YCS4yt2sqXA_1SCCNQUmk0TlSHKd-gEuGn5Z6TSI';

export const supabase = createClient(supabaseUrl, supabaseKey);

/** * FUNGSI HELPER UNTUK LOGIC ABSENSI 
 */

// 1. Ambil Data Karyawan berdasarkan PIN
export const getKaryawanByPin = async (pin: string) => {
  return await supabase
    .from('karyawan')
    .select('*')
    .eq('pin', pin)
    .single();
};

// 2. Simpan Absensi
export const insertAbsen = async (data: {
  karyawan_id: string;
  nama: string;
  tipe: 'MASUK' | 'PULANG';
  status: string;
  foto_url?: string;
}) => {
  return await supabase.from('logs_absensi').insert([data]);
};

// 3. Ambil Semua Log untuk Admin (Filter Terlambat)
export const getLateLogs = async () => {
  return await supabase
    .from('logs_absensi')
    .select('*, karyawan(shift)')
    .eq('status', 'Terlambat');
};

// 4. Update Jam Kerja (Settings)
export const updateWorkSettings = async (newSettings: any) => {
  return await supabase
    .from('settings')
    .update(newSettings)
    .eq('id', 1);
};
