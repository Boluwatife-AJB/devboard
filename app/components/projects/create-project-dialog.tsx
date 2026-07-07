"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useCreateProject } from "@/hooks/use-projects";
import { getApiErrorMessage } from "@/lib/api";
import { getSelectedOrgId } from "@/lib/auth/cookies";
import { createProjectSchema } from "@/lib/schema";
import type { CreateProjectFormData } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { type ReactElement, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";



export function CreateProjectDialog({ trigger }: { trigger: ReactElement }) {
  const [open, setOpen] = useState(false);
  const createProject = useCreateProject();

  const { control, handleSubmit, reset } = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      key: "",
      teamId: "",
      description: "",
    },
  });

  const onSubmit = async (data: CreateProjectFormData) => {
    const organizationId = getSelectedOrgId();
    if (!organizationId) {
      toast.error("No organization selected. Please sign in again.");
      return;
    }

    try {
      const project = await createProject.mutateAsync({
        organizationId,
        teamId: data.teamId,
        name: data.name,
        key: data.key,
        description: data.description || null,
      });
      toast.success(`Project ${project.key} created`);
      reset();
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Projects group your team's tasks under a shared key.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4">
            <Controller
              control={control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="project-name">Name</FieldLabel>
                  <Input
                    id="project-name"
                    placeholder="Atlas Core"
                    aria-invalid={fieldState.invalid || undefined}
                    {...field}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              control={control}
              name="key"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="project-key">Key</FieldLabel>
                  <Input
                    id="project-key"
                    placeholder="CORE"
                    className="font-mono uppercase"
                    aria-invalid={fieldState.invalid || undefined}
                    {...field}
                    onChange={(event) =>
                      field.onChange(event.target.value.toUpperCase())
                    }
                  />
                  <FieldDescription>
                    Used as the task prefix, e.g. CORE-1.
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              control={control}
              name="teamId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="project-team-id">Team ID</FieldLabel>
                  <Input
                    id="project-team-id"
                    placeholder="00000000-0000-0000-0000-000000000000"
                    className="font-mono"
                    aria-invalid={fieldState.invalid || undefined}
                    {...field}
                  />
                  <FieldDescription>
                    Paste the team's UUID. A team picker will replace this once
                    the API exposes team listing.
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="project-description">
                    Description
                  </FieldLabel>
                  <Textarea
                    id="project-description"
                    placeholder="What is this project about?"
                    rows={3}
                    {...field}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createProject.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createProject.isPending}>
                {createProject.isPending && (
                  <Spinner data-icon="inline-start" />
                )}
                Create Project
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
