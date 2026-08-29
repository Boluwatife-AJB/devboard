"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { UserIcon } from "@phosphor-icons/react/dist/ssr";
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
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { profilePronounOptions } from "@/constant";
import { editProfileSchema } from "@/lib/schema";
import type { EditProfileFormData } from "@/types";

type PersonalInformationCardProps = {
  defaultValues: EditProfileFormData;
};

export function PersonalInformationCard({
  defaultValues,
}: PersonalInformationCardProps) {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    toast.success("Profile updated", {
      description: `Saved changes for ${values.displayName}.`,
    });
  });

  return (
    <Card className="rounded-xs">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-base">
          <UserIcon className="size-4 text-muted-foreground" />
          Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form id="general-profile-form" onSubmit={onSubmit}>
          <FieldGroup className="gap-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Controller
                name="firstName"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel
                      htmlFor="firstName"
                      className="profile-field-label"
                    >
                      First Name
                    </FieldLabel>
                    <Input
                      id="firstName"
                      {...field}
                      aria-invalid={fieldState.invalid}
                      className="profile-input"
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                name="lastName"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel
                      htmlFor="lastName"
                      className="profile-field-label"
                    >
                      Last Name
                    </FieldLabel>
                    <Input
                      id="lastName"
                      {...field}
                      aria-invalid={fieldState.invalid}
                      className="profile-input"
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                name="displayName"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel
                      htmlFor="displayName"
                      className="profile-field-label"
                    >
                      Display Name
                    </FieldLabel>
                    <Input
                      id="displayName"
                      {...field}
                      aria-invalid={fieldState.invalid}
                      className="profile-input"
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                name="pronouns"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel
                      htmlFor="pronouns"
                      className="profile-field-label"
                    >
                      Pronouns (Optional)
                    </FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="pronouns"
                        className="profile-select-trigger"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Select pronouns" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {profilePronounOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Controller
                name="title"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="title" className="profile-field-label">
                      Title
                    </FieldLabel>
                    <Input
                      id="title"
                      {...field}
                      aria-invalid={fieldState.invalid}
                      className="profile-input"
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                name="location"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel
                      htmlFor="location"
                      className="profile-field-label"
                    >
                      Location
                    </FieldLabel>
                    <Input
                      id="location"
                      {...field}
                      aria-invalid={fieldState.invalid}
                      className="profile-input"
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                name="phone"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="phone" className="profile-field-label">
                      Phone
                    </FieldLabel>
                    <Input
                      id="phone"
                      type="tel"
                      {...field}
                      aria-invalid={fieldState.invalid}
                      className="profile-input"
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                name="website"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel
                      htmlFor="website"
                      className="profile-field-label"
                    >
                      Website
                    </FieldLabel>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://"
                      {...field}
                      aria-invalid={fieldState.invalid}
                      className="profile-input"
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                name="bio"
                control={control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="md:col-span-2"
                  >
                    <FieldLabel htmlFor="bio" className="profile-field-label">
                      Bio
                    </FieldLabel>
                    <Textarea
                      id="bio"
                      rows={4}
                      {...field}
                      aria-invalid={fieldState.invalid}
                      className="min-h-28 rounded-xs resize-none"
                    />
                    <FieldDescription>
                      A short summary shown on your profile.
                    </FieldDescription>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Controller
                name="twitter"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel
                      htmlFor="twitter"
                      className="profile-field-label"
                    >
                      Twitter
                    </FieldLabel>
                    <Input
                      id="twitter"
                      placeholder="@handle"
                      {...field}
                      aria-invalid={fieldState.invalid}
                      className="profile-input"
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                name="github"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel
                      htmlFor="github"
                      className="profile-field-label"
                    >
                      GitHub
                    </FieldLabel>
                    <Input
                      id="github"
                      placeholder="username"
                      {...field}
                      aria-invalid={fieldState.invalid}
                      className="profile-input"
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                name="linkedin"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel
                      htmlFor="linkedin"
                      className="profile-field-label"
                    >
                      LinkedIn
                    </FieldLabel>
                    <Input
                      id="linkedin"
                      placeholder="profile-slug"
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
          form="general-profile-form"
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
