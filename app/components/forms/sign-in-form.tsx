"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  EnvelopeSimpleIcon,
  EyeClosedIcon,
  EyeIcon,
  LockKeyIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { signinSchema } from "@/lib/schema";
import type { SigninFormData } from "@/types";
import { Button } from "../ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";

export default function SignInForm() {
  const [isLoading, setIsLoading] = useState(false);
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

  const handleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const onSubmit = async (data: SigninFormData) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Form submitted:", data);
    } catch (error) {
      console.error("Signin error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-96 max-w-md mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-px">
          Welcome Back
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your DevBoard account to continue
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
                  className="text-xs font-mono uppercase text-gray-400 pl-1 font-medium tracking-wide"
                >
                  Work Email
                </FieldLabel>
                <div className="relative">
                  <EnvelopeSimpleIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                  <Input
                    id="email"
                    className="py-6 pl-11 border border-devboard-neutral text-base focus:outline-none focus:border-devboard-primary focus:ring-1 focus:ring-devboard-primary/20 placeholder:font-semibold transition-all duration-150"
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
                  className="text-xs font-mono uppercase text-gray-400 pl-1 font-medium tracking-wide"
                >
                  Password
                </FieldLabel>
                <div className="relative">
                  <LockKeyIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                  <Input
                    id="password"
                    className="py-6 pl-11 pr-11 border border-devboard-neutral text-base focus:outline-none focus:border-devboard-primary focus:ring-1 focus:ring-devboard-primary/20 placeholder:font-semibold transition-all duration-150"
                    placeholder="********"
                    type={showPassword ? "text" : "password"}
                    autoComplete="off"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground hover:bg-transparent active:not-aria-[haspopup]:-translate-y-1/2 dark:hover:bg-transparent"
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
            disabled={isLoading || !isValid}
            className="w-full bg-devboard-primary text-white hover:bg-devboard-primary/90 font-semibold py-6 rounded-xs transition-colors mt-5"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-3">
            Don't have an account?{" "}
            <Link
              href="/sign-up"
              className="text-devboard-primary hover:text-devboard-primary/90 transition-colors font-medium hover:underline"
            >
              Sign up
            </Link>
          </p>
        </FieldGroup>
      </form>
    </div>
  );
}
