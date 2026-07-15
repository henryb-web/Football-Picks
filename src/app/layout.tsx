import type { Metadata } from "next";
import { Geist, Geist_Mono, Oswald } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Condensed athletic display face for headlines, scores, and big numbers.
const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PickSix",
  description: "Make picks on NFL, college, and Texas 6A high school football games.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // A logged-in user's saved theme wins over the per-device localStorage value,
  // so it follows them across devices. Guarded so a DB hiccup can't blank the app.
  let themePref: string | null = null;
  try {
    const session = await auth();
    if (session?.user?.id) {
      const u = await db.user.findUnique({
        where: { id: session.user.id },
        select: { themePref: true },
      });
      themePref = u?.themePref ?? null;
    }
  } catch {
    /* ignore */
  }
  const themeScript = `try{var p=${JSON.stringify(themePref)};var t=p||localStorage.getItem('theme');if(t==='light'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}if(p){localStorage.setItem('theme',p)}}catch(e){}`;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${oswald.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Apply theme before paint (account pref, else localStorage, else dark). */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
