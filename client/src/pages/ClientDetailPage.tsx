import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QuantitativeScoringForm } from "@/components/QuantitativeScoringForm";
import { QualitativeRatingForm } from "@/components/QualitativeRatingForm";
import { CompositeScoreCard } from "@/components/CompositeScoreCard";
import { ProjectHealthPanel } from "@/components/ProjectHealthPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardTab } from "@/components/DashboardTab";
import { IntegrationSettingsPanel } from "@/components/IntegrationSettingsPanel";
import { AuditLogTab } from "@/components/AuditLogTab";
import { useAuth } from "@/context/auth-context";
import { deleteClient, getClient } from "@/lib/clients-api";
import { ApiError } from "@/lib/api";
import type { Client } from "@/types/client";

export const ClientDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = user?.role === "SCORER" || user?.role === "ADMIN";
  const canDelete = user?.role === "ADMIN";

  const [client, setClient] = useState<Client | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scoreRefreshKey, setScoreRefreshKey] = useState(0);
  const bumpScoreRefresh = () => setScoreRefreshKey((k) => k + 1);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getClient(id)
      .then((res) => {
        if (!cancelled) setClient(res.client);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load client.");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    await deleteClient(id);
    navigate("/clients");
  };

  if (error) {
    return <p role="alert" className="text-sm text-destructive">{error}</p>;
  }

  if (!client) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={client.name}
        description={`Onboarded ${client.onboardedAt ? new Date(client.onboardedAt).toLocaleDateString() : "date unknown"}`}
        actions={
          <>
            {canEdit && (
              <Button variant="outline" render={<Link to={`/clients/${client.id}/edit`} />} nativeButton={false}>
                <Pencil />
                Edit
              </Button>
            )}
            {canDelete && (
              <Dialog>
                <DialogTrigger render={<Button variant="destructive" />}>
                  <Trash2 />
                  Delete
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete {client.name}?</DialogTitle>
                    <DialogDescription>
                      This permanently removes the client and cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
                    <Button variant="destructive" onClick={handleDelete}>
                      Delete client
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="scoring">Scoring</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          {canDelete && <TabsTrigger value="audit">Audit Logs</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="mt-1">
                    <Badge variant={client.status === "ACTIVE" ? "default" : "secondary"}>
                      {client.status}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Account manager</dt>
                  <dd className="mt-1">{client.accountManager ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Contact email</dt>
                  <dd className="mt-1">{client.contactEmail ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Client since</dt>
                  <dd className="mt-1">
                    {new Date(client.createdAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scoring">
          <div className="flex flex-col gap-6">
            <CompositeScoreCard clientId={client.id} refreshKey={scoreRefreshKey} />
            <div>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">Quantitative metrics</h2>
              <QuantitativeScoringForm clientId={client.id} onSaved={bumpScoreRefresh} />
            </div>
            <div>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">Qualitative maturity</h2>
              <QualitativeRatingForm clientId={client.id} onSaved={bumpScoreRefresh} />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="health">
          <ProjectHealthPanel clientId={client.id} />
        </TabsContent>
        <TabsContent value="dashboard">
          <DashboardTab clientId={client.id} />
        </TabsContent>
        <TabsContent value="integrations">
          <IntegrationSettingsPanel clientId={client.id} />
        </TabsContent>
        {canDelete && (
          <TabsContent value="audit">
            <AuditLogTab clientId={client.id} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
