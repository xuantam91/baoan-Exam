'use server';

import { supabase } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';
import { revalidatePath } from 'next/cache';

interface SubmitExamInput {
  examId: string;
  studentId: string;
  answers: Record<string, string>; // Format: { [questionId]: "A" | "B" | "C" | "D" } (or JSON string for TrueFalse, text for Essay)
}

export async function submitExam({ examId, studentId, answers }: SubmitExamInput) {
  try {
    // 1. Fetch the exam record
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('*, subjects(name)')
      .eq('id', examId)
      .single();

    if (examError) throw examError;

    // 2. Fetch all full question data
    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('id, content, options, correct_answer, explanation, question_type')
      .in('id', exam.question_ids);

    if (qError) throw qError;

    // 3. Fetch student details
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('name, email')
      .eq('id', studentId)
      .single();

    if (studentError) throw studentError;

    // 4. Grade the auto-gradable questions, identify if essay exists
    let autoQuestionCredits = 0;
    let hasEssay = false;

    const gradingDetails = questions.map((q: any) => {
      const studentAnswer = answers[q.id] || '';
      let isCorrect = false;
      let credit = 0;

      if (q.question_type === 'MultipleChoice') {
        isCorrect = studentAnswer.trim().toUpperCase() === q.correct_answer.trim().toUpperCase();
        credit = isCorrect ? 1 : 0;
        if (isCorrect) autoQuestionCredits++;
      } else if (q.question_type === 'TrueFalse') {
        try {
          const correctObj = JSON.parse(q.correct_answer);
          const studentObj = typeof studentAnswer === 'string' ? JSON.parse(studentAnswer) : studentAnswer;
          
          let tfCorrectCount = 0;
          for (const key of ['a', 'b', 'c', 'd']) {
            if (studentObj?.[key] === correctObj[key]) tfCorrectCount++;
          }
          
          isCorrect = tfCorrectCount === 4;
          // Partial credit: ratio of correct sub-statements
          credit = tfCorrectCount / 4;
          autoQuestionCredits += credit;
        } catch (e) {
          console.error('Error grading True/False:', e);
        }
      } else if (q.question_type === 'FillIn') {
        isCorrect = studentAnswer.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
        credit = isCorrect ? 1 : 0;
        if (isCorrect) autoQuestionCredits++;
      } else if (q.question_type === 'Essay') {
        hasEssay = true;
        isCorrect = false; // Evaluated manually later
        credit = 0;
      }

      return {
        id: q.id,
        content: q.content,
        options: q.options,
        question_type: q.question_type,
        correct_answer: q.correct_answer,
        student_answer: studentAnswer,
        explanation: q.explanation,
        is_correct: isCorrect,
        credit
      };
    });

    const totalQuestions = exam.question_ids.length;
    const rawScore = (autoQuestionCredits / totalQuestions) * 10;
    const score = parseFloat(rawScore.toFixed(2));
    
    const status = hasEssay ? 'Pending' : 'Graded';
    const gradedScore = hasEssay ? null : score;

    // 5. Insert submission record into database
    const { data: submission, error: subError } = await supabase
      .from('submissions')
      .insert({
        exam_id: examId,
        student_id: studentId,
        answers,
        score, // Stores raw auto-graded score
        correct_count: Math.floor(autoQuestionCredits), // Integer representation of full correct
        status,
        graded_score: gradedScore
      })
      .select()
      .single();

    if (subError) throw subError;

    // 6. Send preliminary or final email report
    let questionReportHtml = '';
    gradingDetails.forEach((q: any, idx: number) => {
      const statusColor = q.question_type === 'Essay' ? '#e2e8f0' : (q.credit >= 1 ? '#16a34a' : (q.credit > 0 ? '#d97706' : '#dc2626'));
      const statusText = q.question_type === 'Essay' ? 'TỰ LUẬN (CHỜ CHẤM)' : (q.credit >= 1 ? 'ĐÚNG' : (q.credit > 0 ? `ĐÚNG PARTIAL (${q.credit*100}%)` : 'SAI'));

      let answerDisplay = q.student_answer;
      if (q.question_type === 'TrueFalse') {
        try {
          const ansObj = typeof q.student_answer === 'string' ? JSON.parse(q.student_answer) : q.student_answer;
          answerDisplay = `a: ${ansObj.a || '-'}, b: ${ansObj.b || '-'}, c: ${ansObj.c || '-'}, d: ${ansObj.d || '-'}`;
        } catch (e) {
          answerDisplay = 'Chưa làm';
        }
      }

      questionReportHtml += `
        <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin-bottom: 15px; background-color: ${q.question_type === 'Essay' ? '#fafafa' : (q.credit >= 1 ? '#f0fdf4' : '#fef2f2')};">
          <p style="margin: 0 0 10px 0;"><strong>Câu ${idx + 1} [${q.question_type}]:</strong> ${q.content}</p>
          <p style="margin: 0 0 5px 0;">
            Đáp án của bạn: <span style="font-weight: bold; color: #4f46e5;">${answerDisplay || 'Không chọn/Chưa viết'}</span> 
            - Kết quả: <span style="font-weight: bold; color: ${statusColor};">${statusText}</span>
          </p>
        </div>
      `;
    });

    const emailSubject = status === 'Pending' 
      ? `[KẾT QUẢ SƠ BỘ] Bài thi: ${exam.title} - ${score} Điểm trắc nghiệm`
      : `[KẾT QUẢ THI] ${exam.title} - ${score} Điểm`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5; text-align: center; margin-bottom: 5px;">Kết Quả Bài Thi</h2>
        <p style="text-align: center; color: #64748b; margin-top: 0;">${status === 'Pending' ? 'Bài thi có câu tự luận, đang chờ giáo viên chấm điểm.' : 'Cảm ơn bạn đã hoàn thành bài thi!'}</p>
        
        <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; border: 1px solid #e2e8f0;">
          <p style="margin: 0 0 10px 0; font-size: 16px;">Học sinh: <strong>${student.name}</strong></p>
          <p style="margin: 0 0 10px 0; font-size: 16px;">Đề thi: <strong>${exam.title}</strong></p>
          <p style="margin: 0 0 10px 0; font-size: 16px;">Môn: <strong>${exam.subjects?.name}</strong></p>
          <hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 15px 0;"/>
          <h1 style="color: #4f46e5; font-size: 48px; margin: 10px 0;">${score} <span style="font-size: 20px; color: #64748b;">/ 10 điểm</span></h1>
          <p style="margin: 0; font-size: 14px; color: #475569;">
            ${status === 'Pending' ? 'Đây là điểm trắc nghiệm tự động sơ bộ. Điểm tự luận sẽ được giáo viên cập nhật sau.' : `Trả lời đúng: <strong>${autoQuestionCredits.toFixed(1)} / ${totalQuestions}</strong> câu.`}
          </p>
        </div>

        <h3 style="color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 30px;">Tóm Tắt Bài Làm</h3>
        ${questionReportHtml}
        
        <p style="color: #64748b; font-size: 12px; margin-top: 30px; text-align: center;">Đây là email tự động từ Hệ thống Thi trực tuyến.</p>
      </div>
    `;

    // Send email async
    sendEmail({
      to: student.email,
      subject: emailSubject,
      html: emailHtml
    }).catch(err => console.error('Lỗi khi gửi email báo điểm:', err));

    revalidatePath('/admin/scores');
    return {
      success: true,
      score,
      status,
      totalQuestions,
      correctCount: parseFloat(autoQuestionCredits.toFixed(2)),
      submissionId: submission.id
    };
  } catch (error: any) {
    console.error('submitExam error:', error);
    return { success: false, error: error.message };
  }
}

// Teacher Manual Grading Action
export async function gradeEssaySubmission(
  submissionId: string,
  essayGrades: Record<string, { score: number; comment?: string }> // score scale of 0 to 1.0 (question weight ratio)
) {
  try {
    // 1. Fetch original submission
    const { data: sub, error: subError } = await supabase
      .from('submissions')
      .select('*, exams(*, subjects(name)), students(*)')
      .eq('id', submissionId)
      .single();

    if (subError) throw subError;

    // 2. Fetch questions
    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('id, content, options, correct_answer, explanation, question_type')
      .in('id', sub.exams.question_ids);

    if (qError) throw qError;

    // 3. Recalculate total score
    let totalCredits = 0;
    const gradingDetails = questions.map((q: any) => {
      const studentAnswer = sub.answers[q.id] || '';
      let credit = 0;

      if (q.question_type === 'MultipleChoice') {
        const isCorrect = studentAnswer.trim().toUpperCase() === q.correct_answer.trim().toUpperCase();
        credit = isCorrect ? 1 : 0;
      } else if (q.question_type === 'TrueFalse') {
        try {
          const correctObj = JSON.parse(q.correct_answer);
          const studentObj = typeof studentAnswer === 'string' ? JSON.parse(studentAnswer) : studentAnswer;
          let tfCorrectCount = 0;
          for (const key of ['a', 'b', 'c', 'd']) {
            if (studentObj?.[key] === correctObj[key]) tfCorrectCount++;
          }
          credit = tfCorrectCount / 4;
        } catch (e) {}
      } else if (q.question_type === 'FillIn') {
        const isCorrect = studentAnswer.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
        credit = isCorrect ? 1 : 0;
      } else if (q.question_type === 'Essay') {
        // Fetch manual grade: score represents 0 to 1.0 question credit
        credit = essayGrades[q.id]?.score || 0;
      }

      totalCredits += credit;

      return {
        id: q.id,
        content: q.content,
        question_type: q.question_type,
        options: q.options,
        correct_answer: q.correct_answer,
        student_answer: studentAnswer,
        explanation: q.explanation,
        credit,
        comment: essayGrades[q.id]?.comment || ''
      };
    });

    const totalQuestions = sub.exams.question_ids.length;
    const finalScore = parseFloat(((totalCredits / totalQuestions) * 10).toFixed(2));

    // 4. Update Database
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        status: 'Graded',
        graded_score: finalScore,
        essay_grades: essayGrades
      })
      .eq('id', submissionId);

    if (updateError) throw updateError;

    // 5. Send final graded email report to student
    let reportHtml = '';
    gradingDetails.forEach((q: any, idx: number) => {
      const isEssay = q.question_type === 'Essay';
      const statusColor = q.credit >= 1 ? '#16a34a' : (q.credit > 0 ? '#d97706' : '#dc2626');
      const statusText = q.credit >= 1 ? 'ĐÚNG' : (q.credit > 0 ? `ĐÚNG MỘT PHẦN (${(q.credit*100).toFixed(0)}%)` : 'SAI');

      let studentAnsDisplay = q.student_answer;
      if (q.question_type === 'TrueFalse') {
        try {
          const ansObj = typeof q.student_answer === 'string' ? JSON.parse(q.student_answer) : q.student_answer;
          studentAnsDisplay = `a: ${ansObj.a || '-'}, b: ${ansObj.b || '-'}, c: ${ansObj.c || '-'}, d: ${ansObj.d || '-'}`;
        } catch (e) {
          studentAnsDisplay = 'Không chọn';
        }
      }

      reportHtml += `
        <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin-bottom: 15px; background-color: ${q.credit >= 1 ? '#f0fdf4' : '#fef2f2'};">
          <p style="margin: 0 0 10px 0;"><strong>Câu ${idx + 1} [${q.question_type}]:</strong> ${q.content}</p>
          <p style="margin: 0 0 5px 0;">Đáp án của bạn: <span style="font-weight: bold; color: #4f46e5;">${studentAnsDisplay || 'Không chọn/Chưa viết'}</span></p>
          <p style="margin: 0 0 5px 0;">Đáp án đúng / hướng dẫn: <span style="font-weight: bold; color: #16a34a;">${q.correct_answer}</span></p>
          <p style="margin: 0 0 5px 0;">
            Kết quả: <span style="font-weight: bold; color: ${statusColor};">${statusText}</span> (Điểm hệ số: ${q.credit.toFixed(2)})
          </p>
          ${isEssay && q.comment ? `<p style="margin: 5px 0; font-size: 13px; color: #b45309;"><strong>Nhận xét của giáo viên:</strong> ${q.comment}</p>` : ''}
          ${q.explanation ? `<p style="margin: 10px 0 0 0; font-size: 13px; color: #475569; border-top: 1px dashed #cbd5e1; padding-top: 5px;"><em>Lời giải:</em> ${q.explanation}</p>` : ''}
        </div>
      `;
    });

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5; text-align: center; margin-bottom: 5px;">Kết Quả Thi Chính Thức</h2>
        <p style="text-align: center; color: #64748b; margin-top: 0;">Giáo viên đã hoàn tất chấm bài thi tự luận của bạn!</p>
        
        <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; border: 1px solid #e2e8f0;">
          <p style="margin: 0 0 10px 0; font-size: 16px;">Học sinh: <strong>${sub.students?.name}</strong></p>
          <p style="margin: 0 0 10px 0; font-size: 16px;">Đề thi: <strong>${sub.exams?.title}</strong></p>
          <p style="margin: 0 0 10px 0; font-size: 16px;">Môn: <strong>${sub.exams?.subjects?.name}</strong></p>
          <hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 15px 0;"/>
          <h1 style="color: #16a34a; font-size: 48px; margin: 10px 0;">${finalScore} <span style="font-size: 20px; color: #64748b;">/ 10 điểm</span></h1>
          <p style="margin: 0; font-size: 14px; color: #475569;">Tổng hệ số câu đúng: <strong>${totalCredits.toFixed(2)} / ${totalQuestions}</strong></p>
        </div>

        <h3 style="color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 30px;">Chi Tiết Chấm Điểm</h3>
        ${reportHtml}
        
        <p style="color: #64748b; font-size: 12px; margin-top: 30px; text-align: center;">Đây là email tự động từ Hệ thống Thi trực tuyến.</p>
      </div>
    `;

    sendEmail({
      to: sub.students?.email,
      subject: `[ĐÃ CHẤM XONG] Kết quả chính thức bài thi ${sub.exams?.title} - ${finalScore} Điểm`,
      html: emailHtml
    }).catch(err => console.error('Lỗi gửi email báo điểm chính thức:', err));

    revalidatePath('/admin/scores');
    return { success: true, finalScore };
  } catch (error: any) {
    console.error('gradeEssaySubmission error:', error);
    return { success: false, error: error.message };
  }
}

