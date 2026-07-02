import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { listUsers, updateUserRole, type UserDetail } from "@/lib/user-api";
import { ApiError } from "@/lib/api";
import { toast } from "sonner";
import { Shield, Search, Users } from "lucide-react";

export const AdminUserManagementPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserDetail[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = () => {
    setError(null);
    listUsers()
      .then((res) => setUsers(res.users))
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Failed to load users.");
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: "VIEWER" | "SCORER" | "ADMIN") => {
    setUpdatingId(userId);
    try {
      const res = await updateUserRole(userId, newRole);
      toast.success(`Role for ${res.user.name} successfully updated to ${newRole}`);
      setUsers((prev) =>
        prev ? prev.map((u) => (u.id === userId ? res.user : u)) : null
      );
    } catch (err: any) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update role");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="User Management"
        description="Allocate access roles and manage user accounts."
      />

      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search users by name or email…"
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {users === null && !error ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <Users className="size-10 mb-2 stroke-1" />
            <h4 className="font-semibold text-foreground">No users found</h4>
            <p className="text-xs max-w-xs mt-1">
              {search
                ? "No accounts match your current search term."
                : "No other user accounts found in system."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User Details</TableHead>
              <TableHead>Joined Date</TableHead>
              <TableHead>Current Role</TableHead>
              <TableHead className="w-48 text-right">Modify Access Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((u) => {
              const isSelf = u.id === currentUser?.id;
              const isUpdating = updatingId === u.id;

              return (
                <TableRow key={u.id} className={isSelf ? "bg-muted/10" : ""}>
                  <TableCell>
                    <div>
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        {u.name}
                        {isSelf && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1 border-primary/20 text-primary">
                            You
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(u.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Shield className={`size-3.5 ${
                        u.role === "ADMIN"
                          ? "text-red-500"
                          : u.role === "SCORER"
                            ? "text-blue-500"
                            : "text-muted-foreground"
                      }`} />
                      <span className="text-xs font-semibold uppercase">{u.role}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <select
                      className="text-xs border rounded-md p-1 bg-background text-foreground focus:ring-1 focus:ring-primary disabled:opacity-50 font-medium"
                      value={u.role}
                      disabled={isSelf || isUpdating}
                      onChange={(e) =>
                        handleRoleChange(
                          u.id,
                          e.target.value as "VIEWER" | "SCORER" | "ADMIN"
                        )
                      }
                    >
                      <option value="VIEWER">Viewer</option>
                      <option value="SCORER">Scorer</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
