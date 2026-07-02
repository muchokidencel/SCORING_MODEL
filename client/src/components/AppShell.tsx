import { NavLink, Outlet } from "react-router-dom";
import { Users, Activity, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

export const AppShell = () => {
  const { user, logout } = useAuth();

  const navItems = [{ to: "/clients", label: "Clients", icon: Users }];

  if (user?.role === "ADMIN") {
    navItems.push({ to: "/admin/health", label: "System Health", icon: Activity });
    navItems.push({ to: "/admin/users", label: "User Management", icon: UserCog });
  }

  return (
    <div className="flex min-h-svh">
      <aside className="flex w-56 shrink-0 flex-col border-r bg-card">
        <div className="px-4 py-5">
          <span className="text-sm font-bold tracking-tight">COSEKE Scoring Model</span>
        </div>
        <nav className="flex flex-col gap-1 px-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-card px-6 py-3">
          <div />
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              {user?.name} · {user?.role}
            </span>
            <Button variant="outline" size="sm" onClick={logout}>
              Log out
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
