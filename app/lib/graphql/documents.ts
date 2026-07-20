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
  commentCount
  attachmentCount
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

const COMMENT_FIELDS = `
  id
  taskId
  authorId
  body
  isEdited
  createdAt
  editedAt
  author {
    ${USER_FIELDS}
  }
`;

const CHANNEL_FIELDS = `
  id
  slug
  name
  description
  kind
  createdAt
`;

const MESSAGE_EMBED_FIELDS = `
  kind
  url
  title
  description
  imageUrl
  siteName
  repo
  sha
  number
  state
`;

const CHANNEL_MESSAGE_FIELDS = `
  id
  channelId
  authorId
  isEdited
  body
  createdAt
  editedAt
  embeds {
    ${MESSAGE_EMBED_FIELDS}
  }
`;

const DM_THREAD_FIELDS = `
  id
  participantA
  participantB
  createdAt
`;

const DM_MESSAGE_FIELDS = `
  id
  threadId
  authorId
  body
  createdAt
  editedAt
  isEdited
  isRead
  readByRecipientAt
`;

const REACTION_FIELDS = `
  emoji
  count
  reactedByMe
`;

const PRESENCE_FIELDS = `
  userId
  status
`;

export const ME_QUERY = `
  query Me {
    me {
      ${USER_FIELDS}
    }
  }
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

export const COMMENTS_QUERY = `
  query Comments($taskId: ID!, $projectId: ID!) {
    comments(taskId: $taskId, projectId: $projectId) {
      ${COMMENT_FIELDS}
    }
  }
`;

export const CREATE_COMMENT_MUTATION = `
  mutation CreateComment($input: CreateCommentInput!) {
    createComment(input: $input) {
      ${COMMENT_FIELDS}
    }
  }
`;

export const DELETE_COMMENT_MUTATION = `
  mutation DeleteComment($commentId: ID!, $projectId: ID!) {
    deleteComment(commentId: $commentId, projectId: $projectId)
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

export const CHANNEL_QUERY = `
  query Channel($id: ID!) {
    channel(id: $id) {
      ${CHANNEL_FIELDS}
    }
  }
`;

export const CHANNEL_MESSAGES_QUERY = `
  query ChannelMessages($channelId: ID!, $beforeId: ID, $limit: Int) {
    channelMessages(channelId: $channelId, beforeId: $beforeId, limit: $limit) {
      ${CHANNEL_MESSAGE_FIELDS}
    }
  }
`;

export const CREATE_CHANNEL_MUTATION = `
  mutation CreateChannel($slug: String!, $name: String!, $description: String!) {
    createChannel(slug: $slug, name: $name, description: $description) {
      ${CHANNEL_FIELDS}
    }
  }
`;

export const JOIN_CHANNEL_MUTATION = `
  mutation JoinChannel($channelId: ID!) {
    joinChannel(channelId: $channelId) {
      ${CHANNEL_FIELDS}
    }
  }
`;

export const SEND_MESSAGE_MUTATION = `
  mutation SendMessage($channelId: ID!, $body: String!) {
    sendMessage(channelId: $channelId, body: $body) {
      ${CHANNEL_MESSAGE_FIELDS}
    }
  }
`;

// export const DELETE_CHANNEL_MUTATION = `
//   mutation DeleteChannel($id: ID!) {
//     deleteChannel(id: $id)
//   }
// `;

export const ADD_REACTION_MUTATION = `
  mutation AddReaction($messageId: ID!, $emoji: String!) {
    addReaction(messageId: $messageId, emoji: $emoji) {
      ${REACTION_FIELDS}
    }
  }
`;

export const REMOVE_REACTION_MUTATION = `
  mutation RemoveReaction($messageId: ID!, $emoji: String!) {
    removeReaction(messageId: $messageId, emoji: $emoji) {
      ${REACTION_FIELDS}
    }
  }
`;

export const OPEN_DM_MUTATION = `
  mutation OpenDm($otherUserId: ID!) {
    openDm(otherUserId: $otherUserId) {
      ${DM_THREAD_FIELDS}
    }
  }
`;

export const DM_THREADS_QUERY = `
  query DmThreads {
    dmThreads {
      ${DM_THREAD_FIELDS}
    }
  }
`;

export const DM_MESSAGES_QUERY = `
  query DmMessages($threadId: ID!) {
    dmMessages(threadId: $threadId) {
      ${DM_MESSAGE_FIELDS}
    }
  }
`;

export const SEND_DM_MUTATION = `
  mutation SendDm($threadId: ID!, $body: String!) {
    sendDm(threadId: $threadId, body: $body) {
      ${DM_MESSAGE_FIELDS}
    }
  }
`;

export const CHANNEL_MESSAGES_SUBSCRIPTION = `
  subscription ChannelMessages($channelId: ID!) {
    channelMessages(channelId: $channelId) {
      ${CHANNEL_MESSAGE_FIELDS}
    }
  }
`;

export const DM_RECEIVED_SUBSCRIPTION = `
  subscription DmMessages($threadId: ID!) {
    dmMessages(threadId: $threadId) {
      ${DM_MESSAGE_FIELDS}
    }
  }
`;

export const PRESENCE_SUBSCRIPTION = `
  subscription Presence {
    presence {
      ${PRESENCE_FIELDS}
    }
  }
`;

// export const MESSAGE_REACTIONS_SUBSCRIPTION = `
//   subscription MessageReactions($messageId: ID!) {
//     messageReactions(messageId: $messageId) {
//       ${REACTION_FIELDS}
//     }
//   }
// `;