// Fetch submissions list for grading dashboard
export async function getSubmissions() {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('*, exams(title, question_ids, subjects(name)), students(name, email, class_id)')
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    
    const { data: studentsData } = await supabase
      .from('students')
      .select('id, classes(name, grade)');
      
    const resolvedData = data.map((sub: any) => {
      const studentClass = studentsData?.find(s => s.id === sub.student_id);
      return {
        ...sub,
        students: {
          ...sub.students,
          classes: studentClass ? studentClass.classes : null
        }
      };
    });

    return { success: true, data: resolvedData };
  } catch (error: any) {
    console.error('getSubmissions error:', error);
    return { success: false, error: error.message };
  }
}

// Fetch a single student's submission details along with exam structure and answer verification
export async function getSubmissionDetails(submissionId: string) {
  try {
    const { data: sub, error: subError } = await supabase
      .from('submissions')
      .select('*, exams(*, subjects(name)), students(*)')
      .eq('id', submissionId)
      .single();

    if (subError) throw subError;

    // Fetch classes name
    const { data: classData } = await supabase
      .from('classes')
      .select('name')
      .eq('id', sub.students.class_id)
      .maybeSingle();

    sub.students.classes = classData || null;

    // Fetch questions to render details
    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('*')
      .in('id', sub.exams.question_ids);

    if (qError) throw qError;

    // Sort questions to match exam sequence
    const sortedQuestions = sub.exams.question_ids.map((id: string) => 
      questions.find((q: any) => q.id === id)
    ).filter(Boolean);

    return { success: true, submission: sub, questions: sortedQuestions };
  } catch (error: any) {
    console.error('getSubmissionDetails error:', error);
    return { success: false, error: error.message };
  }
}

export async function getScoreStatistics() {
  try {
    // 1. Fetch all exams with subjects and classes
    const { data: exams, error: examsError } = await supabase
      .from('exams')
      .select('*, subjects(name), classes(id, name, grade)')
      .order('created_at', { ascending: false });
    if (examsError) throw examsError;

    // 2. Fetch all students count per class
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, class_id');
    if (studentsError) throw studentsError;

    // 3. Fetch all submissions with score and graded_score
    const { data: submissions, error: subsError } = await supabase
      .from('submissions')
      .select('id, exam_id, student_id, score, graded_score, submitted_at');
    if (subsError) throw subsError;

    return {
      success: true,
      exams: exams || [],
      students: students || [],
      submissions: submissions || []
    };
  } catch (error: any) {
    console.error('getScoreStatistics error:', error);
    return { success: false, error: error.message };
  }
}
