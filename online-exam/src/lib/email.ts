import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 'temp_key');

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  if (!apiKey || apiKey.startsWith('re_your_api_key')) {
    console.log('==================================================');
    console.log('📧 PHÁT HIỆN GỬI EMAIL (MÔ PHỎNG - CHƯA CÓ API KEY):');
    console.log(`Gửi đến: ${to}`);
    console.log(`Tiêu đề: ${subject}`);
    console.log(`Nội dung (HTML):`);
    console.log(html);
    console.log('==================================================');
    return { success: true, id: 'mock-id-' + Math.random().toString(36).substr(2, 9) };
  }

  try {
    const response = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });

    if (response.error) {
      console.error('Lỗi gửi email Resend API:', response.error);
      return { success: false, error: response.error };
    }

    return { success: true, id: response.data?.id };
  } catch (err: any) {
    console.error('Lỗi bất ngờ khi gửi email:', err);
    return { success: false, error: err.message };
  }
}
