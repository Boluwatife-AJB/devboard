"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type ReactElement, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
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
import { useCreateChannel } from "@/hooks/use-messaging";
import { getApiErrorMessage } from "@/lib/api";
import { createChannelSchema } from "@/lib/schema";
import type { ApiChannel, ChannelKind, CreateChannelFormData } from "@/types";

const CHANNEL_KINDS: { label: string; value: ChannelKind }[] = [
  { label: "Open — anyone in the org can join", value: "OPEN" },
  { label: "Private — invite only", value: "PRIVATE" },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CreateChannelDialog({
  trigger,
  onCreated,
}: {
  trigger: ReactElement;
  onCreated?: (channel: ApiChannel) => void;
}) {
  const [open, setOpen] = useState(false);
  const createChannel = useCreateChannel();

  const { control, handleSubmit, reset } = useForm<CreateChannelFormData>({
    resolver: zodResolver(createChannelSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      description: "",
      kind: "OPEN",
    },
  });

  const name = useWatch({ control, name: "name" });
  const slugPreview = slugify(name ?? "");

  const onSubmit = async (data: CreateChannelFormData) => {
    try {
      const channel = await createChannel.mutateAsync({
        name: data.name,
        slug: slugify(data.name),
        description: data.description?.trim() ? data.description : null,
        kind: data.kind,
      });
      toast.success(`Channel "${channel.name}" created`);
      reset();
      setOpen(false);
      onCreated?.(channel);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Channel</DialogTitle>
          <DialogDescription>
            Channels are where your team communicates. You will be added as a
            member automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4">
            <Controller
              control={control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="channel-name">Name</FieldLabel>
                  <Input
                    id="channel-name"
                    placeholder="Engineering Sync"
                    aria-invalid={fieldState.invalid || undefined}
                    {...field}
                  />
                  <FieldDescription>
                    {slugPreview
                      ? `Will be created as #${slugPreview}`
                      : "The channel slug is generated from the name"}
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
                  <FieldLabel htmlFor="channel-description">
                    Description
                  </FieldLabel>
                  <Textarea
                    id="channel-description"
                    placeholder="What is this channel about?"
                    rows={3}
                    aria-invalid={fieldState.invalid || undefined}
                    {...field}
                  />
                  <FieldDescription>Optional</FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              control={control}
              name="kind"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="channel-kind">Visibility</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value)}
                    items={CHANNEL_KINDS}
                  >
                    <SelectTrigger
                      id="channel-kind"
                      className="w-full"
                      onBlur={field.onBlur}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {CHANNEL_KINDS.map((kind) => (
                          <SelectItem key={kind.value} value={kind.value}>
                            {kind.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
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
                disabled={createChannel.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createChannel.isPending}>
                {createChannel.isPending && (
                  <Spinner data-icon="inline-start" />
                )}
                Create Channel
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
