const PROJECT_FIELDS = `
  id
  organizationId
  teamId
  name
  key
  description
  createdAt
  updatedAt
`;

const TASK_FIELDS = `
  id
  projectId
  key
  taskNumber
  title
  description
  status
  priority
  dueDate
  assignee {
    id
    email
    displayName
    createdAt
  }
  reporterId
  createdAt
  updatedAt
`;

const ATTACHMENT_FIELDS = `
  id
  taskId
  addedBy
  kind
  label
  url
  createdAt
`;

const TEAM_FIELDS = `
  id
  organizationId
  name
  createdAt
  updatedAt
`;

const USER_FIELDS = `
  id
  email
  displayName
  createdAt
`;

export const TEAMS_QUERY = `
  query Teams {
    teams {
      ${TEAM_FIELDS}
    }
  }
`;

export const TEAM_MEMBERS_QUERY = `
  query TeamMembers($teamId: ID!) {
    teamMembers(teamId: $teamId) {
      teamId
      userId
      role
      joinedAt
      user {
        ${USER_FIELDS}
      }
    }
  }
`;

export const ORG_MEMBERS_QUERY = `
  query OrgMembers {
    orgMembers {
      userId
      role
      joinedAt
      user {
        ${USER_FIELDS}
      }
    }
  }
`;

export const CREATE_TEAM_MUTATION = `
  mutation CreateTeam($input: CreateTeamInput!) {
    createTeam(input: $input) {
      ${TEAM_FIELDS}
    }
  }
`;

export const ADD_TEAM_MEMBER_MUTATION = `
  mutation AddTeamMember($input: AddTeamMemberInput!) {
    addTeamMember(input: $input) {
      teamId
      userId
      role
      joinedAt
      user {
        ${USER_FIELDS}
      }
    }
  }
`;

export const REMOVE_TEAM_MEMBER_MUTATION = `
  mutation RemoveTeamMember($input: RemoveTeamMemberInput!) {
    removeTeamMember(input: $input)
  }
`;

export const PROJECTS_QUERY = `
  query Projects {
    projects {
      ${PROJECT_FIELDS}
    }
  }
`;

export const PROJECT_QUERY = `
  query Project($id: ID!) {
    project(id: $id) {
      ${PROJECT_FIELDS}
    }
  }
`;

export const TASKS_QUERY = `
  query Tasks($projectId: ID!, $status: GqlTaskStatus) {
    tasks(projectId: $projectId, status: $status) {
      ${TASK_FIELDS}
    }
  }
`;

export const TASK_QUERY = `
  query Task($id: ID!, $projectId: ID!) {
    task(id: $id, projectId: $projectId) {
      ${TASK_FIELDS}
    }
  }
`;

export const CREATE_PROJECT_MUTATION = `
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      ${PROJECT_FIELDS}
    }
  }
`;

export const CREATE_TASK_MUTATION = `
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      ${TASK_FIELDS}
    }
  }
`;

export const ADD_ATTACHMENT_MUTATION = `
  mutation AddAttachment($input: AddAttachmentInput!) {
    addAttachment(input: $input) {
      ${ATTACHMENT_FIELDS}
    }
  }
`;

export const REMOVE_ATTACHMENT_MUTATION = `
  mutation RemoveAttachment($attachmentId: ID!, $projectId: ID!) {
    removeAttachment(attachmentId: $attachmentId, projectId: $projectId)
  }
`;

export const ATTACHMENTS_QUERY = `
  query Attachments($taskId: ID!, $projectId: ID!) {
    attachments(taskId: $taskId, projectId: $projectId) {
      ${ATTACHMENT_FIELDS}
    }
  }
`;

export const UPDATE_TASK_STATUS_MUTATION = `
  mutation UpdateTaskStatus($input: UpdateTaskStatusInput!) {
    updateTaskStatus(input: $input) {
      ${TASK_FIELDS}
    }
  }
`;

export const ASSIGN_TASK_MUTATION = `
  mutation AssignTask($input: AssignTaskInput!) {
    assignTask(input: $input) {
      ${TASK_FIELDS}
    }
  }
`;

export const DELETE_TASK_MUTATION = `
  mutation DeleteTask($taskId: ID!, $projectId: ID!) {
    deleteTask(taskId: $taskId, projectId: $projectId)
  }
`;

export const TASK_UPDATED_SUBSCRIPTION = `
  subscription TaskUpdated($projectId: ID!) {
    taskUpdated(projectId: $projectId) {
      kind
      taskId
      projectId
      task {
        ${TASK_FIELDS}
      }
    }
  }
`;

export const UPDATE_PROJECT_MUTATION = `
  mutation UpdateProject($input: UpdateProjectInput!) {
    updateProject(input: $input) {
      ${PROJECT_FIELDS}
    }
  }
`;

export const DELETE_PROJECT_MUTATION = `
  mutation DeleteProject($projectId: ID!) {
    deleteProject(projectId: $projectId)
  }
`;

export const ADD_PROJECT_MEMBER_MUTATION = `
  mutation AddProjectMember($input: AddProjectMemberInput!) {
    addProjectMember(input: $input)
  }
`;
