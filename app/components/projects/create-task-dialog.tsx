"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { type ReactElement, useState } from "react";
import {
  Controller,
  type Resolver,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useAddAttachment } from "@/hooks/use-attachments";
import { useCreateTask } from "@/hooks/use-tasks";
import { useTeamMembers } from "@/hooks/use-teams";
import { getApiErrorMessage } from "@/lib/api";
import { createTaskSchema } from "@/lib/schema";
import { priorityLabels } from "@/lib/task-ui";
import type {
  ApiTeamMember,
  AttachmentKind,
  CreateTaskFormData,
  TaskPriority,
} from "@/types";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

const PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const UNASSIGNED = "__unassigned__";

const ATTACHMENT_KINDS: { value: AttachmentKind; label: string }[] = [
  { value: "LINK", label: "Link / Document" },
  { value: "GITHUB_ISSUE", label: "GitHub Issue" },
  { value: "GITHUB_PR", label: "GitHub PR" },
];

function toIsoDueDate(localValue: string | undefined): string | null {
  if (!localValue?.trim()) return null;
  const date = new Date(localValue);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function memberLabel(member: ApiTeamMember): string {
  if (member.user?.displayName) return member.user.displayName;
  if (member.user?.email) return member.user.email;
  return member.userId;
}

export function CreateTaskDialog({
  projectId,
  teamId,
  trigger,
}: {
  projectId: string;
  teamId: string;
  trigger: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);

  const createTask = useCreateTask(projectId);
  const addAttachment = useAddAttachment(projectId);
  const { data: members, isPending: isMembersPending } = useTeamMembers(
    open ? teamId : "",
  );
  const isSubmitting = createTask.isPending || addAttachment.isPending;

  const { control, handleSubmit, reset } = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema) as Resolver<CreateTaskFormData>,
    mode: "onBlur",
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
      assigneeId: "",
      dueDate: "",
      attachments: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "attachments",
  });

  const onSubmit = async (data: CreateTaskFormData) => {
    try {
      const task = await createTask.mutateAsync({
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        assigneeId: data.assigneeId?.trim() ? data.assigneeId : null,
        dueDate: toIsoDueDate(data.dueDate),
      });

      if (data.attachments.length > 0) {
        await Promise.all(
          data.attachments.map((attachment) =>
            addAttachment.mutateAsync({
              taskId: task.id,
              kind: attachment.kind,
              label: attachment.label,
              url: attachment.url,
            }),
          ),
        );
      }

      toast.success(`Task ${task.key} created`);
      reset();
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
          <DialogDescription>
            New tasks start in the backlog column. You can assign a teammate,
            attach links or documents, and set a due date.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4">
            <Controller
              control={control}
              name="title"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="task-title">Title</FieldLabel>
                  <Input
                    id="task-title"
                    placeholder="Implement federated auth"
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
              name="description"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="task-description">
                    Description
                  </FieldLabel>
                  <Textarea
                    id="task-description"
                    placeholder="Add more context... (optional)"
                    rows={4}
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
              name="assigneeId"
              render={({ field, fieldState }) => {
                const selected = members?.find(
                  (member) => member.userId === field.value,
                );
                return (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor="task-assignee">Assignee</FieldLabel>
                    <Select
                      value={field.value || UNASSIGNED}
                      onValueChange={(value) =>
                        field.onChange(
                          !value || value === UNASSIGNED ? "" : value,
                        )
                      }
                      items={members?.map((member) => ({
                        label: memberLabel(member),
                        value: member.userId,
                      }))}
                    >
                      <SelectTrigger
                        id="task-assignee"
                        className="w-full"
                        aria-invalid={fieldState.invalid || undefined}
                        disabled={!teamId || isMembersPending}
                        onBlur={field.onBlur}
                      >
                        <SelectValue>
                          {selected
                            ? memberLabel(selected)
                            : isMembersPending
                              ? "Loading members..."
                              : "Unassigned"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false}>
                        <SelectGroup>
                          <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                          {members?.map((member) => (
                            <SelectItem
                              key={member.userId}
                              value={member.userId}
                            >
                              {memberLabel(member)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldDescription>Optional</FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                );
              }}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={control}
                name="priority"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor="task-priority">Priority</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value)}
                      items={PRIORITIES.map((priority) => ({
                        label: priorityLabels[priority],
                        value: priority,
                      }))}
                    >
                      <SelectTrigger id="task-priority" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {PRIORITIES.map((priority) => (
                            <SelectItem key={priority} value={priority}>
                              {priorityLabels[priority]}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="dueDate"
                render={({ field, fieldState }) => {
                  const selectedDate = field.value
                    ? new Date(field.value)
                    : undefined;

                  return (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel htmlFor="task-due-date">Due date</FieldLabel>
                      <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                        <PopoverTrigger
                          render={
                            <Button
                              variant="outline"
                              id="date"
                              className="justify-start font-normal w-full"
                              aria-invalid={fieldState.invalid || undefined}
                            >
                              {selectedDate &&
                              !Number.isNaN(selectedDate.getTime())
                                ? selectedDate.toLocaleDateString()
                                : "Select due date"}
                            </Button>
                          }
                        />
                        <PopoverContent
                          className="w-auto overflow-hidden p-0"
                          align="start"
                        >
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            defaultMonth={selectedDate}
                            captionLayout="dropdown"
                            onSelect={(date) => {
                              field.onChange(date?.toISOString() || "");
                              setDueDateOpen(false);
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      <FieldDescription>Optional</FieldDescription>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  );
                }}
              />
            </div>

            <Field>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <FieldLabel>Attachments</FieldLabel>
                  <FieldDescription>
                    Add links, documents, or GitHub references
                  </FieldDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ kind: "LINK", label: "", url: "" })}
                >
                  <PlusIcon data-icon="inline-start" />
                  Add
                </Button>
              </div>

              {fields.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No attachments yet.
                </p>
              )}

              <div className="flex flex-col gap-3">
                {fields.map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded-none border border-border bg-background/50 p-3 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Controller
                        control={control}
                        name={`attachments.${index}.kind`}
                        render={({ field, fieldState }) => (
                          <Field
                            className="flex-1"
                            data-invalid={fieldState.invalid || undefined}
                          >
                            <FieldLabel htmlFor={`attachment-kind-${index}`}>
                              Type
                            </FieldLabel>
                            <Select
                              value={field.value}
                              onValueChange={(value) => field.onChange(value)}
                              items={ATTACHMENT_KINDS.map((kind) => ({
                                label: kind.label,
                                value: kind.value,
                              }))}
                            >
                              <SelectTrigger
                                id={`attachment-kind-${index}`}
                                className="w-full"
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  {ATTACHMENT_KINDS.map((kind) => (
                                    <SelectItem
                                      key={kind.value}
                                      value={kind.value}
                                    >
                                      {kind.label}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-6"
                        onClick={() => remove(index)}
                        aria-label="Remove attachment"
                      >
                        <TrashIcon />
                      </Button>
                    </div>

                    <Controller
                      control={control}
                      name={`attachments.${index}.label`}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid || undefined}>
                          <FieldLabel htmlFor={`attachment-label-${index}`}>
                            Label
                          </FieldLabel>
                          <Input
                            id={`attachment-label-${index}`}
                            placeholder="Design spec"
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
                      name={`attachments.${index}.url`}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid || undefined}>
                          <FieldLabel htmlFor={`attachment-url-${index}`}>
                            URL
                          </FieldLabel>
                          <Input
                            id={`attachment-url-${index}`}
                            placeholder="https://..."
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
                ))}
              </div>
            </Field>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Spinner data-icon="inline-start" />}
                Add Task
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
