"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BellIcon, EnvelopeSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { notificationSettingsDefaults } from "@/constant";
import { notificationSettingsSchema } from "@/lib/schema";
import type { NotificationSettingsFormData } from "@/types";

const inAppNotifications: {
  name: keyof NotificationSettingsFormData;
  label: string;
  description: string;
}[] = [
  {
    name: "taskAssigned",
    label: "Task assigned",
    description: "When a task is assigned to you.",
  },
  {
    name: "taskDueSoon",
    label: "Task due soon",
    description: "Reminders before task deadlines.",
  },
  {
    name: "mentions",
    label: "Mentions",
    description: "When someone mentions you in a message or comment.",
  },
  {
    name: "taskComments",
    label: "Task comments",
    description: "New comments on tasks you follow.",
  },
  {
    name: "channelMessages",
    label: "Channel messages",
    description: "Activity in channels you belong to.",
  },
  {
    name: "announcements",
    label: "Announcements",
    description: "Organization-wide updates from admins.",
  },
];

export function NotificationsSettingsCard() {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<NotificationSettingsFormData>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: notificationSettingsDefaults,
  });

  const onSubmit = handleSubmit(async () => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    toast.success("Notification preferences saved");
  });

  return (
    <Card className="rounded-xs">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-base">
          <BellIcon className="size-4 text-muted-foreground" />
          Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form id="notifications-form" onSubmit={onSubmit}>
          <FieldGroup className="gap-6">
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                In-app
              </p>
              <FieldDescription>
                Choose which events appear in your notification center.
              </FieldDescription>
            </div>

            <div className="flex flex-col gap-0">
              {inAppNotifications.map((item, index) => (
                <div key={item.name}>
                  {index > 0 && <Separator className="my-4" />}
                  <Controller
                    name={item.name}
                    control={control}
                    render={({ field }) => (
                      <Field orientation="horizontal">
                        <Checkbox
                          id={item.name}
                          checked={field.value}
                          onCheckedChange={(checked) =>
                            field.onChange(checked === true)
                          }
                        />
                        <FieldContent>
                          <FieldLabel htmlFor={item.name}>
                            {item.label}
                          </FieldLabel>
                          <FieldDescription>
                            {item.description}
                          </FieldDescription>
                        </FieldContent>
                      </Field>
                    )}
                  />
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex flex-col gap-1">
              <p className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <EnvelopeSimpleIcon className="size-4" />
                Email
              </p>
              <FieldDescription>
                Control how DevBoard reaches you outside the app.
              </FieldDescription>
            </div>

            <Controller
              name="emailDigest"
              control={control}
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id="emailDigest"
                    checked={field.value}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                  />
                  <FieldContent>
                    <FieldLabel htmlFor="emailDigest">Weekly digest</FieldLabel>
                    <FieldDescription>
                      A summary of your tasks, mentions, and team activity every
                      Monday.
                    </FieldDescription>
                  </FieldContent>
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="justify-end border-t">
        <Button
          type="submit"
          form="notifications-form"
          className="rounded-xs"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Spinner data-icon="inline-start" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
