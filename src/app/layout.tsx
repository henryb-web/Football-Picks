import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono, Oswald } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

// Body: a clean neutral grotesque — the broadcast "chyron" copy face.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Mono for tabular data (kickoff countdowns, scores).
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display: condensed athletic capitals — jerseys, scoreboards, lower-thirds.
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
  let dbSkin: string | null = null;
  try {
    const session = await auth();
    if (session?.user?.id) {
      const u = await db.user.findUnique({
        where: { id: session.user.id },
        select: { themePref: true, skin: true },
      });
      themePref = u?.themePref ?? null;
      dbSkin = u?.skin ?? null;
    }
  } catch {
    /* ignore */
  }
  const themeScript = `try{var p=${JSON.stringify(themePref)};var t=p||localStorage.getItem('theme');if(t==='light'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}if(p){localStorage.setItem('theme',p)}}catch(e){}`;

  // Visual skin: a logged-in user's saved choice (dbSkin) follows them across
  // devices; otherwise fall back to the per-device `skin` cookie. "rip" opts
  // into The Rip look, anything else stays on the default Broadcast Booth.
  // Rendered server-side so the class is present before first paint (no flash).
  const cookieSkin = (await cookies()).get("skin")?.value ?? null;
  const skinClass = (dbSkin ?? cookieSkin) === "rip" ? "skin-rip" : "";

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${oswald.variable} ${skinClass} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Apply theme before paint (account pref, else localStorage, else dark booth). */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
