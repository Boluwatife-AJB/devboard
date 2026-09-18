import { EnvelopeSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const labelClassName =
  "pl-1 font-mono text-xs font-medium tracking-wide text-gray-400 uppercase";

const inputClassName =
  "cursor-not-allowed border border-devboard-neutral bg-muted/40 py-6 pl-11 text-base text-muted-foreground";

type LockedInviteEmailFieldProps = {
  email: string;
  id?: string;
  isLoading?: boolean;
};

export function LockedInviteEmailField({
  email,
  id = "invite-email",
  isLoading = false,
}: LockedInviteEmailFieldProps) {
  return (
    <Field>
      <FieldLabel htmlFor={id} className={labelClassName}>
        Work Email
      </FieldLabel>
      <div className="relative">
        <EnvelopeSimpleIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type="email"
          name={id}
          value={isLoading ? "" : email}
          placeholder={isLoading ? "Loading invitation…" : undefined}
          readOnly
          disabled
          aria-readonly="true"
          autoComplete="email"
          className={cn(inputClassName, isLoading && "animate-pulse")}
        />
      </div>
      <FieldDescription>
        This invitation is tied to this email and cannot be changed.
      </FieldDescription>
    </Field>
  );
}
