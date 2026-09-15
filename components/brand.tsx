import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function Brand() {
  return <div className="brand-controls"><Link href="/" className="brand" aria-label="Certi home">certi<span>_</span><span className="brand-dot" /></Link><ThemeToggle /></div>;
}
