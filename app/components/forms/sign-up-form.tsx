/** biome-ignore-all lint/a11y/useValidAnchor: placeholder links for terms and privacy routes */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  BuildingsIcon,
  EnvelopeSimpleIcon,
  EyeClosedIcon,
  EyeIcon,
  LinkSimpleIcon,
  LockKeyIcon,
  UserIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { FormStepIndicator } from "@/components/ui/form-step-indicator";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { publicApi } from "@/lib/api";
import {
  setAccessToken,
  setOrganizations,
  setSelectedOrgId,
} from "@/lib/auth/cookies";
import { signupSchema } from "@/lib/schema";
import { slugify } from "@/lib/utils";
import type { SignUpResponse, SignupFormData } from "@/types";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";

const SIGNUP_STEPS = [
  { label: "Account details" },
  { label: "Organization setup" },
] as const;

const STEP1_FIELDS = ["fullName", "email", "password"] as const;

const register = async (data: SignupFormData): Promise<SignUpResponse> => {
  const payload = {
    email: data.email,
    display_name: data.fullName,
    password: data.password,
    create_org: {
      name: data.orgName,
      slug: data.orgSlug || slugify(data.orgName),
    },
  };
  const response = await publicApi.post("/auth/register", payload);
  return response.data;
};

const inputClassName =
  "py-6 pl-11 border border-devboard-neutral text-base focus:outline-none focus:border-devboard-primary focus:ring-1 focus:ring-devboard-primary/20 placeholder:font-semibold transition-all duration-150";

const labelClassName =
  "text-xs font-mono uppercase text-gray-400 pl-1 font-medium tracking-wide";

export default function SignUpForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const isSlugManual = useRef(false);

  const {
    formState: { isValid },
    control,
    handleSubmit,
    setValue,
    trigger,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: "onBlur",
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      orgName: "",
      orgSlug: "",
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

  const { mutateAsync: registerMutation, isPending: isRegisterPending } =
    useMutation({
      mutationFn: register,
      onSuccess: (data) => {
        setAccessToken(data.access_token);
        setSelectedOrgId(data.organizations[0].id);
        setOrganizations(data.organizations);
        router.push("/");
        console.log("Registration successful:", data);
      },
      onError: (error) => {
        console.error("Signup error:", error);
      },
    });

  const handleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleNextStep = async () => {
    const isStepValid = await trigger([...STEP1_FIELDS]);
    if (isStepValid) {
      setStep(2);
    }
  };

  const onSubmit = async (data: SignupFormData) => {
    await registerMutation(data);
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="mb-6 shrink-0">
        <h1 className="text-3xl font-bold text-foreground mb-px">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Join teams and start collaborating on market-ready products.
        </p>
      </div>

      <div className="mb-4 shrink-0">
        <FormStepIndicator currentStep={step} steps={[...SIGNUP_STEPS]} />
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <FieldGroup className="flex min-h-0 flex-1 flex-col gap-0">
          <ScrollArea className="h-0 min-h-0 flex-1">
            <div className="space-y-5 pr-3">
              {step === 1 && (
                <>
                  <Controller
                    control={control}
                    name="fullName"
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel
                          htmlFor="fullName"
                          className={labelClassName}
                        >
                          Full Name
                        </FieldLabel>
                        <div className="relative">
                          <UserIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
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
                    name="email"
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel htmlFor="email" className={labelClassName}>
                          Work Email
                        </FieldLabel>
                        <div className="relative">
                          <EnvelopeSimpleIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                          <Input
                            id="email"
                            className={inputClassName}
                            placeholder="Enter your work email"
                            type="email"
                            autoComplete="email"
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
                          className={labelClassName}
                        >
                          Password
                        </FieldLabel>
                        <div className="relative">
                          <LockKeyIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
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
                </>
              )}

              {step === 2 && (
                <>
                  <Controller
                    control={control}
                    name="orgName"
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel
                          htmlFor="orgName"
                          className={labelClassName}
                        >
                          Organization Name
                        </FieldLabel>
                        <div className="relative">
                          <BuildingsIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                          <Input
                            id="orgName"
                            className={inputClassName}
                            placeholder="Enter your organization name"
                            type="text"
                            autoComplete="organization"
                            name={field.name}
                            ref={field.ref}
                            onBlur={field.onBlur}
                            value={field.value}
                            onChange={(event) => {
                              const name = event.target.value;
                              field.onChange(name);

                              if (!isSlugManual.current) {
                                setValue("orgSlug", slugify(name), {
                                  shouldValidate: true,
                                });
                              }
                            }}
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
                    name="orgSlug"
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel
                          htmlFor="orgSlug"
                          className={labelClassName}
                        >
                          Organization Slug
                        </FieldLabel>
                        <div className="relative">
                          <LinkSimpleIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                          <Input
                            id="orgSlug"
                            className={inputClassName}
                            placeholder="your-org-slug"
                            type="text"
                            autoComplete="off"
                            name={field.name}
                            ref={field.ref}
                            onBlur={field.onBlur}
                            value={field.value}
                            onChange={(event) => {
                              isSlugManual.current = true;
                              field.onChange(event.target.value);
                            }}
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
                            checked={field.value}
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
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </>
              )}
            </div>
          </ScrollArea>

          <div className="mt-5 flex shrink-0 flex-col gap-3 border-t border-border/40 pt-5">
            {step === 1 ? (
              <Button
                type="button"
                onClick={handleNextStep}
                className="w-full bg-devboard-primary text-white hover:bg-devboard-primary/90 font-semibold py-6 rounded-xs transition-colors"
              >
                Continue
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={isRegisterPending}
                  className="flex-1 font-semibold py-6 rounded-xs transition-colors"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isRegisterPending || !isValid || !watchTermAccepted}
                  className="flex-1 bg-devboard-primary text-white hover:bg-devboard-primary/90 font-semibold py-6 rounded-xs transition-colors"
                >
                  {isRegisterPending ? "Creating Account..." : "Create Account"}
                </Button>
              </div>
            )}
          </div>

          <p className="mt-3 shrink-0 text-center text-sm text-muted-foreground">
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
