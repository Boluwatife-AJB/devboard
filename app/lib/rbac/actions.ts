export const Action = {
  InviteOrgMember: "InviteOrgMember",
  ChangeOrgMemberRole: "ChangeOrgMemberRole",
  ViewOrgDashboard: "ViewOrgDashboard",
  CreateTeam: "CreateTeam",
  UpdateTeam: "UpdateTeam",
  DeleteTeam: "DeleteTeam",
  ManageTeamMembers: "ManageTeamMembers",
  CreateProject: "CreateProject",
  UpdateProject: "UpdateProject",
  DeleteProject: "DeleteProject",
  ManageProjectMembers: "ManageProjectMembers",
  ViewProject: "ViewProject",
  CreateTask: "CreateTask",
  UpdateTask: "UpdateTask",
  DeleteTask: "DeleteTask",
  AssignTask: "AssignTask",
  CreateChannel: "CreateChannel",
  ManageChannelMembers: "ManageChannelMembers",
  EditChannelInfo: "EditChannelInfo",
} as const;

export type Action = (typeof Action)[keyof typeof Action];
