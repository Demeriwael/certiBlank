import { LogoutButton } from "@/components/logout-button";
export default function Logout() {
  return <section className="auth-card"><h1>Log out of CertiBlank?</h1><p>Your account history stays saved. You can still practice without an account.</p><LogoutButton /></section>;
}
