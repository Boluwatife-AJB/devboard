import { faker } from "@faker-js/faker";
import { capitalize } from "@/lib/utils";

export type TaskUser = {
  id: string;
  name: string;
  image: string;
  initials: string;
  color: string;
};

export type TaskComment = {
  id: string;
  author: TaskUser;
  content: string;
  createdAt: Date;
  reactions?: { emoji: string; count: number }[];
};

export type TaskActivity = {
  id: string;
  type: "created" | "status" | "assigned";
  description: string;
  timestamp: Date;
};

export type KanbanColumn = {
  id: string;
  name: string;
  color: string;
};

export type ProjectTask = {
  id: string;
  taskId: string;
  scope: string;
  priority: "low" | "medium" | "high" | "critical";
  name: string;
  description: string;
  descriptionBullets: string[];
  comments: number;
  commentList: TaskComment[];
  attachments: number;
  startAt: Date;
  endAt: Date;
  column: string;
  owner: TaskUser;
  assignees: TaskUser[];
  branchName: string;
  commitHash: string;
  activityHistory: TaskActivity[];
};

const avatarColors = ["#F97316", "#4D8EFF", "#22C55E", "#EC4899", "#A855F7"];

function createUser(): TaskUser {
  const name = faker.person.fullName();
  const parts = name.split(" ");
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();

  return {
    id: faker.string.uuid(),
    name,
    image: faker.image.avatar(),
    initials,
    color: faker.helpers.arrayElement(avatarColors),
  };
}

faker.seed(42);

export const kanbanColumns: KanbanColumn[] = [
  { id: faker.string.uuid(), name: "Backlog", color: "#C2C6D6" },
  { id: faker.string.uuid(), name: "To Do", color: "#ADC6FF" },
  { id: faker.string.uuid(), name: "In Progress", color: "#ADC6FF" },
  { id: faker.string.uuid(), name: "In Review", color: "#C2C6D6" },
  { id: faker.string.uuid(), name: "Done", color: "#016630" },
];

const users = Array.from({ length: 6 })
  .fill(null)
  .map(() => createUser());

function createComment(author: TaskUser): TaskComment {
  const hasReactions = faker.datatype.boolean({ probability: 0.4 });

  return {
    id: faker.string.uuid(),
    author,
    content: faker.lorem.paragraph(),
    createdAt: faker.date.recent({ days: 7 }),
    reactions: hasReactions
      ? [
          { emoji: "🚀", count: faker.number.int({ min: 1, max: 5 }) },
          { emoji: "👀", count: faker.number.int({ min: 1, max: 3 }) },
        ]
      : undefined,
  };
}

function createActivity(
  type: TaskActivity["type"],
  description: string,
): TaskActivity {
  return {
    id: faker.string.uuid(),
    type,
    description,
    timestamp: faker.date.recent({ days: 14 }),
  };
}

export const projectTasks: ProjectTask[] = Array.from({ length: 20 })
  .fill(null)
  .map(() => {
    const startAt = faker.date.past({ years: 1 });
    const endAt = faker.date.future({ years: 1, refDate: startAt });
    const prefix = faker.helpers.arrayElement([
      "CORE",
      "API",
      "UI",
      "DB",
      "OPS",
    ]);
    const taskId = `${prefix}-${faker.number.int({ min: 100, max: 999 })}`;
    const owner = faker.helpers.arrayElement(users);
    const assigneeCount = faker.number.int({ min: 2, max: 4 });
    const assignees = faker.helpers.arrayElements(users, assigneeCount);
    const commentCount = faker.number.int({ min: 1, max: 5 });
    const commentAuthors = faker.helpers.arrayElements(users, commentCount);

    return {
      id: faker.string.uuid(),
      taskId,
      scope: faker.helpers.arrayElement([
        "feature",
        "bug",
        "task",
        "refactor",
        "schema",
        "docs",
        "ui",
        "frontend",
        "backend",
        "database",
        "infrastructure",
        "other",
      ]),
      priority: faker.helpers.arrayElement([
        "low",
        "medium",
        "high",
        "critical",
      ] as const),
      name: capitalize(faker.company.buzzPhrase()),
      description: faker.lorem.paragraph({ min: 2, max: 4 }),
      descriptionBullets: Array.from(
        { length: faker.number.int({ min: 2, max: 4 }) },
        () => faker.lorem.sentence(),
      ),
      comments: commentCount,
      commentList: commentAuthors.map((author) => createComment(author)),
      attachments: faker.number.int({ min: 0, max: 5 }),
      startAt,
      endAt,
      column: faker.helpers.arrayElement(kanbanColumns).id,
      owner,
      assignees,
      branchName: `feature/${taskId.toLowerCase()}-fed-auth`,
      commitHash: faker.git.commitSha({ length: 7 }),
      activityHistory: [
        createActivity("created", `${owner.name} created the task`),
        createActivity(
          "status",
          `${faker.person.firstName()} ${faker.person.lastName()} changed status to In Progress`,
        ),
        createActivity(
          "assigned",
          `${faker.person.firstName()} ${faker.person.lastName()} assigned ${assignees[0]?.name ?? "a teammate"}`,
        ),
      ],
    };
  });

export const scopeBadgeStyles: Record<string, string> = {
  refactor: "bg-[#F97316] text-black",
  bug: "bg-[#EF4444] text-white",
  feature: "bg-[#4D8EFF] text-black",
  task: "bg-[#22C55E] text-black",
  schema: "bg-[#A855F7] text-white",
  docs: "bg-[#64748B] text-white",
  ui: "bg-[#EC4899] text-white",
  frontend: "bg-[#06B6D4] text-black",
  backend: "bg-[#8B5CF6] text-white",
  database: "bg-[#14B8A6] text-black",
  infrastructure: "bg-[#EAB308] text-black",
  other: "bg-[#6B7280] text-white",
};

export const priorityStyles: Record<string, string> = {
  low: "text-[#C2C6D6]",
  medium: "text-[#ADC6FF]",
  high: "text-[#FFB690]",
  critical: "text-[#FF6B6B]",
};

export function getTaskById(taskId: string) {
  return projectTasks.find((task) => task.id === taskId);
}

export function getColumnById(columnId: string) {
  return kanbanColumns.find((column) => column.id === columnId);
}

export function formatRelativeTime(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));

  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatActivityTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatDueDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
