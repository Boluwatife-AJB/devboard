"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CopyIcon } from "@phosphor-icons/react/dist/ssr";
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
import { useInviteMember } from "@/hooks/use-invitations";
import { getApiErrorMessage } from "@/lib/api";
import { inviteMemberSchema } from "@/lib/schema";
import type { InviteMemberFormData } from "@/types";

const ROLE_OPTIONS = [
  { value: "ORG_ADMIN" as const, label: "Admin" },
  { value: "ORG_MEMBER" as const, label: "Member" },
];

export function InviteMemberDialog({ trigger }: { trigger: ReactElement }) {
  const [open, setOpen] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [invitedEmail, setInvitedEmail] = useState("");
  const inviteMember = useInviteMember();

  const { control, handleSubmit, reset } = useForm<InviteMemberFormData>({
    resolver: zodResolver(inviteMemberSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      role: "ORG_MEMBER",
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      reset();
      setInviteUrl(null);
      setInvitedEmail("");
    }
  };

  const onSubmit = async (data: InviteMemberFormData) => {
    try {
      const result = await inviteMember.mutateAsync(data);
      if (result.emailSent) {
        toast.success(`Invitation sent to ${data.email}`);
        reset();
        setInviteUrl(null);
        setOpen(false);
      } else {
        setInvitedEmail(data.email);
        setInviteUrl(result.inviteUrl);
        toast.message(
          "Email couldn't be sent, copy the invite link and share it instead",
        );
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const copyInviteLink = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success("Invite link copied to clipboard");
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        {inviteUrl ? (
          <>
            <DialogHeader>
              <DialogTitle>Share invite link</DialogTitle>
              <DialogDescription>
                The invitation for {invitedEmail} was created, but the email
                could not be delivered. Copy this link and send it to them
                directly.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="invite-link">Invite link</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    id="invite-link"
                    readOnly
                    value={inviteUrl}
                    className="font-mono text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={copyInviteLink}
                    aria-label="Copy invite link"
                  >
                    <CopyIcon className="size-4" />
                  </Button>
                </div>
                <FieldDescription>
                  This link expires in 48 hours and can only be used once.
                </FieldDescription>
              </Field>

              <DialogFooter>
                <Button type="button" onClick={() => handleOpenChange(false)}>
                  Done
                </Button>
              </DialogFooter>
            </FieldGroup>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Invite Member</DialogTitle>
              <DialogDescription>
                Send an email invitation to join this workspace with the
                selected permission level. If email delivery fails, you will get
                a link to share manually.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)}>
              <FieldGroup className="gap-4">
                <Controller
                  control={control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel htmlFor="invite-email">Email</FieldLabel>
                      <Input
                        id="invite-email"
                        type="email"
                        placeholder="alex@example.com"
                        autoComplete="email"
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
                  name="role"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel htmlFor="invite-role">Role</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => field.onChange(value)}
                        items={ROLE_OPTIONS}
                      >
                        <SelectTrigger
                          id="invite-role"
                          className="w-full"
                          aria-invalid={fieldState.invalid || undefined}
                          onBlur={field.onBlur}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {ROLE_OPTIONS.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
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
                    onClick={() => handleOpenChange(false)}
                    disabled={inviteMember.isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={inviteMember.isPending}>
                    {inviteMember.isPending && (
                      <Spinner data-icon="inline-start" />
                    )}
                    Send Invite
                  </Button>
                </DialogFooter>
              </FieldGroup>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
