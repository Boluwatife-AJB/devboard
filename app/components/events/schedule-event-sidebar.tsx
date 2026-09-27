"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LinkSimpleIcon, PlusCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useCreateEvent } from "@/hooks/use-events";
import { useProjects } from "@/hooks/use-projects";
import { useOrgMembers, useTeams } from "@/hooks/use-teams";
import { getApiErrorMessage } from "@/lib/api";
import { createEventSchema } from "@/lib/schema";
import { cn } from "@/lib/utils";
import type { CreateEventFormData } from "@/types";
import { ScrollArea } from "../ui/scroll-area";
import {
  buildCreateEventInput,
  defaultCreateEventValues,
} from "./lib/create-event-input";
import { CREATE_EVENT_TYPE_OPTIONS } from "./lib/event-labels";

type ScheduleEventSidebarProps = {
  formId?: string;
  onCreated?: () => void;
};

export function ScheduleEventSidebar({
  formId = "schedule-event-form",
  onCreated,
}: ScheduleEventSidebarProps) {
  const createEvent = useCreateEvent();
  const { data: teams = [] } = useTeams();
  const { data: projects = [] } = useProjects();
  const { data: orgMembers = [] } = useOrgMembers();

  const { control, handleSubmit, reset, watch, setValue } =
    useForm<CreateEventFormData>({
      resolver: zodResolver(createEventSchema),
      mode: "onBlur",
      defaultValues: defaultCreateEventValues(),
    });

  const audienceType = watch("audienceType");
  const eventType = watch("eventType");
  const recurrenceKind = watch("recurrenceKind");

  const onSubmit = async (data: CreateEventFormData) => {
    try {
      const created = await createEvent.mutateAsync(
        buildCreateEventInput(data),
      );
      toast.success(`“${created.title}” scheduled`);
      reset(defaultCreateEventValues());
      onCreated?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <Card className="rounded-xs xl:sticky xl:top-4">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-base">
          <PlusCircleIcon className="size-4 text-muted-foreground" />
          Schedule New Event
        </CardTitle>
        <p className="text-xs text-muted-foreground">Fast entry</p>
      </CardHeader>
      <CardContent className="pt-4">
        <form id={formId} onSubmit={handleSubmit(onSubmit)}>
          <ScrollArea className="h-150">
            <FieldGroup className="gap-4">
              <Controller
                control={control}
                name="title"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor="event-title">Event title</FieldLabel>
                    <Input
                      id="event-title"
                      placeholder="Daily Engineering Standup"
                      className="rounded-xs"
                      aria-invalid={fieldState.invalid || undefined}
                      {...field}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Field>
                <FieldLabel>Event category</FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                  {CREATE_EVENT_TYPE_OPTIONS.slice(0, 4).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setValue("eventType", opt.value, {
                          shouldValidate: true,
                        })
                      }
                      className={cn(
                        "rounded-xs border px-2 py-2 text-left text-xs font-medium transition-colors",
                        eventType === opt.value
                          ? "border-devboard-primary bg-devboard-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:bg-muted/50",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Controller
                  control={control}
                  name="date"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel htmlFor="event-date">Date</FieldLabel>
                      <Input
                        id="event-date"
                        type="date"
                        className="rounded-xs"
                        aria-invalid={fieldState.invalid || undefined}
                        {...field}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  control={control}
                  name="startTime"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel htmlFor="event-start">Start</FieldLabel>
                      <Input
                        id="event-start"
                        type="time"
                        className="rounded-xs"
                        aria-invalid={fieldState.invalid || undefined}
                        {...field}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              <Controller
                control={control}
                name="endTime"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor="event-end">End time</FieldLabel>
                    <Input
                      id="event-end"
                      type="time"
                      className="rounded-xs"
                      aria-invalid={fieldState.invalid || undefined}
                      {...field}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="timezone"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor="event-tz">Timezone</FieldLabel>
                    <Input
                      id="event-tz"
                      placeholder="Africa/Lagos"
                      className="rounded-xs"
                      aria-invalid={fieldState.invalid || undefined}
                      {...field}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="audienceType"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Audience</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        if (value) field.onChange(value);
                      }}
                    >
                      <SelectTrigger className="w-full rounded-xs">
                        <SelectValue placeholder="Audience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ORGANIZATION">
                          Organization
                        </SelectItem>
                        <SelectItem value="TEAM">Team</SelectItem>
                        <SelectItem value="PROJECT">Project</SelectItem>
                        <SelectItem value="CUSTOM">Custom members</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />

              {audienceType === "TEAM" && (
                <Controller
                  control={control}
                  name="teamId"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel>Team</FieldLabel>
                      <Select
                        value={field.value ?? ""}
                        onValueChange={(value) => field.onChange(value ?? "")}
                      >
                        <SelectTrigger className="w-full rounded-xs">
                          <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                        <SelectContent>
                          {teams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              )}

              {audienceType === "PROJECT" && (
                <Controller
                  control={control}
                  name="projectId"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel>Project</FieldLabel>
                      <Select
                        value={field.value ?? ""}
                        onValueChange={(value) => field.onChange(value ?? "")}
                      >
                        <SelectTrigger className="w-full rounded-xs">
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              )}

              {audienceType === "CUSTOM" && (
                <Controller
                  control={control}
                  name="customUserIds"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel>Invitees</FieldLabel>
                      <div className="max-h-36 space-y-1 overflow-y-auto rounded-xs border border-border p-2">
                        {orgMembers.map((member) => {
                          const checked = (field.value ?? []).includes(
                            member.userId,
                          );
                          return (
                            <label
                              key={member.userId}
                              className="flex cursor-pointer items-center gap-2 rounded-xs px-1 py-1 text-sm hover:bg-muted/50"
                            >
                              <input
                                type="checkbox"
                                className="size-3.5 accent-[var(--devboard-primary,#6177A5)]"
                                checked={checked}
                                onChange={() => {
                                  const current = field.value ?? [];
                                  field.onChange(
                                    checked
                                      ? current.filter(
                                          (id) => id !== member.userId,
                                        )
                                      : [...current, member.userId],
                                  );
                                }}
                              />
                              <span className="truncate">
                                {member.displayName || member.userId}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              )}

              <Controller
                control={control}
                name="recurrenceKind"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Recurrence</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        if (value) field.onChange(value);
                      }}
                    >
                      <SelectTrigger className="w-full rounded-xs">
                        <SelectValue placeholder="Recurrence" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">Does not repeat</SelectItem>
                        <SelectItem value="DAILY">Daily</SelectItem>
                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                        <SelectItem value="YEARLY">Yearly</SelectItem>
                        <SelectItem value="INTERVAL_DAYS">
                          Every N days
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />

              {recurrenceKind === "INTERVAL_DAYS" && (
                <Controller
                  control={control}
                  name="intervalDays"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel htmlFor="interval-days">
                        Interval (days)
                      </FieldLabel>
                      <Input
                        id="interval-days"
                        type="number"
                        min={1}
                        className="rounded-xs"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined,
                          )
                        }
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              )}

              <Controller
                control={control}
                name="meetingUrl"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor="meeting-url">
                      Video / room URL
                    </FieldLabel>
                    <div className="relative">
                      <LinkSimpleIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="meeting-url"
                        placeholder="https://meet.google.com/..."
                        className="rounded-xs pl-9"
                        aria-invalid={fieldState.invalid || undefined}
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
                name="location"
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="event-location">Location</FieldLabel>
                    <Input
                      id="event-location"
                      placeholder="Room B / Online"
                      className="rounded-xs"
                      {...field}
                    />
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="event-description">
                      Description
                    </FieldLabel>
                    <Textarea
                      id="event-description"
                      placeholder="Agenda or notes"
                      className="min-h-20 rounded-xs"
                      {...field}
                    />
                  </Field>
                )}
              />

              <Button
                type="submit"
                className="w-full rounded-xs"
                disabled={createEvent.isPending}
              >
                {createEvent.isPending ? (
                  <>
                    <Spinner data-icon="inline-start" />
                    Scheduling…
                  </>
                ) : (
                  "Schedule event"
                )}
              </Button>
            </FieldGroup>
          </ScrollArea>
        </form>
      </CardContent>
    </Card>
  );
}
