import { LogoutButton } from "@/components/logout-button";
import Link from "next/link";
import { AccountIcon } from "@/components/account-icon";
export const metadata = { title: "Log out | CertiBlank" };
export default function Logout() {
  return <section className="auth-card auth-transition"><div className="auth-transition-symbol"><AccountIcon name="shield" /></div><h1>See you next session.</h1><p>Ready to log out? Your practice history will be here when you return.</p><LogoutButton /><Link className="auth-cancel" href="/account">Stay signed in</Link></section>;
}
