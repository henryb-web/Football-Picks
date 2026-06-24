// Shared type for auth server-action results. Kept out of the "use server"
// module because those files may only export async functions.
export type AuthState = { error?: string } | undefined;
