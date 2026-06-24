import { redirect } from "next/navigation";
import { auth, googleConfigured } from "@/auth";
import { AuthForm } from "@/components/auth/AuthForm";
import { signupAction, googleSignInAction } from "@/lib/auth-actions";

export default async function SignupPage() {
  if (await auth()) redirect("/");

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <AuthForm
        mode="signup"
        action={signupAction}
        googleAction={googleSignInAction}
        googleConfigured={googleConfigured}
      />
    </main>
  );
}
