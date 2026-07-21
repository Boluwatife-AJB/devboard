"use client";

import { type ReactElement, useState } from "react";
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
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useMe } from "@/hooks/use-me";
import { useOpenDm } from "@/hooks/use-messaging";
import { useOrgMembers } from "@/hooks/use-teams";
import { getApiErrorMessage } from "@/lib/api";
import type { ApiDmThread } from "@/types";

export function NewDmDialog({
  trigger,
  onOpened,
}: {
  trigger: ReactElement;
  onOpened?: (thread: ApiDmThread) => void;
}) {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const { data: me } = useMe();
  const { data: members = [], isPending: isMembersPending } = useOrgMembers();
  const openDm = useOpenDm();

  const otherMembers = members.filter(
    (member) => member.userId !== me?.id && member.user,
  );

  const selected = otherMembers.find((member) => member.userId === userId);

  const handleStart = async () => {
    if (!userId) return;
    try {
      const thread = await openDm.mutateAsync(userId);
      setUserId("");
      setOpen(false);
      onOpened?.(thread);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Direct Message</DialogTitle>
          <DialogDescription>
            Start a private conversation with someone in your organization.
          </DialogDescription>
        </DialogHeader>

        <Field>
          <FieldLabel htmlFor="dm-member">Member</FieldLabel>
          <Select
            value={userId}
            onValueChange={(value) => setUserId(value ?? "")}
            items={otherMembers.map((member) => ({
              label: member.user?.displayName ?? member.userId,
              value: member.userId,
            }))}
          >
            <SelectTrigger
              id="dm-member"
              className="w-full"
              disabled={isMembersPending}
            >
              <SelectValue>
                {selected
                  ? (selected.user?.displayName ?? selected.userId)
                  : isMembersPending
                    ? "Loading members..."
                    : "Select a member"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectGroup>
                {otherMembers.map((member) => (
                  <SelectItem key={member.userId} value={member.userId}>
                    {member.user?.displayName ?? member.userId}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={openDm.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleStart}
            disabled={!userId || openDm.isPending}
          >
            {openDm.isPending && <Spinner data-icon="inline-start" />}
            Start Conversation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
