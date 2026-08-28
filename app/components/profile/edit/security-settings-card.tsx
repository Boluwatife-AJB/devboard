"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  DesktopIcon,
  DeviceMobileIcon,
  KeyIcon,
} from "@phosphor-icons/react/dist/ssr";
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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { changePasswordSchema } from "@/lib/schema";
import type { ChangePasswordFormData } from "@/types";

const _activeSessions = [
  {
    id: "1",
    device: "Windows · Chrome",
    location: "San Francisco, CA",
    lastActive: "Active now",
    current: true,
    icon: DesktopIcon,
  },
  {
    id: "2",
    device: "iPhone · Safari",
    location: "San Francisco, CA",
    lastActive: "2 days ago",
    current: false,
    icon: DeviceMobileIcon,
  },
];

export function SecuritySettingsCard() {
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = handleSubmit(async () => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    toast.success("Password updated");
    reset();
  });

  return (
    <div className="flex flex-col gap-6">
      <Card className="rounded-xs">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyIcon className="size-4 text-muted-foreground" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form id="security-password-form" onSubmit={onSubmit}>
            <FieldGroup className="gap-4">
              <Controller
                name="currentPassword"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel
                      htmlFor="currentPassword"
                      className="profile-field-label"
                    >
                      Current Password
                    </FieldLabel>
                    <Input
                      id="currentPassword"
                      type="password"
                      autoComplete="current-password"
                      {...field}
                      aria-invalid={fieldState.invalid}
                      className="profile-input"
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Controller
                  name="newPassword"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel
                        htmlFor="newPassword"
                        className="profile-field-label"
                      >
                        New Password
                      </FieldLabel>
                      <Input
                        id="newPassword"
                        type="password"
                        autoComplete="new-password"
                        {...field}
                        aria-invalid={fieldState.invalid}
                        className="profile-input"
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  name="confirmPassword"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel
                        htmlFor="confirmPassword"
                        className="profile-field-label"
                      >
                        Confirm Password
                      </FieldLabel>
                      <Input
                        id="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        {...field}
                        aria-invalid={fieldState.invalid}
                        className="profile-input"
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </div>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="justify-end border-t">
          <Button
            type="submit"
            form="security-password-form"
            className="rounded-xs"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner data-icon="inline-start" />
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* <Card className="rounded-xs">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheckIcon className="size-4 text-muted-foreground" />
            Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <p className="font-medium text-foreground">
              Authenticator app (recommended)
            </p>
            <FieldDescription>
              Add an extra layer of security using an authenticator app.
            </FieldDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0 rounded-xs"
            onClick={() =>
              toast.message("Two-factor setup", {
                description: "Authenticator setup will be available soon.",
              })
            }
          >
            Enable 2FA
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-xs">
        <CardHeader className="border-b">
          <CardTitle className="text-base">Active Sessions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-0 px-0 pt-0">
          {activeSessions.map((session, index) => {
            const Icon = session.icon;
            return (
              <div key={session.id}>
                {index > 0 && <Separator />}
                <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xs bg-muted/60 text-muted-foreground">
                      <Icon className="size-4" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">
                          {session.device}
                        </p>
                        {session.current ? (
                          <Badge variant="secondary">Current</Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {session.location} · {session.lastActive}
                      </p>
                    </div>
                  </div>
                  {!session.current ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 rounded-xs"
                      onClick={() =>
                        toast.message("Session revoked", {
                          description: `${session.device} has been signed out.`,
                        })
                      }
                    >
                      Revoke
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card> */}
    </div>
  );
}
