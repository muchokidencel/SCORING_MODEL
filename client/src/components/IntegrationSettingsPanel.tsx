import { useEffect, useState } from "react";
import {
  connectIntegration,
  disconnectIntegration,
  getIntegration,
  saveIntegrationMapping,
  simulateIntegrationError,
  syncIntegration,
} from "@/lib/integration-api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Link2,
  Link2Off,
  RefreshCw,
  Trash2,
} from "lucide-react";
import type { IntegrationConfig, SimulatedErrorType } from "@/types/integration";
import { ApiError } from "@/lib/api";

export const IntegrationSettingsPanel = ({ clientId }: { clientId: string }) => {
  const [config, setConfig] = useState<IntegrationConfig | null>(null);
  const [simulatedError, setSimulatedError] = useState<SimulatedErrorType>("NONE");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Connection Dialog
  const [connDialogOpen, setConnDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<"JIRA" | "ASANA" | null>(null);
  const [authCode, setAuthCode] = useState("");

  // Mapping Form State
  const [pvField, setPvField] = useState("pv");
  const [acField, setAcField] = useState("ac");
  const [evField, setEvField] = useState("ev");
  const [jiraProjectKey, setJiraProjectKey] = useState("");
  const [asanaWorkspaceId, setAsanaWorkspaceId] = useState("");

  const loadData = () => {
    setLoading(true);
    getIntegration(clientId)
      .then((res) => {
        setConfig(res.config);
        setSimulatedError(res.simulatedError);
        if (res.config) {
          setPvField(res.config.pvField);
          setAcField(res.config.acField);
          setEvField(res.config.evField);
          setJiraProjectKey(res.config.jiraProjectKey ?? "");
          setAsanaWorkspaceId(res.config.asanaWorkspaceId ?? "");
        }
      })
      .catch((err) => {
        console.error("Failed to load integrations config:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [clientId]);

  const handleConnect = async () => {
    if (!selectedProvider || !authCode) {
      toast.error("Please enter authorization code");
      return;
    }
    setConnecting(true);
    try {
      const res = await connectIntegration(clientId, selectedProvider, authCode);
      setConfig(res.config);
      setConnDialogOpen(false);
      setAuthCode("");
      toast.success(`Successfully connected to ${selectedProvider}!`);
      loadData();
    } catch (err: any) {
      toast.error(err instanceof ApiError ? err.message : "Connection failed");
    } finally {
      setConnecting(false);
    }
  };

  const handleSaveMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await saveIntegrationMapping(clientId, {
        pvField,
        acField,
        evField,
        jiraProjectKey: config?.provider === "JIRA" ? jiraProjectKey : undefined,
        asanaWorkspaceId: config?.provider === "ASANA" ? asanaWorkspaceId : undefined,
      });
      setConfig(res.config);
      toast.success("Field mapping saved successfully!");
    } catch (err: any) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save mapping");
    } finally {
      setSaving(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const res = await syncIntegration(clientId);
      setConfig(res.config);
      toast.success("Sync completed and health snapshot recorded!");
      loadData();
    } catch (err: any) {
      toast.error(err instanceof ApiError ? err.message : "Sync failed");
      // Reload config status because sync failure updates the status in DB
      getIntegration(clientId)
        .then((res) => {
          setConfig(res.config);
          setSimulatedError(res.simulatedError);
        })
        .catch(console.error);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectIntegration(clientId);
      setConfig(null);
      setSimulatedError("NONE");
      toast.success("Integration disconnected successfully.");
    } catch (err: any) {
      toast.error(err instanceof ApiError ? err.message : "Disconnect failed");
    }
  };

  const handleSimulateError = async (errorType: SimulatedErrorType) => {
    try {
      const res = await simulateIntegrationError(clientId, errorType);
      setSimulatedError(res.simulatedError);
      toast.success(`Simulated error state set to: ${errorType}`);
    } catch (err: any) {
      toast.error("Failed to set simulated error");
    }
  };

  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  const isTokenExpired =
    config?.lastSyncError?.toLowerCase().includes("expired") ||
    simulatedError === "TOKEN_EXPIRED";

  return (
    <div className="space-y-6">
      {/* 1. Expired Token Banner Alert */}
      {config && isTokenExpired && (
        <div className="flex gap-3 items-start rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive animate-pulse">
          <AlertTriangle className="size-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold mb-0.5">OAuth Token Expired / Reconnect Required</h4>
            <p className="text-xs text-destructive/90 leading-relaxed mb-2.5">
              The connected {config.provider} authentication credentials have expired or been revoked. 
              The automated sync task will fail until the connection is re-established.
            </p>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                setSelectedProvider(config.provider);
                setConnDialogOpen(true);
              }}
            >
              Reconnect Connection
            </Button>
          </div>
        </div>
      )}

      {/* 2. Connection Form or Settings Grid */}
      {!config ? (
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="text-center py-10">
            <Link2Off className="size-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle>Connect Project Management Tool</CardTitle>
            <CardDescription>
              Sync project Planning and Cost metrics (PV, AC, EV) directly from Jira or Asana.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-4 pb-10">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedProvider("JIRA");
                setConnDialogOpen(true);
              }}
            >
              Connect to Jira
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedProvider("ASANA");
                setConnDialogOpen(true);
              }}
            >
              Connect to Asana
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Mapping settings form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{config.provider} Sync & Field Mapping</CardTitle>
              <CardDescription>
                Map Jira Project Fields or Asana Task Fields to EVM Health Metrics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveMapping} className="space-y-4">
                {config.provider === "JIRA" ? (
                  <div className="space-y-2">
                    <Label htmlFor="jiraProjectKey">Jira Project Key</Label>
                    <Input
                      id="jiraProjectKey"
                      placeholder="e.g. COSEKE"
                      value={jiraProjectKey}
                      onChange={(e) => setJiraProjectKey(e.target.value)}
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="asanaWorkspaceId">Asana Workspace ID</Label>
                    <Input
                      id="asanaWorkspaceId"
                      placeholder="e.g. 12015383"
                      value={asanaWorkspaceId}
                      onChange={(e) => setAsanaWorkspaceId(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="pvField">Planned Value (PV) Field</Label>
                    <Input
                      id="pvField"
                      placeholder="e.g. customfield_1001"
                      value={pvField}
                      onChange={(e) => setPvField(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="acField">Actual Cost (AC) Field</Label>
                    <Input
                      id="acField"
                      placeholder="e.g. customfield_1002"
                      value={acField}
                      onChange={(e) => setAcField(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="evField">Earned Value (EV) Field</Label>
                    <Input
                      id="evField"
                      placeholder="e.g. customfield_1003"
                      value={evField}
                      onChange={(e) => setEvField(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Mappings"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSyncNow}
                    disabled={syncing}
                  >
                    <RefreshCw className={`size-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
                    {syncing ? "Syncing..." : "Sync Now"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Sync status and controls panel */}
          <Card>
            <CardHeader>
              <CardTitle>Sync Health</CardTitle>
              <CardDescription>Status and integration statistics.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground">Status</span>
                {config.lastSyncStatus === "SUCCESS" && (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20 font-semibold gap-1">
                    <CheckCircle2 className="size-3.5" /> Healthy
                  </Badge>
                )}
                {config.lastSyncStatus === "FAILED" && (
                  <Badge className="bg-red-500/10 text-red-600 border-red-500/20 font-semibold gap-1">
                    <AlertTriangle className="size-3.5" /> Sync Error
                  </Badge>
                )}
                {config.lastSyncStatus === "SYNCING" && (
                  <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-semibold animate-pulse">
                    Syncing
                  </Badge>
                )}
                {!config.lastSyncStatus && <Badge variant="secondary">Never Synced</Badge>}
              </div>

              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground">Connected Integration</span>
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <Link2 className="size-4 text-primary" /> {config.provider}
                </span>
              </div>

              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground">Last Synced</span>
                <span className="font-medium text-foreground">
                  {config.lastSyncedAt
                    ? new Date(config.lastSyncedAt).toLocaleString()
                    : "—"}
                </span>
              </div>

              {config.lastSyncError && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-destructive text-xs">
                  <span className="font-semibold block mb-0.5">Error Log:</span>
                  {config.lastSyncError}
                </div>
              )}

              <Button
                variant="destructive"
                className="w-full mt-4"
                onClick={handleDisconnect}
              >
                <Trash2 className="size-4 mr-2" /> Disconnect Provider
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3. Developer Mock Tooling panel */}
      {config && (
        <Card className="border-dashed">
          <CardHeader className="flex flex-row items-center gap-2">
            <Cpu className="size-5 text-muted-foreground" />
            <div>
              <CardTitle>Developer Simulator Tools</CardTitle>
              <CardDescription>
                Simulate different integration failure modes to verify resilient UI recovery.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button
              variant={simulatedError === "TOKEN_EXPIRED" ? "default" : "outline"}
              onClick={() => handleSimulateError("TOKEN_EXPIRED")}
              size="sm"
            >
              Simulate Expired Token
            </Button>
            <Button
              variant={simulatedError === "RATE_LIMIT" ? "default" : "outline"}
              onClick={() => handleSimulateError("RATE_LIMIT")}
              size="sm"
            >
              Simulate Rate Limit
            </Button>
            <Button
              variant={simulatedError === "PERMISSION_DENIED" ? "default" : "outline"}
              onClick={() => handleSimulateError("PERMISSION_DENIED")}
              size="sm"
            >
              Simulate 403 Forbidden
            </Button>
            <Button
              variant={simulatedError === "NONE" ? "default" : "outline"}
              onClick={() => handleSimulateError("NONE")}
              size="sm"
            >
              Reset Error Simulator
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Connection Wizard Modal */}
      <Dialog open={connDialogOpen} onOpenChange={setConnDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect to {selectedProvider}</DialogTitle>
            <DialogDescription>
              Enter the OAuth authentication token or authorization code to establish connection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-2">
            <div className="space-y-2">
              <Label htmlFor="authCode">OAuth Auth Code</Label>
              <Input
                id="authCode"
                placeholder="e.g. JIRA_TEMP_AUTH_CODE"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                In developer mock mode, enter any non-empty string.
              </p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button onClick={handleConnect} disabled={connecting}>
              {connecting ? "Connecting..." : "Establish Connection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
