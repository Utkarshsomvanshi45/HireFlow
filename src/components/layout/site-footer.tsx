import { Link } from "@tanstack/react-router";
import { Workflow } from "lucide-react";

const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "Find Jobs", to: "/jobs" },
      { label: "For Employers", to: "/employer" },
      { label: "Create Account", to: "/register" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About HireFlow", to: "/" },
      { label: "How It Works", to: "/" },
      { label: "Careers", to: "/jobs" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", to: "/" },
      { label: "Contact", to: "/" },
      { label: "Sign In", to: "/login" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2.5" aria-label="HireFlow home">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Workflow className="size-4.5" aria-hidden />
              </span>
              <span className="font-display text-lg font-semibold tracking-tight">HireFlow</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              From application to opportunity. A hiring platform that connects
              great teams with great candidates.
            </p>
          </div>
          {footerColumns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h3 className="text-sm font-semibold">{column.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} HireFlow. All rights reserved.</p>
          <p>Prototype build — product statistics and listings are sample data.</p>
        </div>
      </div>
    </footer>
  );
}
