"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { type ReactElement, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useCreateProject } from "@/hooks/use-projects";
import { useTeams } from "@/hooks/use-teams";
import { getApiErrorMessage } from "@/lib/api";
import { getSelectedOrgId } from "@/lib/auth/cookies";
import { createProjectSchema } from "@/lib/schema";
import type { CreateProjectFormData } from "@/types";

export function CreateProjectDialog({ trigger }: { trigger: ReactElement }) {
  const [open, setOpen] = useState(false);
  const createProject = useCreateProject();
  const { data: teams, isPending: isTeamsPending } = useTeams();

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
                  <FieldLabel htmlFor="project-team">Team</FieldLabel>
                  <Select
                    value={field.value || null}
                    onValueChange={(value) => field.onChange(value ?? "")}
                  >
                    <SelectTrigger
                      id="project-team"
                      className="w-full"
                      aria-invalid={fieldState.invalid || undefined}
                      disabled={isTeamsPending || teams?.length === 0}
                      onBlur={field.onBlur}
                    >
                      <SelectValue>
                        {field.value
                          ? (teams?.find((team) => team.id === field.value)
                              ?.name ?? "Select a team")
                          : isTeamsPending
                            ? "Loading teams..."
                            : "Select a team"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {teams?.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {teams?.length === 0 ? (
                    <FieldDescription>
                      No teams yet — create one on the{" "}
                      <Link href="/teams" className="underline">
                        Teams page
                      </Link>{" "}
                      first.
                    </FieldDescription>
                  ) : (
                    <FieldDescription>
                      The team this project belongs to.
                    </FieldDescription>
                  )}
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
                    className="resize-none"
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
