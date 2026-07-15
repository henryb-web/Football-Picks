import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Page, PageHeader } from "@/components/ui/Page";
import {
  ProfileForm,
  PasswordForm,
  AvatarForm,
  PreferencesForm,
  DeleteAccount,
} from "./forms";

function Section({
  title,
  desc,
  danger,
  children,
}: {
  title: string;
  desc?: string;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={`rounded-xl border bg-card p-5 ${danger ? "border-red-500/40" : "border-cardborder"}`}
    >
      <h2 className="headline text-lg">{title}</h2>
      {desc ? <p className="mt-0.5 text-xs text-muted">{desc}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  const displayName = user.username ?? user.name ?? user.email ?? "You";

  return (
    <Page>
      <PageHeader title="Account" />
      <div className="space-y-4">
        <Section title="Avatar" desc="How you appear across the app.">
          <AvatarForm
            name={displayName}
            image={user.image}
            emoji={user.avatarEmoji}
            color={user.avatarColor}
          />
        </Section>
        <Section title="Profile" desc="Your display name and username.">
          <ProfileForm name={user.name ?? ""} username={user.username ?? ""} />
        </Section>
        <Section title="Password">
          <PasswordForm hasPassword={Boolean(user.passwordHash)} />
        </Section>
        <Section title="Preferences" desc="Theme and time zone.">
          <PreferencesForm
            theme={user.themePref ?? ""}
            timezone={user.timezone ?? ""}
          />
        </Section>
        <Section title="Delete account" danger desc="This can't be undone.">
          <DeleteAccount />
        </Section>
      </div>
    </Page>
  );
}
