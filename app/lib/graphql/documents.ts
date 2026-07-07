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
