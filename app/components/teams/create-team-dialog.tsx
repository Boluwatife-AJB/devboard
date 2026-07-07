"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useCreateTeam } from "@/hooks/use-teams";
import { getApiErrorMessage } from "@/lib/api";
import { createTeamSchema } from "@/lib/schema";
import type { CreateTeamFormData } from "@/types";

export function CreateTeamDialog({ trigger }: { trigger: ReactElement }) {
  const [open, setOpen] = useState(false);
  const createTeam = useCreateTeam();

  const { control, handleSubmit, reset } = useForm<CreateTeamFormData>({
    resolver: zodResolver(createTeamSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (data: CreateTeamFormData) => {
    try {
      const team = await createTeam.mutateAsync({ name: data.name });
      toast.success(`Team "${team.name}" created`);
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
          <DialogTitle>Create Team</DialogTitle>
          <DialogDescription>
            You will be added as the team owner and can invite members next.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4">
            <Controller
              control={control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="team-name">Name</FieldLabel>
                  <Input
                    id="team-name"
                    placeholder="Platform Engineering"
                    aria-invalid={fieldState.invalid || undefined}
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
                disabled={createTeam.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createTeam.isPending}>
                {createTeam.isPending && <Spinner data-icon="inline-start" />}
                Create Team
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
