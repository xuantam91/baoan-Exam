import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hệ thống Thi trắc nghiệm trực tuyến - BaoAn Exam",
  description: "Hệ thống thi trắc nghiệm trực tuyến cho giáo viên, học sinh và phụ huynh",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        {/* Prevent FOUC: apply stored theme before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                // Apply dark/light mode
                const saved = localStorage.getItem('theme');
                const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (saved === 'dark' || (!saved && systemDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
                // Apply color theme (only in light mode)
                var colorTheme = localStorage.getItem('colorTheme');
                var isDark = document.documentElement.classList.contains('dark');
                if (!isDark && colorTheme && colorTheme !== 'indigo') {
                  document.documentElement.classList.add('theme-' + colorTheme);
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
