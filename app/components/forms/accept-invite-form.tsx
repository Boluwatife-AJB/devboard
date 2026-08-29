/** biome-ignore-all lint/a11y/useValidAnchor: placeholder links for terms and privacy routes */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  EyeClosedIcon,
  EyeIcon,
  LockKeyIcon,
  UserIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  isLoggedIn,
  useAcceptInvite,
  useInvitePreview,
  useRegisterWithInvite,
} from "@/hooks/use-invitations";
import { getApiErrorMessage } from "@/lib/api";
import { acceptInviteSignupSchema } from "@/lib/schema";
import type { AcceptInviteSignupFormData } from "@/types";

const inputClassName =
  "py-6 pl-11 border border-devboard-neutral text-base focus:outline-none focus:border-devboard-primary focus:ring-1 focus:ring-devboard-primary/20 placeholder:font-semibold transition-all duration-150";

const labelClassName =
  "text-xs font-mono uppercase text-gray-400 pl-1 font-medium tracking-wide";

type Mode = "choose" | "signup";

export function AcceptInviteForm({ token }: { token: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("choose");
  const [showPassword, setShowPassword] = useState(false);
  const [authenticated, setAuthenticated] = useState(() => isLoggedIn());
  const acceptInvite = useAcceptInvite();
  const registerWithInvite = useRegisterWithInvite(token);
  const invitePreview = useInvitePreview(token, !authenticated);

  useEffect(() => {
    setAuthenticated(isLoggedIn());
  }, []);

  const {
    formState: { isValid },
    control,
    handleSubmit,
  } = useForm<AcceptInviteSignupFormData>({
    resolver: zodResolver(acceptInviteSignupSchema),
    mode: "onBlur",
    defaultValues: {
      fullName: "",
      password: "",
      termsAccepted: false,
    },
  });

  const termsAccepted = useWatch({ control, name: "termsAccepted" });

  const handleAcceptExisting = async () => {
    try {
      const result = await acceptInvite.mutateAsync(token);
      toast.success(`Joined ${result.organization.name}`);
      router.push("/?welcome=1");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const onSignup = async (data: AcceptInviteSignupFormData) => {
    if (!invitePreview.data?.email) {
      toast.error("Invitation details are unavailable");
      return;
    }

    try {
      await registerWithInvite.mutateAsync({
        form: data,
        email: invitePreview.data.email,
      });
      toast.success("Account created! Welcome to the workspace");
      router.push("/?welcome=1");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const signInHref = `/sign-in?redirect=${encodeURIComponent(`/accept-invite?token=${token}`)}`;
  const orgName = invitePreview.data?.orgName;

  if (authenticated) {
    return (
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h1 className="mb-px text-3xl font-bold text-foreground">
            Accept invitation
          </h1>
          <p className="text-sm text-muted-foreground">
            You&apos;re signed in. Join the workspace you were invited to.
          </p>
        </div>

        <Button
          type="button"
          className="w-full rounded-xs bg-devboard-primary py-6 font-semibold text-white hover:bg-devboard-primary/90"
          disabled={acceptInvite.isPending}
          onClick={handleAcceptExisting}
        >
          {acceptInvite.isPending && <Spinner data-icon="inline-start" />}
          {acceptInvite.isPending ? "Joining..." : "Join workspace"}
        </Button>
      </div>
    );
  }

  if (invitePreview.isLoading) {
    return (
      <div className="flex w-full max-w-md items-center justify-center py-12">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (invitePreview.isError || !invitePreview.data) {
    return (
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h1 className="mb-px text-3xl font-bold text-foreground">
            Invitation unavailable
          </h1>
          <p className="text-sm text-muted-foreground">
            {getApiErrorMessage(invitePreview.error) ||
              "This invitation is invalid, expired, or has already been used."}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-xs py-6 font-semibold"
          onClick={() => router.push("/sign-in")}
        >
          Go to sign in
        </Button>
      </div>
    );
  }

  if (mode === "choose") {
    return (
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h1 className="mb-px text-3xl font-bold text-foreground">
            You&apos;re invited
          </h1>
          <p className="text-sm text-muted-foreground">
            {orgName
              ? `Join ${orgName}. Create an account or sign in if you already have one.`
              : "Create an account or sign in if you already have one."}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            type="button"
            className="w-full rounded-xs bg-devboard-primary py-6 font-semibold text-white hover:bg-devboard-primary/90"
            onClick={() => setMode("signup")}
          >
            Create account
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xs py-6 font-semibold"
            onClick={() => router.push(signInHref)}
          >
            Sign in to accept
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full max-w-md flex-col">
      <div className="mb-6 shrink-0">
        <h1 className="mb-px text-3xl font-bold text-foreground">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          {orgName
            ? `Set your name and password to join ${orgName}.`
            : "Set your name and password to join the workspace."}
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSignup)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <FieldGroup className="flex flex-col gap-5">
          <Controller
            control={control}
            name="fullName"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="fullName" className={labelClassName}>
                  Full Name
                </FieldLabel>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="fullName"
                    className={inputClassName}
                    placeholder="Enter your full name"
                    type="text"
                    autoComplete="name"
                    {...field}
                  />
                </div>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="password" className={labelClassName}>
                  Password
                </FieldLabel>
                <div className="relative">
                  <LockKeyIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    className={`${inputClassName} pr-11`}
                    placeholder="Enter your password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:bg-transparent hover:text-foreground active:not-aria-[haspopup]:-translate-y-1/2 dark:hover:bg-transparent"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeClosedIcon /> : <EyeIcon />}
                  </Button>
                </div>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            control={control}
            name="termsAccepted"
            render={({ field, fieldState }) => (
              <Field>
                <div className="flex flex-row-reverse items-start gap-2">
                  <FieldLabel
                    htmlFor="termsAccepted"
                    className="text-xs font-medium tracking-wide text-muted-foreground"
                  >
                    <span>
                      I agree to the{" "}
                      <Link
                        href="#"
                        className="text-devboard-primary transition-colors hover:text-devboard-primary/90 hover:underline"
                      >
                        Terms of Service
                      </Link>{" "}
                      and acknowledge the{" "}
                      <Link
                        href="#"
                        className="text-devboard-primary transition-colors hover:text-devboard-primary/90 hover:underline"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </span>
                  </FieldLabel>
                  <Checkbox
                    id="termsAccepted"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    onBlur={field.onBlur}
                    disabled={field.disabled}
                    name={field.name}
                    ref={field.ref}
                    className="flex size-5 items-center justify-center rounded-xs border border-border bg-white transition-all duration-150 group-hover:border-devboard-primary/50 group-data-[disabled=true]:cursor-not-allowed group-data-[disabled=true]:opacity-50 data-checked:bg-devboard-primary data-checked:text-primary-foreground"
                    aria-label="I agree to the Terms of Service and Privacy Policy"
                  />
                </div>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xs py-6 font-semibold"
              onClick={() => setMode("choose")}
              disabled={registerWithInvite.isPending}
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={
                registerWithInvite.isPending || !isValid || !termsAccepted
              }
              className="flex-1 rounded-xs bg-devboard-primary py-6 font-semibold text-white hover:bg-devboard-primary/90"
            >
              {registerWithInvite.isPending && (
                <Spinner data-icon="inline-start" />
              )}
              {registerWithInvite.isPending ? "Creating..." : "Join workspace"}
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href={signInHref}
              className="font-medium text-devboard-primary transition-colors hover:text-devboard-primary/90 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </FieldGroup>
      </form>
    </div>
  );
}
