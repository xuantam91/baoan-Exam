'use client';

import { useEffect, useState, useRef } from 'react';
import { getClasses } from '@/app/actions/metadata';
import { getStudents, createStudent, deleteStudent, importStudents } from '@/app/actions/students';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Upload, 
  FileSpreadsheet, 
  Loader2, 
  Download, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function StudentsPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [classesLoading, setClassesLoading] = useState(true);

  // Form states (Single Student)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [classId, setClassId] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Import states
  const [importClassId, setImportClassId] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<{ success?: boolean; msg?: string } | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter state
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');

  useEffect(() => {
    loadClasses();
    loadStudents();
  }, []);

  const loadClasses = async () => {
    setClassesLoading(true);
    const res = await getClasses();
    if (res.success) {
      setClasses(res.data || []);
      if (res.data && res.data.length > 0) {
        setClassId(res.data[0].id);
        setImportClassId(res.data[0].id);
      }
    }
    setClassesLoading(false);
  };

  const loadStudents = async () => {
    setLoading(true);
    const res = await getStudents();
    if (res.success) {
      setStudents(res.data || []);
    }
    setLoading(false);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !classId) {
      setError('Vui lòng nhập đầy đủ Tên, Email và chọn Lớp.');
      return;
    }
    setError('');
    setSubmitting(true);
    const res = await createStudent(name.trim(), email.trim(), phone.trim(), classId);
    if (res.success) {
      setName('');
      setEmail('');
      setPhone('');
      loadStudents();
    } else {
      setError(res.error || 'Lỗi xảy ra khi thêm học sinh.');
    }
    setSubmitting(false);
  };

  const handleDeleteStudent = async (id: string, studentName: string) => {
    if (!confirm(`Bạn có chắc muốn xóa học sinh "${studentName}"? Điều này sẽ xóa toàn bộ bài thi đã nộp của học sinh này.`)) {
      return;
    }
    const res = await deleteStudent(id);
    if (res.success) {
      loadStudents();
    } else {
      alert(`Lỗi khi xóa: ${res.error}`);
    }
  };

  // Process Excel/CSV Import
  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile || !importClassId) {
      setImportStatus({ success: false, msg: 'Vui lòng chọn file và chọn lớp học để import.' });
      return;
    }

    setImporting(true);
    setImportStatus(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          setImportStatus({ success: false, msg: 'File Excel/CSV không có dữ liệu.' });
          setImporting(false);
          return;
        }

        // Map column headers headers to standardize
        const mappedStudents: any[] = [];
        data.forEach((row: any) => {
          // Normalize keys to lowercase for matching
          const normalizedRow: any = {};
          Object.keys(row).forEach(key => {
            normalizedRow[key.toLowerCase().trim()] = row[key];
          });

          // Match columns
          const nameVal = normalizedRow['họ tên'] || normalizedRow['ho ten'] || normalizedRow['tên'] || normalizedRow['ten'] || normalizedRow['name'] || normalizedRow['fullname'];
          const emailVal = normalizedRow['email'] || normalizedRow['thư điện tử'] || normalizedRow['thu dien tu'];
          const phoneVal = normalizedRow['sđt'] || normalizedRow['sdt'] || normalizedRow['số điện thoại'] || normalizedRow['so dien thoai'] || normalizedRow['phone'] || normalizedRow['telephone'];

          if (nameVal && emailVal) {
            mappedStudents.push({
              name: String(nameVal),
              email: String(emailVal),
              phone: phoneVal ? String(phoneVal) : undefined,
              class_id: importClassId
            });
          }
        });

        if (mappedStudents.length === 0) {
          setImportStatus({ 
            success: false, 
            msg: 'Không tìm thấy cột phù hợp (Cần có cột: Họ tên/Name và Email trong file).' 
          });
          setImporting(false);
          return;
        }

        // Send database upsert payload
        const res = await importStudents(mappedStudents);
        if (res.success) {
          setImportStatus({ success: true, msg: `Đã import thành công ${res.count} học sinh vào lớp!` });
          setImportFile(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
          loadStudents();
        } else {
          setImportStatus({ success: false, msg: `Lỗi import từ server: ${res.error}` });
        }
      } catch (err: any) {
        setImportStatus({ success: false, msg: `Lỗi đọc file: ${err.message}` });
      }
      setImporting(false);
    };

    reader.readAsBinaryString(importFile);
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { "Họ tên": "Nguyễn Văn A", "Email": "nguyenvana@gmail.com", "SĐT": "0912345678" },
      { "Họ tên": "Trần Thị B", "Email": "tranthib@gmail.com", "SĐT": "0987654321" }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DanhSachHocSinh");
    XLSX.writeFile(wb, "mau_import_hoc_sinh.xlsx");
  };

  // Filter students
  const filteredStudents = selectedClassFilter === 'all'
    ? students
    : students.filter(s => s.class_id === selectedClassFilter);

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản Lý Học Sinh</h1>
        <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
          Quản lý danh sách học sinh và import dữ liệu lớp học nhanh chóng.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Forms */}
        <div className="xl:col-span-1 space-y-8">
          
          {/* Add Student Card */}
          <div className="card-el p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Thêm Học Sinh Thủ Công
            </h2>
            
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">Họ và Tên *</label>
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">Địa chỉ Email *</label>
                <input
                  type="email"
                  placeholder="hocsinh@truong.edu.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">Số Điện Thoại</label>
                <input
                  type="tel"
                  placeholder="09xx xxx xxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">Lớp Học *</label>
                {classesLoading ? (
                  <p className="text-xs text-slate-400">Đang tải...</p>
                ) : (
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name} (Khối {cls.grade})</option>
                    ))}
                  </select>
                )}
              </div>

              {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

              <button
                type="submit"
                disabled={submitting || classes.length === 0}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Lưu Học Sinh
              </button>
            </form>
          </div>

          {/* Import Card */}
          <div className="card-el p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Import từ Excel / CSV
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Thêm nhanh hàng loạt học sinh. Hệ thống sẽ bỏ qua hoặc cập nhật nếu email bị trùng.
            </p>

            <form onSubmit={handleImport} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">Lớp Nhập Học Sinh *</label>
                <select
                  value={importClassId}
                  onChange={(e) => setImportClassId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name} (Khối {cls.grade})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">Chọn file Excel (.xlsx) hoặc CSV</label>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  ref={fileInputRef}
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 dark:file:bg-slate-800 dark:file:text-slate-300 file:cursor-pointer"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={importing || !importFile || !importClassId}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
                  Tiến Hành Import
                </button>
                
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="flex items-center justify-center p-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
                  title="Tải file mẫu Excel"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>

              {importStatus && (
                <div className={`p-3 rounded-lg text-xs flex gap-2 items-start ${
                  importStatus.success ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400'
                }`}>
                  {importStatus.success ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                  <span>{importStatus.msg}</span>
                </div>
              )}
            </form>
          </div>

        </div>

        {/* Right Column: Table List */}
        <div className="xl:col-span-2 space-y-6">
          <div className="card-el p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Danh Sách Học Sinh ({filteredStudents.length})
              </h2>

              {/* Class Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Lọc theo lớp:</span>
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">Tất cả các lớp</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Không tìm thấy học sinh nào.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-slate-500">Học sinh</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-500">Email</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-500">Số điện thoại</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-500">Lớp</th>
                      <th className="px-6 py-3 text-right font-semibold text-slate-500">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredStudents.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                        <td className="px-6 py-3 font-semibold">{st.name}</td>
                        <td className="px-6 py-3 text-slate-600 dark:text-slate-400">{st.email}</td>
                        <td className="px-6 py-3 text-slate-500">{st.phone || '-'}</td>
                        <td className="px-6 py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                            {st.classes?.name || 'Chưa phân lớp'}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <button
                            onClick={() => handleDeleteStudent(st.id, st.name)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                            title="Xóa học sinh"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
