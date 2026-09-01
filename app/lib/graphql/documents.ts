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
  isMember
  unreadCount
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

const REACTION_FIELDS = `
  emoji
  count
  reactedByMe
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
  reactions {
    ${REACTION_FIELDS}
  }
`;

const DM_THREAD_FIELDS = `
  id
  participantA
  participantB
  createdAt
  unreadCount
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
      displayName
      avatarUrl
      joinedAt
      user {
        ${USER_FIELDS}
      }
    }
  }
`;

export const MY_ORGANIZATIONS_QUERY = `
  query MyOrganizations {
    myOrganizations {
      id
      name
      slug
      role
    }
  }
`;

export const MY_ORG_PROFILE_QUERY = `
  query MyOrgProfile {
    myOrgProfile {
      organizationId
      userId
      email
      displayName
      avatarUrl
      role
      joinedAt
    }
  }
`;

export const UPDATE_ORG_PROFILE_MUTATION = `
  mutation UpdateOrgProfile($input: UpdateOrgProfileInput!) {
    updateOrgProfile(input: $input) {
      organizationId
      userId
      email
      displayName
      avatarUrl
      role
      joinedAt
    }
  }
`;

const INVITATION_FIELDS = `
  id
  email
  role
  status
  invitedBy
  inviteUrl
  expiresAt
  createdAt
`;

export const NOTIFICATION_FIELDS = `
  id
  kind
  title
  body
  actionUrl
  isRead
  createdAt
`;

export const PENDING_INVITATIONS_QUERY = `
  query PendingInvitations {
    pendingInvitations {
      ${INVITATION_FIELDS}
    }
  }
`;

export const REVOKE_INVITATION_MUTATION = `
  mutation RevokeInvitation($invitationId: ID!) {
    revokeInvitation(invitationId: $invitationId)
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
    addTeamMember(input: $input)
  }
`;

export const REMOVE_TEAM_MEMBER_MUTATION = `
  mutation RemoveTeamMember($teamId: ID!, $userId: ID!) {
    removeTeamMember(teamId: $teamId, userId: $userId)
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

export const CHANNELS_QUERY = `
  query Channels {
    channels {
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
  mutation CreateChannel($input: CreateChannelInput!) {
    createChannel(input: $input) {
      ${CHANNEL_FIELDS}
    }
  }
`;

export const JOIN_CHANNEL_MUTATION = `
  mutation JoinChannel($channelId: ID!) {
    joinChannel(channelId: $channelId)
  }
`;

const CHANNEL_MEMBER_FIELDS = `
  channelId
  userId
  joinedAt
  user {
    ${USER_FIELDS}
  }
`;

export const CHANNEL_MEMBERS_QUERY = `
  query ChannelMembers($channelId: ID!) {
    channelMembers(channelId: $channelId) {
      ${CHANNEL_MEMBER_FIELDS}
    }
  }
`;

export const ADD_CHANNEL_MEMBER_MUTATION = `
  mutation AddChannelMember($input: AddChannelMemberInput!) {
    addChannelMember(input: $input)
  }
`;

export const LEAVE_CHANNEL_MUTATION = `
  mutation LeaveChannel($channelId: ID!) {
    leaveChannel(channelId: $channelId)
  }
`;

export const REMOVE_CHANNEL_MEMBER_MUTATION = `
  mutation RemoveChannelMember($input: RemoveChannelMemberInput!) {
    removeChannelMember(input: $input)
  }
`;

export const SEND_MESSAGE_MUTATION = `
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      ${CHANNEL_MESSAGE_FIELDS}
    }
  }
`;

export const EDIT_MESSAGE_MUTATION = `
  mutation EditMessage($input: EditMessageInput!) {
    editMessage(input: $input) {
      ${CHANNEL_MESSAGE_FIELDS}
    }
  }
`;

export const DELETE_MESSAGE_MUTATION = `
  mutation DeleteMessage($input: DeleteMessageInput!) {
    deleteMessage(input: $input)
  }
`;

export const EDIT_DM_MUTATION = `
  mutation EditDm($input: EditDmInput!) {
    editDm(input: $input) {
      ${DM_MESSAGE_FIELDS}
    }
  }
`;

export const DELETE_DM_MUTATION = `
  mutation DeleteDm($input: DeleteDmInput!) {
    deleteDm(input: $input)
  }
`;

export const CLEAR_CHANNEL_MESSAGES_MUTATION = `
  mutation ClearChannelMessages($channelId: ID!) {
    clearChannelMessages(channelId: $channelId)
  }
`;

export const CLEAR_DM_MESSAGES_MUTATION = `
  mutation ClearDmMessages($threadId: ID!) {
    clearDmMessages(threadId: $threadId)
  }
