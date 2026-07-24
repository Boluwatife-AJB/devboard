"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  EnvelopeSimpleIcon,
  EyeClosedIcon,
  EyeIcon,
  LockKeyIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { getApiErrorMessage, publicApi } from "@/lib/api";
import {
  setAccessToken,
  setOrganizations,
  setSelectedOrgId,
} from "@/lib/auth/cookies";
import { signinSchema } from "@/lib/schema";
import type { AuthResponse, SigninFormData } from "@/types";
import { Button } from "../ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";

const login = async (data: SigninFormData): Promise<AuthResponse> => {
  const response = await publicApi.post("/auth/login", data);
  return response.data;
};

function safeRedirectPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

function SignInFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeRedirectPath(searchParams.get("redirect"));
  const [showPassword, setShowPassword] = useState(false);

  const {
    formState: { isValid },
    control,
    handleSubmit,
  } = useForm<SigninFormData>({
    resolver: zodResolver(signinSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { mutate: loginMutation, isPending: isLoginPending } = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setAccessToken(data.access_token);
      setOrganizations(data.organizations);
      // Users registered via invite may not belong to any organization yet
      if (data.organizations.length > 0) {
        setSelectedOrgId(data.organizations[0].id);
      }
      router.push(redirectTo);
      toast.success("Login successful");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const handleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const onSubmit = (data: SigninFormData) => {
    loginMutation(data);
  };

  const signUpHref = redirectTo.startsWith("/accept-invite")
    ? redirectTo
    : "/sign-up";

  return (
    <div className="mx-auto w-96 max-w-md">
      <div className="mb-8">
        <h1 className="mb-px text-3xl font-bold text-foreground">
          Welcome Back
        </h1>
        <p className="text-sm text-muted-foreground">
          {redirectTo.startsWith("/accept-invite")
            ? "Sign in to accept your workspace invitation"
            : "Sign in to your DevBoard account to continue"}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FieldGroup>
          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel
                  htmlFor="email"
                  className="pl-1 font-mono text-xs font-medium tracking-wide text-gray-400 uppercase"
                >
                  Work Email
                </FieldLabel>
                <div className="relative">
                  <EnvelopeSimpleIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    className="border border-devboard-neutral py-6 pl-11 text-base transition-all duration-150 placeholder:font-semibold focus:border-devboard-primary focus:ring-1 focus:ring-devboard-primary/20 focus:outline-none"
                    placeholder="your@email.com"
                    type="text"
                    autoComplete="off"
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
                <FieldLabel
                  htmlFor="password"
                  className="pl-1 font-mono text-xs font-medium tracking-wide text-gray-400 uppercase"
                >
                  Password
                </FieldLabel>
                <div className="relative">
                  <LockKeyIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    className="border border-devboard-neutral py-6 pr-11 pl-11 text-base transition-all duration-150 placeholder:font-semibold focus:border-devboard-primary focus:ring-1 focus:ring-devboard-primary/20 focus:outline-none"
                    placeholder="********"
                    type={showPassword ? "text" : "password"}
                    autoComplete="off"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:bg-transparent hover:text-foreground active:not-aria-[haspopup]:-translate-y-1/2 dark:hover:bg-transparent"
                    onClick={handleShowPassword}
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

          <Button
            type="submit"
            disabled={isLoginPending || !isValid}
            className="mt-5 w-full rounded-xs bg-devboard-primary py-6 font-semibold text-white transition-colors hover:bg-devboard-primary/90"
          >
            {isLoginPending ? "Signing in..." : "Sign in"}
          </Button>

          <p className="mt-3 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href={signUpHref}
              className="font-medium text-devboard-primary transition-colors hover:text-devboard-primary/90 hover:underline"
            >
              {redirectTo.startsWith("/accept-invite")
                ? "Create account"
                : "Sign up"}
            </Link>
          </p>
        </FieldGroup>
      </form>
    </div>
  );
}

export default function SignInForm() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto h-64 w-96 max-w-md animate-pulse rounded-xs bg-muted/30" />
      }
    >
      <SignInFormInner />
    </Suspense>
  );
}
