import { useEffect, useState } from "react";
import { getAuditLogs } from "@/lib/audit-api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AuditLog } from "@/types/audit";
import {
  Activity,
  Award,
  Calendar,
  Clock,
  Edit2,
  FilePlus,
  History,
  Link2,
  Link2Off,
  Sliders,
  TrendingUp,
  User,
} from "lucide-react";

export const AuditLogTab = ({ clientId }: { clientId: string }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("ALL");

  useEffect(() => {
    setLoading(true);
    getAuditLogs(clientId)
      .then((res) => {
        setLogs(res.logs);
      })
      .catch((err) => {
        console.error("Failed to load audit logs:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [clientId]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case "CLIENT_CREATE":
        return <FilePlus className="size-4 text-green-500" />;
      case "CLIENT_UPDATE":
        return <Edit2 className="size-4 text-blue-500" />;
      case "METRIC_SCORE_UPDATE":
        return <TrendingUp className="size-4 text-purple-500" />;
      case "MATURITY_RATING_UPDATE":
        return <Award className="size-4 text-orange-500" />;
      case "HEALTH_SNAPSHOT_SUBMIT":
        return <Activity className="size-4 text-rose-500" />;
      case "INTEGRATION_CONNECT":
        return <Link2 className="size-4 text-sky-500" />;
      case "INTEGRATION_DISCONNECT":
        return <Link2Off className="size-4 text-red-500" />;
      case "INTEGRATION_MAPPING_UPDATE":
        return <Sliders className="size-4 text-amber-500" />;
      default:
        return <History className="size-4 text-muted-foreground" />;
    }
  };

  const getActionLabel = (action: string) => {
    return action.replace(/_/g, " ");
  };

  const renderDetails = (log: AuditLog) => {
    try {
      const data = JSON.parse(log.details);
      switch (log.action) {
        case "METRIC_SCORE_UPDATE":
          return (
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>
                Metric: <span className="font-semibold text-foreground">{data.categoryName}</span>
              </p>
              <p>
                Value: <span className="font-medium text-foreground">{data.rawMeasurement}</span> (Score: <span className="font-semibold text-foreground">{data.computedScore}</span>)
              </p>
            </div>
          );
        case "MATURITY_RATING_UPDATE":
          return (
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>
                Dimension: <span className="font-semibold text-foreground">{data.dimension}</span>
              </p>
              <p>
                Level: <span className="font-medium text-foreground">{data.level}</span>
              </p>
              {data.notes && (
                <p className="italic bg-secondary/50 rounded p-1.5 mt-1 border-l-2 border-primary/20">
                  "{data.notes}"
                </p>
              )}
            </div>
          );
        case "HEALTH_SNAPSHOT_SUBMIT":
          return (
            <div className="text-xs text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1 bg-secondary/20 p-2 rounded border border-border/50 max-w-md">
              <p>PV: <span className="font-medium text-foreground">${data.pv?.toLocaleString()}</span></p>
              <p>AC: <span className="font-medium text-foreground">${data.ac?.toLocaleString()}</span></p>
              <p>EV: <span className="font-medium text-foreground">${data.ev?.toLocaleString()}</span></p>
              <p>SPI: <span className="font-medium text-foreground">{data.spi?.toFixed(2)}</span></p>
              <p>CPI: <span className="font-medium text-foreground">{data.cpi?.toFixed(2)}</span></p>
              <p>Scorecard Points: <span className="font-semibold text-foreground">{data.scorecardPoints}</span></p>
            </div>
          );
        case "CLIENT_UPDATE":
          return (
            <div className="text-xs text-muted-foreground space-y-1">
              <span className="font-medium text-foreground block">Modified Fields:</span>
              <ul className="list-disc pl-4 space-y-0.5">
                {Object.entries(data).map(([key, val]) => (
                  <li key={key}>
                    <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}:</span>{" "}
                    <span className="font-semibold text-foreground">{String(val)}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        default:
          return (
            <pre className="text-[10px] font-mono bg-secondary/30 p-2 rounded overflow-x-auto max-w-lg">
              {JSON.stringify(data, null, 2)}
            </pre>
          );
      }
    } catch {
      return <p className="text-xs text-muted-foreground">{log.details}</p>;
    }
  };

  const filteredLogs = logs.filter((log) => {
    const actionMatch = actionFilter === "ALL" || log.action === actionFilter;
    const searchLower = searchTerm.toLowerCase();
    const searchMatch =
      log.user.name.toLowerCase().includes(searchLower) ||
      log.action.toLowerCase().includes(searchLower) ||
      log.details.toLowerCase().includes(searchLower);
    return actionMatch && searchMatch;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="size-5 text-muted-foreground" />
          Audit Trail Log
        </CardTitle>
        <CardDescription>
          Detailed timeline of score modifications, client configuration edits, and sync logs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-end bg-secondary/10 p-4 rounded-xl border border-border/40">
          <div className="flex-1 space-y-1.5 w-full">
            <Label htmlFor="auditSearch" className="text-xs font-semibold text-muted-foreground">Search logs</Label>
            <Input
              id="auditSearch"
              placeholder="Filter by user, action, details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-background"
            />
          </div>
          <div className="w-full md:w-60 space-y-1.5">
            <Label htmlFor="auditFilter" className="text-xs font-semibold text-muted-foreground">Action type</Label>
            <Select value={actionFilter} onValueChange={(val) => setActionFilter(val ?? "ALL")}>
              <SelectTrigger id="auditFilter" className="bg-background">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Actions</SelectItem>
                <SelectItem value="CLIENT_CREATE">Client Creation</SelectItem>
                <SelectItem value="CLIENT_UPDATE">Client Updates</SelectItem>
                <SelectItem value="METRIC_SCORE_UPDATE">Quantitative Scores</SelectItem>
                <SelectItem value="MATURITY_RATING_UPDATE">Maturity Ratings</SelectItem>
                <SelectItem value="HEALTH_SNAPSHOT_SUBMIT">Health Snapshots</SelectItem>
                <SelectItem value="INTEGRATION_CONNECT">Integrations Connected</SelectItem>
                <SelectItem value="INTEGRATION_MAPPING_UPDATE">Field Mappings</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Timeline */}
        {filteredLogs.length === 0 ? (
          <div className="text-center py-10 border border-dashed rounded-xl">
            <p className="text-sm text-muted-foreground">No matching audit logs found.</p>
          </div>
        ) : (
          <div className="relative pl-6 border-l-2 border-muted/50 ml-3 space-y-6">
            {filteredLogs.map((log) => (
              <div key={log.id} className="relative group">
                {/* Timeline Icon Marker */}
                <div className="absolute -left-[35px] top-1 bg-background border-2 border-muted-foreground/30 rounded-full p-1.5 group-hover:border-primary transition-colors">
                  {getActionIcon(log.action)}
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
                      {getActionLabel(log.action)}
                    </span>
                    <span className="text-xs font-medium text-foreground flex items-center gap-1">
                      <User className="size-3 text-muted-foreground" /> {log.user.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground/80 flex items-center gap-1 ml-auto">
                      <Calendar className="size-3" /> {new Date(log.createdAt).toLocaleDateString()}
                      <Clock className="size-3 ml-1" /> {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="pl-1.5 bg-background border-l-4 border-border p-3 rounded-r-xl shadow-xs border-y border-r hover:border-primary/20 transition-colors">
                    {renderDetails(log)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