`;

export const ADD_REACTION_MUTATION = `
  mutation AddReaction($input: ReactionInput!) {
    addReaction(input: $input) {
      ${REACTION_FIELDS}
    }
  }
`;

export const REMOVE_REACTION_MUTATION = `
  mutation RemoveReaction($input: ReactionInput!) {
    removeReaction(input: $input) {
      ${REACTION_FIELDS}
    }
  }
`;

export const MARK_CHANNEL_AS_READ_MUTATION = `
  mutation MarkChannelAsRead($input: MarkChannelAsReadInput!) {
    markChannelAsRead(input: $input)
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
  query DmMessages($threadId: ID!, $beforeId: ID, $limit: Int) {
    dmMessages(threadId: $threadId, beforeId: $beforeId, limit: $limit) {
      ${DM_MESSAGE_FIELDS}
    }
  }
`;

export const SEND_DM_MUTATION = `
  mutation SendDm($input: SendDmInput!) {
    sendDm(input: $input) {
      ${DM_MESSAGE_FIELDS}
    }
  }
`;

export const MARK_DM_AS_READ_MUTATION = `
  mutation MarkDmAsRead($threadId: ID!) {
    markDmAsRead(threadId: $threadId)
  }
`;

const MESSAGE_EVENT_FIELDS = `
  kind
  channelId
  messageId
  message {
    ${CHANNEL_MESSAGE_FIELDS}
  }
`;

export const CHANNEL_MESSAGES_SUBSCRIPTION = `
  subscription ChannelMessages($channelId: ID!) {
    channelMessages(channelId: $channelId) {
      ${MESSAGE_EVENT_FIELDS}
    }
  }
`;

export const DM_RECEIVED_SUBSCRIPTION = `
  subscription DmReceived($threadId: ID!) {
    dmReceived(threadId: $threadId) {
      kind
      threadId
      messageId
      message {
        ${DM_MESSAGE_FIELDS}
      }
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

export const ORG_PRESENCE_QUERY = `
  query OrgPresence {
    orgPresence {
      ${PRESENCE_FIELDS}
    }
  }
`;

export const MESSAGE_REACTIONS_SUBSCRIPTION = `
  subscription MessageReactions($messageId: ID!) {
    messageReactions(messageId: $messageId) {
      channelId
      messageId
    }
  }
`;

export const NOTIFICATIONS_QUERY = `
  query Notifications($unreadOnly: Boolean, $limit: Int) {
    notifications(unreadOnly: $unreadOnly, limit: $limit) {
      ${NOTIFICATION_FIELDS}
    }
  }
`;

export const UNREAD_NOTIFICATION_COUNT_QUERY = `
  query UnreadNotificationCount {
    unreadNotificationCount
  }
`;

export const MARK_NOTIFICATION_READ_MUTATION = `
  mutation MarkNotificationRead($notificationId: ID!) {
    markNotificationRead(notificationId: $notificationId)
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ_MUTATION = `
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead
  }
`;

export const ANNOUNCEMENT_RECEIVED_SUBSCRIPTION = `
  subscription AnnouncementReceived {
    announcementReceived {
      ${NOTIFICATION_FIELDS}
    }
  }
`;

export const MY_DASHBOARD_QUERY = `
  query MyDashboard {
    myDashboard {
      greetingName
      organizationName
      emptyState {
        hasProjects
        hasTasks
        hasAssignedTasks
        primaryCta
      }
      setupProgress {
        persona
        completedCount
        totalCount
        steps {
          id
          label
          description
          completed
          href
        }
      }
      stats {
        tasksAssignedToMe
        tasksDueThisWeek
        overdueTasks
        tasksInProgress
      }
      myTasks {
        id
        projectId
        key
        title
        status
        priority
        dueDate
        isOverdue
      }
      myProjects {
        id
        name
        key
        openTasks
        myOpenTasks
      }
      upcomingEvents {
        id
        title
        startsAt
      }
      completionTrend {
        day
        completed
      }
    }
  }
`;

export const ORG_DASHBOARD_QUERY = `
  query OrgDashboard {
    orgDashboard {
      greetingName
      organizationName
      emptyState {
        hasProjects
        hasTasks
        hasAssignedTasks
        primaryCta
      }
      setupProgress {
        persona
        completedCount
        totalCount
        steps {
          id
          label
          description
          completed
          href
        }
      }
      stats {
        overdueTasks
        unassignedTasks
        unassignedUrgentTasks
        pendingInvites
        openTasks
        movedThisWeek
      }
      riskTasks {
        id
        projectId
        key
        title
        status
        priority
        dueDate
        isOverdue
      }
      attention {
        id
        kind
        title
        description
        actionLabel
        href
        count
      }
      workloadByTeam {
        team
        todo
        inProgress
        done
      }
      completionTrend {
        day
        completed
      }
    }
  }
`;
