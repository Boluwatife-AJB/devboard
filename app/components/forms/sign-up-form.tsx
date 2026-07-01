/** biome-ignore-all lint/a11y/useValidAnchor: placeholder links for terms and privacy routes */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  EnvelopeSimpleIcon,
  EyeClosedIcon,
  EyeIcon,
  LockKeyIcon,
  UserIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signupSchema } from "@/lib/schema";
import type { SignupFormData } from "@/types";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";

export default function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    formState: { isValid },
    control,
    handleSubmit,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: "onBlur",
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      termsAccepted: false,
    },
  });

  const _watchPassword = useWatch({
    control,
    name: "password",
  });

  const watchTermAccepted = useWatch({
    control,
    name: "termsAccepted",
  });

  const handleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Form submitted:", data);
    } catch (error) {
      console.error("Signup error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto ">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-px">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Join teams and start collaborating on market-ready products.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          {/* <ScrollArea className="h-[calc(100vh-400px)]">
            <div className="space-y-5 pr-2">
              <Controller
                control={control}
                name="fullName"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel
                      htmlFor="fullName"
                      className="text-xs font-mono uppercase text-gray-400 pl-1 font-medium tracking-wide"
                    >
                      Full Name
                    </FieldLabel>
                    <div className="relative">
                      <UserIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                      <Input
                        id="fullName"
                        className="py-6 pl-11  border border-devboard-neutral text-base focus:outline-none focus:border-devboard-primary focus:ring-1 focus:ring-devboard-primary/20 placeholder:font-semibold transition-all duration-150"
                        placeholder="Enter your full name"
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
                        placeholder="Enter your work email"
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
                        placeholder="Enter your password"
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
              {watchPassword && (
                <PasswordStrengthMeter password={watchPassword} />
              )}

              <Controller
                control={control}
                name="termsAccepted"
                render={({ field, fieldState }) => (
                  <Field>
                    <div className="flex items-start gap-2 flex-row-reverse">
                      <FieldLabel
                        htmlFor="termsAccepted"
                        className="text-xs text-muted-foreground font-medium tracking-wide"
                      >
                        <span>
                          I agree to the{" "}
                          <Link
                            href="#"
                            className="text-devboard-primary hover:text-devboard-primary/90 transition-colors hover:underline"
                          >
                            Terms of Service
                          </Link>{" "}
                          and acknowledge the{" "}
                          <Link
                            href="#"
                            className="text-devboard-primary hover:text-devboard-primary/90 transition-colors hover:underline"
                          >
                            Privacy Policy
                          </Link>{" "}
                          regarding data handling and encryption.
                        </span>
                      </FieldLabel>
                      <Checkbox
                        id="termsAccepted"
                        value={field.value.toString()}
                        onCheckedChange={field.onChange}
                        onBlur={field.onBlur}
                        disabled={field.disabled}
                        name={field.name}
                        ref={field.ref}
                        className="size-5 border border-border rounded-xs data-checked:bg-devboard-primary data-checked:text-primary-foreground
                  flex items-center justify-center bg-white
                  transition-all duration-150
                  group-hover:border-devboard-primary/50
                  group-data-[disabled=true]:cursor-not-allowed
                  group-data-[disabled=true]:opacity-50"
                        aria-label="I agree to the Terms of Service and acknowledge the Privacy Policy regarding data handling and encryption."
                      />
                    </div>
                  </Field>
                )}
              />
            </div>
          </ScrollArea> */}
          <div className="space-y-5 pr-2">
            <Controller
              control={control}
              name="fullName"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel
                    htmlFor="fullName"
                    className="text-xs font-mono uppercase text-gray-400 pl-1 font-medium tracking-wide"
                  >
                    Full Name
                  </FieldLabel>
                  <div className="relative">
                    <UserIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                    <Input
                      id="fullName"
                      className="py-6 pl-11  border border-devboard-neutral text-base focus:outline-none focus:border-devboard-primary focus:ring-1 focus:ring-devboard-primary/20 placeholder:font-semibold transition-all duration-150"
                      placeholder="Enter your full name"
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
                      placeholder="Enter your work email"
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
                      placeholder="Enter your password"
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
            {/* {watchPassword && (
              <PasswordStrengthMeter password={watchPassword} />
            )} */}

            <Controller
              control={control}
              name="termsAccepted"
              render={({ field }) => (
                <Field>
                  <div className="flex items-start gap-2 flex-row-reverse">
                    <FieldLabel
                      htmlFor="termsAccepted"
                      className="text-xs text-muted-foreground font-medium tracking-wide"
                    >
                      <span>
                        I agree to the{" "}
                        <Link
                          href="#"
                          className="text-devboard-primary hover:text-devboard-primary/90 transition-colors hover:underline"
                        >
                          Terms of Service
                        </Link>{" "}
                        and acknowledge the{" "}
                        <Link
                          href="#"
                          className="text-devboard-primary hover:text-devboard-primary/90 transition-colors hover:underline"
                        >
                          Privacy Policy
                        </Link>{" "}
                        regarding data handling and encryption.
                      </span>
                    </FieldLabel>
                    <Checkbox
                      id="termsAccepted"
                      value={field.value.toString()}
                      onCheckedChange={field.onChange}
                      onBlur={field.onBlur}
                      disabled={field.disabled}
                      name={field.name}
                      ref={field.ref}
                      className="size-5 border border-border rounded-xs data-checked:bg-devboard-primary data-checked:text-primary-foreground
                  flex items-center justify-center bg-white
                  transition-all duration-150
                  group-hover:border-devboard-primary/50
                  group-data-[disabled=true]:cursor-not-allowed
                  group-data-[disabled=true]:opacity-50"
                      aria-label="I agree to the Terms of Service and acknowledge the Privacy Policy regarding data handling and encryption."
                    />
                  </div>
                </Field>
              )}
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading || !isValid || !watchTermAccepted}
            className="w-full bg-devboard-primary text-white hover:bg-devboard-primary/90 font-semibold py-6 rounded-xs transition-colors mt-5"
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-3">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="text-devboard-primary hover:text-devboard-primary/90 transition-colors font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </FieldGroup>
      </form>
    </div>
  );
}
