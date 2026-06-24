import { redirect } from "next/navigation";
import { auth, googleConfigured } from "@/auth";
import { AuthForm } from "@/components/auth/AuthForm";
import { loginAction, googleSignInAction } from "@/lib/auth-actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  if (await auth()) redirect("/");
  const { reset } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <AuthForm
        mode="login"
        action={loginAction}
        googleAction={googleSignInAction}
        googleConfigured={googleConfigured}
        notice={
          reset === "1"
            ? "Password updated. Log in with your new password."
            : undefined
        }
      />
    </main>
  );
}
