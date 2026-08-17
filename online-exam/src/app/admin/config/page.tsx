'use client';

import { useEffect, useState } from 'react';
import { 
  getSubjects, 
  createSubject, 
  deleteSubject, 
  getClasses, 
  createClass, 
  deleteClass,
  getChapters,
  createChapter,
  deleteChapter,
  getLessons,
  createLesson,
  deleteLesson
} from '@/app/actions/metadata';
import { BookOpen, School, Trash2, Plus, Loader2, Layers, FolderPlus, ListPlus, FolderOpen } from 'lucide-react';

export default function ConfigPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(true);
  
  // Form states
  const [subName, setSubName] = useState('');
  const [subDesc, setSubDesc] = useState('');
  const [className, setClassName] = useState('');
  const [classGrade, setClassGrade] = useState('10');
  
  const [subError, setSubError] = useState('');
  const [classError, setClassError] = useState('');
  const [subSubmitting, setSubSubmitting] = useState(false);
  const [classSubmitting, setClassSubmitting] = useState(false);

  // Curriculum (Chapters & Lessons) states
  const [curriculumSubjectId, setCurriculumSubjectId] = useState('');
  const [curriculumGrade, setCurriculumGrade] = useState('10');
  const [chaptersList, setChaptersList] = useState<any[]>([]);
  const [lessonsMap, setLessonsMap] = useState<Record<string, any[]>>({});
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newLessonTitles, setNewLessonTitles] = useState<Record<string, string>>({});
  const [chapterError, setChapterError] = useState('');

  // Set default subject for curriculum
  useEffect(() => {
    if (subjects.length > 0 && !curriculumSubjectId) {
      setCurriculumSubjectId(subjects[0].id);
    }
  }, [subjects]);

  // Load chapters & lessons when subject/grade changes
  useEffect(() => {
    if (curriculumSubjectId && curriculumGrade) {
      loadChaptersAndLessons();
    }
  }, [curriculumSubjectId, curriculumGrade]);

  const loadChaptersAndLessons = async () => {
    setLoadingChapters(true);
    setChapterError('');
    const res = await getChapters(curriculumSubjectId, curriculumGrade);
    if (res.success && res.data) {
      setChaptersList(res.data);
      // Fetch lessons for each chapter
      const map: Record<string, any[]> = {};
      await Promise.all(
        res.data.map(async (chap: any) => {
          const lRes = await getLessons(chap.id);
          if (lRes.success) {
            map[chap.id] = lRes.data || [];
          }
        })
      );
      setLessonsMap(map);
    } else {
      setChapterError(res.error || 'Lỗi khi tải danh mục chương.');
    }
    setLoadingChapters(false);
  };

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterTitle.trim()) {
      alert('Vui lòng nhập tiêu đề chương.');
      return;
    }
    if (!curriculumSubjectId) {
      alert('Vui lòng chọn môn học.');
      return;
    }
    const res = await createChapter(curriculumSubjectId, curriculumGrade, newChapterTitle.trim());
    if (res.success) {
      setNewChapterTitle('');
      loadChaptersAndLessons();
    } else {
      alert(res.error || 'Lỗi khi thêm chương.');
    }
  };

  const handleDeleteChapter = async (chapId: string, title: string) => {
    if (!confirm(`Bạn có chắc muốn xóa chương "${title}"? Tất cả bài học bên trong chương này cũng sẽ bị xóa.`)) {
      return;
    }
    const res = await deleteChapter(chapId);
    if (res.success) {
      loadChaptersAndLessons();
    } else {
      alert(res.error || 'Lỗi khi xóa chương.');
    }
  };

  const handleAddLesson = async (chapId: string) => {
    const lTitle = newLessonTitles[chapId] || '';
    if (!lTitle.trim()) {
      alert('Vui lòng nhập tên bài học.');
      return;
    }
    const res = await createLesson(chapId, lTitle.trim());
    if (res.success) {
      setNewLessonTitles(prev => ({ ...prev, [chapId]: '' }));
      loadChaptersAndLessons();
    } else {
      alert(res.error || 'Lỗi khi thêm bài.');
    }
  };

  const handleDeleteLesson = async (lId: string, title: string) => {
    if (!confirm(`Bạn có chắc muốn xóa bài "${title}"?`)) {
      return;
    }
    const res = await deleteLesson(lId);
    if (res.success) {
      loadChaptersAndLessons();
    } else {
      alert(res.error || 'Lỗi khi xóa bài.');
    }
  };

  useEffect(() => {
    loadSubjects();
    loadClasses();
  }, []);

  const loadSubjects = async () => {
    setLoadingSubjects(true);
    const res = await getSubjects();
    if (res.success) {
      setSubjects(res.data || []);
    }
    setLoadingSubjects(false);
  };

  const loadClasses = async () => {
    setLoadingClasses(true);
    const res = await getClasses();
    if (res.success) {
      setClasses(res.data || []);
    }
    setLoadingClasses(false);
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim()) {
      setSubError('Vui lòng nhập tên môn học.');
      return;
    }
    setSubError('');
    setSubSubmitting(true);
    const res = await createSubject(subName.trim(), subDesc.trim());
    if (res.success) {
      setSubName('');
      setSubDesc('');
      loadSubjects();
    } else {
      setSubError(res.error || 'Lỗi khi lưu môn học.');
    }
    setSubSubmitting(false);
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) {
      setClassError('Vui lòng nhập tên lớp học.');
      return;
    }
    setClassError('');
    setClassSubmitting(true);
    const res = await createClass(className.trim(), classGrade);
    if (res.success) {
      setClassName('');
      loadClasses();
    } else {
      setClassError(res.error || 'Lỗi khi lưu lớp học.');
    }
    setClassSubmitting(false);
  };

  const handleDeleteSubject = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa môn học "${name}"? Các câu hỏi thuộc môn này có thể bị ảnh hưởng.`)) {
      return;
    }
    const res = await deleteSubject(id);
    if (res.success) {
      loadSubjects();
    } else {
      alert(`Lỗi khi xóa: ${res.error}`);
    }
  };

  const handleDeleteClass = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa lớp học "${name}"? Việc này sẽ xóa toàn bộ học sinh trong lớp.`)) {
      return;
    }
    const res = await deleteClass(id);
    if (res.success) {
      loadClasses();
    } else {
      alert(`Lỗi khi xóa: ${res.error}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cấu Hình Danh Mục</h1>
        <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
          Thiết lập danh sách Môn học và Lớp học cho hệ thống.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Subjects Panel */}
        <div className="space-y-6">
          <div className="card-el p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Quản lý Môn Học
            </h2>
            
            <form onSubmit={handleAddSubject} className="space-y-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">Tên môn học *</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Toán học, Vật lý"
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">Mô tả môn học</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Môn khoa học tự nhiên"
                    value={subDesc}
                    onChange={(e) => setSubDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
              
              {subError && <p className="text-xs text-rose-500 font-medium">{subError}</p>}
              
              <button
                type="submit"
                disabled={subSubmitting}
                className="flex items-center gap-2 py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {subSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Thêm Môn Học
              </button>
            </form>

            <hr className="border-slate-200 dark:border-slate-800 my-4" />

            {/* List */}
            {loadingSubjects ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : subjects.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-10">Chưa có môn học nào được tạo.</p>
            ) : (
              <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-lg">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-500">Tên môn</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-500">Mô tả</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-500">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {subjects.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                        <td className="px-4 py-3 font-medium">{sub.name}</td>
                        <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">{sub.description || '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeleteSubject(sub.id, sub.name)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                            title="Xóa môn học"
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

        {/* Classes Panel */}
        <div className="space-y-6">
          <div className="card-el p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <School className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              Quản lý Lớp Học
            </h2>
            
            <form onSubmit={handleAddClass} className="space-y-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">Tên lớp học *</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 10A1, 11B2"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">Khối lớp (Grade)</label>
                  <select
                    value={classGrade}
                    onChange={(e) => setClassGrade(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="10">Khối 10</option>
                    <option value="11">Khối 11</option>
                    <option value="12">Khối 12</option>
                  </select>
                </div>
              </div>
              
              {classError && <p className="text-xs text-rose-500 font-medium">{classError}</p>}
              
              <button
                type="submit"
                disabled={classSubmitting}
                className="flex items-center gap-2 py-2 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {classSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Thêm Lớp Học
              </button>
            </form>

            <hr className="border-slate-200 dark:border-slate-800 my-4" />

            {/* List */}
            {loadingClasses ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : classes.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-10">Chưa có lớp học nào được tạo.</p>
            ) : (
              <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-lg">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-500">Tên lớp</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-500">Khối lớp</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-500">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {classes.map((cls) => (
                      <tr key={cls.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                        <td className="px-4 py-3 font-medium">{cls.name}</td>
                        <td className="px-4 py-3 text-slate-500">Khối {cls.grade}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeleteClass(cls.id, cls.name)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                            title="Xóa lớp"
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

      {/* Curriculum / Chapters & Lessons Panel */}
      <div className="card-el p-6 shadow-sm mt-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Cấu Trúc Chương Trình (Chương & Bài)
        </h2>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">Môn Học</label>
            <select
              value={curriculumSubjectId}
              onChange={(e) => setCurriculumSubjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500"
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">Khối Lớp</label>
            <select
              value={curriculumGrade}
              onChange={(e) => setCurriculumGrade(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500"
            >
              <option value="10">Khối 10</option>
              <option value="11">Khối 11</option>
              <option value="12">Khối 12</option>
            </select>
          </div>
        </div>

        {/* Add Chapter Form */}
        <form onSubmit={handleAddChapter} className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Ví dụ: Chương 1: Hệ hô hấp..."
            value={newChapterTitle}
            onChange={(e) => setNewChapterTitle(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all cursor-pointer shadow-sm"
          >
            <FolderPlus className="w-4 h-4" /> Thêm Chương
          </button>
        </form>

        <hr className="border-slate-200 dark:border-slate-800 my-4" />

        {/* Chapters & Lessons Listing */}
        {loadingChapters ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : chapterError ? (
          <p className="text-xs text-rose-500 font-medium text-center py-6">{chapterError}</p>
        ) : chaptersList.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-10">Môn học/Khối này chưa được khởi tạo chương & bài nào.</p>
        ) : (
          <div className="space-y-4">
            {chaptersList.map((chap) => {
              const lessons = lessonsMap[chap.id] || [];
              return (
                <div key={chap.id} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/30 dark:bg-slate-900/10">
                  {/* Chapter Header */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="font-bold text-slate-800 dark:text-slate-200">{chap.title}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteChapter(chap.id, chap.title)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                      title="Xóa chương"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Lessons Section */}
                  <div className="p-4 space-y-3">
                    {/* Add Lesson Form */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ví dụ: Bài 1: Cấu tạo phổi..."
                        value={newLessonTitles[chap.id] || ''}
                        onChange={(e) => setNewLessonTitles(prev => ({ ...prev, [chap.id]: e.target.value }))}
                        className="flex-1 px-3 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => handleAddLesson(chap.id)}
                        className="flex items-center gap-1 py-1 px-3 rounded bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs transition-all cursor-pointer shadow-sm"
                      >
                        <ListPlus className="w-3.5 h-3.5" /> Thêm Bài
                      </button>
                    </div>

                    {/* Lessons List */}
                    {lessons.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Chưa có bài học nào trong chương này.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                        {lessons.map((lesson) => (
                          <div key={lesson.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-xs">
                            <span className="text-slate-700 dark:text-slate-300 font-medium">{lesson.title}</span>
                            <button
                              onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                              className="text-slate-400 hover:text-rose-500 p-0.5 transition-colors cursor-pointer"
                              title="Xóa bài"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
