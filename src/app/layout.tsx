import type { Metadata } from "next";
import { Spectral, Cinzel, Geist_Mono } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

// Body: a warm book serif, like the copy inside a gameday program.
const bodySerif = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

// Display: engraved Roman capitals — the collegiate "athletic department" mark.
const displaySerif = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

// Mono kept for tabular data (kickoff countdowns, ticket numbers).
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
  const themeScript = `try{var p=${JSON.stringify(themePref)};var t=p||localStorage.getItem('theme');if(t==='dark'){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}if(p){localStorage.setItem('theme',p)}}catch(e){}`;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bodySerif.variable} ${displaySerif.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Apply theme before paint (account pref, else localStorage, else light paper). */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
