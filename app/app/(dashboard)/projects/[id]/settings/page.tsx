"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  TrashIcon,
  UserPlusIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  useAddProjectMember,
  useDeleteProject,
  useProject,
  useUpdateProject,
} from "@/hooks/use-projects";
import { useOrgMembers, useTeamMembers } from "@/hooks/use-teams";
import { getApiErrorMessage } from "@/lib/api";
import { addProjectMemberSchema, updateProjectSchema } from "@/lib/schema";
import { initialsOf } from "@/lib/task-ui";
import type {
  AddProjectMemberFormData,
  ProjectRole,
  UpdateProjectFormData,
} from "@/types";

const projectRoles: { value: ProjectRole; label: string }[] = [
  { value: "VIEWER", label: "Viewer" },
  { value: "CONTRIBUTOR", label: "Contributor" },
  { value: "ADMIN", label: "Admin" },
  { value: "OWNER", label: "Owner" },
];

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="gap-0 rounded-xs border border-[#2A2A2A] bg-[#131313] py-0 ring-0">
        <CardContent className="space-y-4 p-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-9 w-28" />
        </CardContent>
      </Card>
      <Card className="gap-0 rounded-xs border border-[#2A2A2A] bg-[#131313] py-0 ring-0">
        <CardContent className="space-y-4 p-6">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const {
    data: project,
    isPending,
    isError,
    error,
    refetch,
  } = useProject(projectId);
  const updateProject = useUpdateProject(projectId);
  const deleteProject = useDeleteProject();
  const addProjectMember = useAddProjectMember(projectId);
  const { data: teamMembers, isPending: isTeamMembersPending } = useTeamMembers(
    project?.teamId ?? "",
  );
  const { data: orgMembers, isPending: isOrgMembersPending } = useOrgMembers();

  const {
    control: detailsControl,
    handleSubmit: handleDetailsSubmit,
    reset: resetDetails,
  } = useForm<UpdateProjectFormData>({
    resolver: zodResolver(updateProjectSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const {
    control: memberControl,
    handleSubmit: handleMemberSubmit,
    reset: resetMember,
  } = useForm<AddProjectMemberFormData>({
    resolver: zodResolver(addProjectMemberSchema),
    mode: "onBlur",
    defaultValues: {
      userId: "",
      roleOverride: "CONTRIBUTOR",
    },
  });

  useEffect(() => {
    if (project) {
      resetDetails({
        name: project.name,
        description: project.description ?? "",
      });
    }
  }, [project, resetDetails]);

  const teamUserIds = new Set(teamMembers?.map((member) => member.userId));
  const availableOrgMembers =
    orgMembers?.filter(
      (member) => member.user && !teamUserIds.has(member.userId),
    ) ?? [];

  const onUpdateDetails = async (data: UpdateProjectFormData) => {
    try {
      await updateProject.mutateAsync({
        name: data.name,
        description: data.description || null,
      });
      toast.success("Project details updated");
    } catch (mutationError) {
      toast.error(getApiErrorMessage(mutationError));
    }
  };

  const onAddMember = async (data: AddProjectMemberFormData) => {
    try {
      await addProjectMember.mutateAsync({
        userId: data.userId,
        roleOverride: data.roleOverride ?? null,
      });
      toast.success("Project member added");
      resetMember({
        userId: "",
        roleOverride: "CONTRIBUTOR",
      });
    } catch (mutationError) {
      toast.error(getApiErrorMessage(mutationError));
    }
  };

  const onDeleteProject = () => {
    deleteProject.mutate(projectId, {
      onSuccess: () => {
        toast.success(
          project ? `Project ${project.key} deleted` : "Project deleted",
        );
        router.push("/projects");
      },
      onError: (mutationError) =>
        toast.error(getApiErrorMessage(mutationError)),
    });
  };

  if (isError) {
    return (
      <Empty className="border border-dashed border-devboard-primary/30 py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <WarningCircleIcon />
          </EmptyMedia>
          <EmptyTitle>Could not load project settings</EmptyTitle>
          <EmptyDescription>{getApiErrorMessage(error)}</EmptyDescription>
        </EmptyHeader>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
          <Button render={<Link href={`/projects/${projectId}`} />}>
            Back to project
          </Button>
        </div>
      </Empty>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Breadcrumb>
        <BreadcrumbList className="text-[10px] font-semibold uppercase tracking-wider text-[#C2C6D6]">
          <BreadcrumbItem>
            <BreadcrumbLink
              href="/projects"
              className="text-[#C2C6D6] hover:text-white"
            >
              Projects
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-[#4A4A4A]" />
          <BreadcrumbItem>
            <BreadcrumbLink
              href={`/projects/${projectId}`}
              className="text-[#C2C6D6] hover:text-white"
            >
              {project?.name ?? "Project"}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-[#4A4A4A]" />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-white">Settings</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-2">
        <h2 className="font-heading text-3xl font-semibold text-white">
          Project Settings
        </h2>
        <p className="text-sm text-[#C2C6D6]">
          Manage details, members, and danger-zone actions for this project.
        </p>
      </div>

      {isPending && <SettingsSkeleton />}

      {project && (
        <>
          <Card className="gap-0 rounded-xs border border-[#2A2A2A] bg-[#131313] py-0 ring-0">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-white">
                  Project details
                </h3>
                <Badge
                  variant="outline"
                  className="h-5 rounded-xs border-0 bg-[#353534] px-2 font-mono text-[10px] text-[#C2C6D6]"
                >
                  {project.key}
                </Badge>
              </div>

              <form onSubmit={handleDetailsSubmit(onUpdateDetails)}>
                <FieldGroup className="gap-4">
                  <Controller
                    control={detailsControl}
                    name="name"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid || undefined}>
                        <FieldLabel htmlFor="settings-name">Name</FieldLabel>
                        <Input
                          id="settings-name"
                          placeholder="Project name"
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
                    control={detailsControl}
                    name="description"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid || undefined}>
                        <FieldLabel htmlFor="settings-description">
                          Description
                        </FieldLabel>
                        <Textarea
                          id="settings-description"
                          placeholder="What is this project about?"
                          className="resize-none"
                          rows={4}
                          {...field}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      className="rounded-xs"
                      disabled={updateProject.isPending}
                    >
                      {updateProject.isPending && (
                        <Spinner data-icon="inline-start" />
                      )}
                      Save changes
                    </Button>
                  </div>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>

          <Card className="gap-0 rounded-xs border border-[#2A2A2A] bg-[#131313] py-0 ring-0">
            <CardContent className="space-y-5 p-6">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Team members
                </h3>
                <p className="mt-1 text-xs text-[#8A8A8A]">
                  Members of the linked team have implicit access to this
                  project.
                </p>
              </div>

              {isTeamMembersPending ? (
                <div className="space-y-3">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : teamMembers && teamMembers.length > 0 ? (
                <ul className="divide-y divide-[#2A2A2A] rounded-xs border border-[#2A2A2A]">
                  {teamMembers.map((member) => (
                    <li
                      key={member.userId}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="size-8 shrink-0">
                          <AvatarFallback className="bg-[#353534] text-[10px] text-white">
                            {initialsOf(member.user?.displayName ?? "?")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">
                            {member.user?.displayName ?? "Unknown user"}
                          </p>
                          <p className="truncate text-xs text-[#8A8A8A]">
                            {member.user?.email ?? member.userId}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="h-5 shrink-0 rounded-xs border-[#4A4A4A] bg-transparent px-2 text-[10px] uppercase text-[#C2C6D6]"
                      >
                        {member.role}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[#8A8A8A]">
                  No team members found for this project&apos;s team.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="gap-0 rounded-xs border border-[#2A2A2A] bg-[#131313] py-0 ring-0">
            <CardContent className="space-y-5 p-6">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Add project member
                </h3>
                <p className="mt-1 text-xs text-[#8A8A8A]">
                  Grant project access to an organization member who is not on
                  the team, with an optional role override.
                </p>
              </div>

              <form onSubmit={handleMemberSubmit(onAddMember)}>
                <FieldGroup className="gap-4">
                  <Controller
                    control={memberControl}
                    name="userId"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid || undefined}>
                        <FieldLabel htmlFor="settings-member">
                          Organization member
                        </FieldLabel>
                        <Select
                          value={field.value || null}
                          onValueChange={(value) => field.onChange(value ?? "")}
                        >
                          <SelectTrigger
                            id="settings-member"
                            className="w-full"
                            aria-invalid={fieldState.invalid || undefined}
                            disabled={
                              isOrgMembersPending ||
                              availableOrgMembers.length === 0
                            }
                            onBlur={field.onBlur}
                          >
                            <SelectValue>
                              {field.value
                                ? (availableOrgMembers.find(
                                    (member) => member.userId === field.value,
                                  )?.user?.displayName ?? "Select a member")
                                : isOrgMembersPending
                                  ? "Loading members..."
                                  : availableOrgMembers.length === 0
                                    ? "No eligible members"
                                    : "Select a member"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent alignItemWithTrigger={false}>
                            <SelectGroup>
                              {availableOrgMembers.map((member) => (
                                <SelectItem
                                  key={member.userId}
                                  value={member.userId}
                                >
                                  {member.user?.displayName ?? member.userId}
                                  {member.user?.email
                                    ? ` (${member.user.email})`
                                    : ""}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <FieldDescription>
                          Team members already have access and are hidden here.
                        </FieldDescription>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    control={memberControl}
                    name="roleOverride"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid || undefined}>
                        <FieldLabel htmlFor="settings-role">
                          Project role
                        </FieldLabel>
                        <Select
                          value={field.value || null}
                          onValueChange={(value) =>
                            field.onChange(
                              (value as ProjectRole | null) ?? "CONTRIBUTOR",
                            )
                          }
                        >
                          <SelectTrigger
                            id="settings-role"
                            className="w-full"
                            aria-invalid={fieldState.invalid || undefined}
                            onBlur={field.onBlur}
                          >
                            <SelectValue>
                              {projectRoles.find(
                                (role) => role.value === field.value,
                              )?.label ?? "Contributor"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent alignItemWithTrigger={false}>
                            <SelectGroup>
                              {projectRoles.map((role) => (
                                <SelectItem key={role.value} value={role.value}>
                                  {role.label}
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

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      className="rounded-xs"
                      disabled={
                        addProjectMember.isPending ||
                        availableOrgMembers.length === 0
                      }
                    >
                      {addProjectMember.isPending ? (
                        <Spinner data-icon="inline-start" />
                      ) : (
                        <UserPlusIcon data-icon="inline-start" />
                      )}
                      Add member
                    </Button>
                  </div>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>

          <Card className="gap-0 rounded-xs border border-[#FF6B6B33] bg-[#131313] py-0 ring-0">
            <CardContent className="space-y-4 p-6">
              <div>
                <h3 className="text-sm font-semibold text-[#FF6B6B]">
                  Danger zone
                </h3>
                <p className="mt-1 text-xs text-[#8A8A8A]">
                  Deleting this project permanently removes its tasks and cannot
                  be undone.
                </p>
              </div>

              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      variant="destructive"
                      className="rounded-xs"
                      disabled={deleteProject.isPending}
                    >
                      {deleteProject.isPending ? (
                        <Spinner data-icon="inline-start" />
                      ) : (
                        <TrashIcon data-icon="inline-start" />
                      )}
                      Delete project
                    </Button>
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {project.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete project{" "}
                      <span className="font-mono text-foreground">
                        {project.key}
                      </span>{" "}
                      and all of its tasks. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={onDeleteProject}
                    >
                      Delete project
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
