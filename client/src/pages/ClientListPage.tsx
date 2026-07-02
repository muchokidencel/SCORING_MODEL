import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/auth-context";
import { listClients } from "@/lib/clients-api";
import { ApiError } from "@/lib/api";
import type { Client } from "@/types/client";

export const ClientListPage = () => {
  const { user } = useAuth();
  const canCreate = user?.role === "SCORER" || user?.role === "ADMIN";

  const [clients, setClients] = useState<Client[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    let cancelled = false;
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const res = await listClients(search || undefined);
        if (!cancelled) {
          setClients(res.clients);
          setCurrentPage(1); // reset to page 1 on new search
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load clients.");
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  const totalClients = clients?.length ?? 0;
  const paginatedClients = clients
    ? clients.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clients"
        description="Every client onboarded for scoring."
        actions={
          canCreate && (
            <Button render={<Link to="/clients/new" />} nativeButton={false}>
              <Plus />
              New client
            </Button>
          )
        }
      />

      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search clients…"
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

      {clients === null && !error ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : clients && clients.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
            <EmptyTitle>{search ? "No clients match your search" : "No clients yet"}</EmptyTitle>
            <EmptyDescription>
              {search
                ? "Try a different name."
                : canCreate
                  ? "Add your first client to start scoring."
                  : "Ask a scorer or admin to add the first client."}
            </EmptyDescription>
          </EmptyHeader>
          {canCreate && !search && (
            <Button render={<Link to="/clients/new" />} nativeButton={false}>
              <Plus />
              New client
            </Button>
          )}
        </Empty>
      ) : clients ? (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Account manager</TableHead>
                <TableHead>Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Link to={`/clients/${client.id}`} className="font-medium hover:underline">
                      {client.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={client.status === "ACTIVE" ? "default" : "secondary"}>
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.accountManager ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{client.contactEmail ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalClients > pageSize && (
            <div className="flex items-center justify-between mt-4 bg-muted/20 p-3 rounded-lg border text-sm">
              <div className="text-muted-foreground">
                Showing {Math.min((currentPage - 1) * pageSize + 1, totalClients)} to{" "}
                {Math.min(currentPage * pageSize, totalClients)} of {totalClients} clients
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage * pageSize >= totalClients}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};
