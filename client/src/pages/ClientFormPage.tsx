import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient, getClient, updateClient } from "@/lib/clients-api";
import { ApiError } from "@/lib/api";

const clientFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  contactEmail: z.union([z.string().email("Enter a valid email"), z.literal("")]),
  accountManager: z.string(),
  onboardedAt: z.string(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

const defaultValues: ClientFormValues = {
  name: "",
  status: "ACTIVE",
  contactEmail: "",
  accountManager: "",
  onboardedAt: "",
};

export const ClientFormPage = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const [isLoadingClient, setIsLoadingClient] = useState(isEditing);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({ resolver: zodResolver(clientFormSchema), defaultValues });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getClient(id)
      .then(({ client }) => {
        if (cancelled) return;
        reset({
          name: client.name,
          status: client.status,
          contactEmail: client.contactEmail ?? "",
          accountManager: client.accountManager ?? "",
          onboardedAt: client.onboardedAt ? client.onboardedAt.slice(0, 10) : "",
        });
        setIsLoadingClient(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof ApiError ? err.message : "Failed to load client.");
        setIsLoadingClient(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, reset]);

  const onSubmit = async (values: ClientFormValues) => {
    setSubmitError(null);
    try {
      if (isEditing && id) {
        await updateClient(id, values);
        navigate(`/clients/${id}`);
      } else {
        const { client } = await createClient(values);
        navigate(`/clients/${client.id}`);
      }
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    }
  };

  if (loadError) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {loadError}
      </p>
    );
  }

  if (isLoadingClient) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Edit client" />
        <Card className="max-w-lg">
          <CardContent>
            <div className="flex flex-col gap-4">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={isEditing ? "Edit client" : "New client"} />

      <Card className="max-w-lg">
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input id="name" aria-invalid={!!errors.name} {...register("name")} />
                <FieldError errors={errors.name ? [errors.name] : undefined} />
              </Field>

              <Field>
                <FieldLabel htmlFor="status">Status</FieldLabel>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="status" className="w-full">
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>

              <Field data-invalid={!!errors.contactEmail}>
                <FieldLabel htmlFor="contactEmail">Contact email</FieldLabel>
                <Input
                  id="contactEmail"
                  type="email"
                  aria-invalid={!!errors.contactEmail}
                  {...register("contactEmail")}
                />
                <FieldError errors={errors.contactEmail ? [errors.contactEmail] : undefined} />
              </Field>

              <Field>
                <FieldLabel htmlFor="accountManager">Account manager</FieldLabel>
                <Input id="accountManager" {...register("accountManager")} />
              </Field>

              <Field>
                <FieldLabel htmlFor="onboardedAt">Onboarded on</FieldLabel>
                <Input id="onboardedAt" type="date" {...register("onboardedAt")} />
              </Field>

              {submitError && (
                <p role="alert" className="text-sm text-destructive">
                  {submitError}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving…" : isEditing ? "Save changes" : "Create client"}
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
