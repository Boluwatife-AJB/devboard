"use client";

import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { type ReactElement, useState } from "react";
import { ScheduleEventSidebar } from "@/components/events/schedule-event-sidebar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type CreateEventDialogProps = {
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function CreateEventDialog({
  trigger,
  open: controlledOpen,
  onOpenChange,
}: CreateEventDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>Create event</DialogTitle>
          <DialogDescription>
            Schedule a new event for your organization.
          </DialogDescription>
        </DialogHeader>
        <ScheduleEventSidebar
          formId="create-event-dialog-form"
          onCreated={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export function CreateEventDialogTriggerButton() {
  return (
    <Button type="button" size="sm" className="rounded-xs">
      <PlusIcon data-icon="inline-start" />
      Create Event
    </Button>
  );
}
