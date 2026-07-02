import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { submitHealthSnapshot } from "@/lib/health-api";
import { cpi, progressScorecard, spi } from "@/lib/health-formula";
import { queueOfflineRequest } from "@/lib/offlineSync";

interface FormState {
  pv: string;
  ac: string;
  ev: string;
  clientSignoff: boolean;
  resourceUtilizationPercent: string;
}

const initialState: FormState = {
  pv: "",
  ac: "",
  ev: "",
  clientSignoff: false,
  resourceUtilizationPercent: "",
};

const toNumber = (value: string) => (value.trim() === "" ? NaN : Number(value));

export const ProjectHealthForm = ({
  clientId,
  onSaved,
}: {
  clientId: string;
  onSaved: () => void;
}) => {
  const [form, setForm] = useState<FormState>(initialState);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pvNum = toNumber(form.pv);
  const acNum = toNumber(form.ac);
  const evNum = toNumber(form.ev);
  const utilizationFraction = toNumber(form.resourceUtilizationPercent) / 100;

  const inputsValid =
    Number.isFinite(pvNum) &&
    pvNum >= 0 &&
    Number.isFinite(acNum) &&
    acNum >= 0 &&
    Number.isFinite(evNum) &&
    evNum >= 0 &&
    Number.isFinite(utilizationFraction) &&
    utilizationFraction >= 0 &&
    utilizationFraction <= 1;

  const preview = inputsValid
    ? (() => {
        const spiValue = spi(evNum, pvNum);
        const cpiValue = cpi(evNum, acNum);
        return {
          spiValue,
          cpiValue,
          scorecard: progressScorecard({
            spiValue,
            cpiValue,
            signoff: form.clientSignoff,
            resourceUtilization: utilizationFraction,
          }),
        };
      })()
    : null;

  const handleSubmit = async () => {
    if (!inputsValid) {
      setError("Enter valid non-negative PV/AC/EV and a utilization between 0-100%");
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await submitHealthSnapshot(clientId, {
        pv: pvNum,
        ac: acNum,
        ev: evNum,
        clientSignoff: form.clientSignoff,
        resourceUtilization: utilizationFraction,
      });
      setForm(initialState);
      onSaved();
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        queueOfflineRequest(
          `/clients/${clientId}/health-snapshots`,
          "POST",
          {
            pv: pvNum,
            ac: acNum,
            ev: evNum,
            clientSignoff: form.clientSignoff,
            resourceUtilization: utilizationFraction,
          },
          `Submit Health snapshot (PV: $${pvNum.toLocaleString()}, AC: $${acNum.toLocaleString()}, EV: $${evNum.toLocaleString()})`
        );
        setForm(initialState);
        onSaved();
      } else {
        setError(err instanceof ApiError ? err.message : "Failed to save snapshot.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="pv">Planned Value (PV)</FieldLabel>
            <Input
              id="pv"
              type="number"
              value={form.pv}
              onChange={(e) => setForm((f) => ({ ...f, pv: e.target.value }))}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="ac">Actual Cost (AC)</FieldLabel>
            <Input
              id="ac"
              type="number"
              value={form.ac}
              onChange={(e) => setForm((f) => ({ ...f, ac: e.target.value }))}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="ev">Earned Value (EV)</FieldLabel>
            <Input
              id="ev"
              type="number"
              value={form.ev}
              onChange={(e) => setForm((f) => ({ ...f, ev: e.target.value }))}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="utilization">Resource utilization %</FieldLabel>
            <Input
              id="utilization"
              type="number"
              min={0}
              max={100}
              value={form.resourceUtilizationPercent}
              onChange={(e) =>
                setForm((f) => ({ ...f, resourceUtilizationPercent: e.target.value }))
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="signoff">Client signoff</FieldLabel>
            <label className="flex h-8 items-center gap-2 text-sm">
              <input
                id="signoff"
                type="checkbox"
                checked={form.clientSignoff}
                onChange={(e) => setForm((f) => ({ ...f, clientSignoff: e.target.checked }))}
              />
              Signed off this period
            </label>
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/50 p-3 text-sm">
          <span className="text-muted-foreground">Live preview:</span>
          <Badge variant="secondary">SPI {preview ? preview.spiValue.toFixed(3) : "—"}</Badge>
          <Badge variant="secondary">CPI {preview ? preview.cpiValue.toFixed(3) : "—"}</Badge>
          <Badge>{preview ? `${preview.scorecard}/100` : "—/100"}</Badge>
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex justify-end">
          <Button disabled={isSaving} onClick={handleSubmit}>
            {isSaving ? "Saving…" : "Save snapshot"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
