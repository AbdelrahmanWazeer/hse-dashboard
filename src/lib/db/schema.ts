import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { randomUUID } from "crypto";

export function id(prefix: string) {
  return `${prefix}_${randomUUID()}`;
}

export const timestamps = {
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
};

// ---------------------------------------------------------------------------
// Users & Tenancy
// ---------------------------------------------------------------------------

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    image: text("image"),
    phone: text("phone"),
    isSuperAdmin: integer("is_super_admin", { mode: "boolean" }).default(false),
    ...timestamps,
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)]
);

export const tenants = sqliteTable(
  "tenants",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    plan: text("plan").default("starter"),
    logoUrl: text("logo_url"),
    primaryColor: text("primary_color").default("#0f766e"),
    settings: text("settings", { mode: "json" }).$type<Record<string, unknown>>(),
    ...timestamps,
  },
  (t) => [uniqueIndex("tenants_slug_idx").on(t.slug)]
);

export const ROLE_VALUES = ["admin", "editor", "publisher", "viewer"] as const;
export type Role = (typeof ROLE_VALUES)[number];

export const memberships = sqliteTable(
  "memberships",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    jobTitle: text("job_title").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    ...timestamps,
  },
  (t) => [index("memberships_user_tenant_idx").on(t.userId, t.tenantId)]
);

export const invitations = sqliteTable(
  "invitations",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    name: text("name").notNull(),
    role: text("role").notNull(),
    jobTitle: text("job_title").notNull(),
    token: text("token").notNull(),
    status: text("status").notNull().default("pending"), // pending | accepted | expired | revoked
    invitedById: text("invited_by_id").references(() => users.id),
    expiresAt: integer("expires_at").notNull(),
    ...timestamps,
  },
  (t) => [index("invitations_tenant_idx").on(t.tenantId), index("invitations_token_idx").on(t.token)]
);

// ---------------------------------------------------------------------------
// Organization Hierarchy: Company (tenant) -> Projects -> Team tree
// ---------------------------------------------------------------------------

export const projects = sqliteTable(
  "projects",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    code: text("code"),
    description: text("description"),
    location: text("location"),
    status: text("status").notNull().default("active"), // active | onHold | completed
    startDate: integer("start_date"),
    endDate: integer("end_date"),
    hseManagerId: text("hse_manager_id"), // refs team_members.id
    ...timestamps,
  },
  (t) => [index("projects_tenant_idx").on(t.tenantId)]
);

export const teamMembers = sqliteTable(
  "team_members",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    managerId: text("manager_id"), // parent node in the org tree (refs team_members.id or project.hseManagerId)
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    avatar: text("avatar"),
    jobTitle: text("job_title").notNull(),
    role: text("role").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    ...timestamps,
  },
  (t) => [index("team_members_tenant_idx").on(t.tenantId), index("team_members_project_idx").on(t.projectId)]
);

// ---------------------------------------------------------------------------
// HSE: Findings & Incidents
// ---------------------------------------------------------------------------

export const FINDING_SEVERITIES = ["low", "medium", "high", "critical"] as const;
export const FINDING_STATUSES = ["open", "in_progress", "closed", "overdue"] as const;
export const FINDING_CATEGORIES = [
  "housekeeping",
  "ppe",
  "working_at_height",
  "electrical",
  "fire",
  "chemical",
  "lifting_rigging",
  "excavation",
  "confined_space",
  "scaffolding",
  "machine_guard",
  "environmental",
  "other",
] as const;

export const findings = sqliteTable(
  "findings",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
    findingNo: text("finding_no").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    severity: text("severity").notNull(),
    status: text("status").notNull().default("open"),
    location: text("location"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    photoUrls: text("photo_urls", { mode: "json" }).$type<string[]>(),
    reportedById: text("reported_by_id").references(() => teamMembers.id, { onDelete: "set null" }),
    assignedToId: text("assigned_to_id").references(() => teamMembers.id, { onDelete: "set null" }),
    dueDate: integer("due_date"),
    rootCause: text("root_cause"),
    correctiveAction: text("corrective_action"),
    remarks: text("remarks"),
    closedAt: integer("closed_at"),
    closedById: text("closed_by_id").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [
    index("findings_tenant_idx").on(t.tenantId),
    index("findings_project_idx").on(t.projectId),
    index("findings_status_idx").on(t.status),
    index("findings_tenant_created_idx").on(t.tenantId, t.createdAt),
  ]
);

export const INCIDENT_TYPES = [
  "first_aid",
  "medical_treatment",
  "lti",
  "restricted_work",
  "disability",
  "fatality",
  "near_miss",
  "property_damage",
  "environmental",
  "other",
] as const;

export const incidents = sqliteTable(
  "incidents",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
    incidentNo: text("incident_no").notNull(),
    incidentType: text("incident_type").notNull(),
    date: integer("date").notNull(),
    time: text("time"),
    location: text("location"),
    description: text("description").notNull(),
    personName: text("person_name"),
    personCompany: text("person_company"),
    jobTitle: text("person_job_title"),
    age: integer("age"),
    gender: text("gender"),
    bodyPart: text("body_part"),
    natureOfInjury: text("nature_of_injury"),
    cause: text("cause"),
    immediateAction: text("immediate_action"),
    investigation: text("investigation"),
    rootCause: text("root_cause"),
    correctiveActions: text("corrective_actions"),
    lostDays: integer("lost_days").default(0),
    restrictedDays: integer("restricted_days").default(0),
    medicalTreatmentCost: real("medical_treatment_cost"),
    propertyDamageCost: real("property_damage_cost"),
    photoUrls: text("photo_urls", { mode: "json" }).$type<string[]>(),
    status: text("status").notNull().default("reported"), // reported | investigating | closed
    reportedById: text("reported_by_id").references(() => teamMembers.id, { onDelete: "set null" }),
    isLTI: integer("is_lti", { mode: "boolean" }).default(false),
    ...timestamps,
  },
  (t) => [
    index("incidents_tenant_idx").on(t.tenantId),
    index("incidents_type_idx").on(t.incidentType),
    index("incidents_date_idx").on(t.date),
    index("incidents_tenant_date_idx").on(t.tenantId, t.date),
  ]
);

// ---------------------------------------------------------------------------
// HSE Controls: Manhours, Manpower, TBT, Induction, Training, Work Permits
// ---------------------------------------------------------------------------

export const manhours = sqliteTable(
  "manhours",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
    date: integer("date").notNull(),
    manhours: integer("manhours").notNull().default(0),
  },
  (t) => [index("manhours_tenant_date_idx").on(t.tenantId, t.date)]
);

export const manpower = sqliteTable(
  "manpower",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
    date: integer("date").notNull(),
    headcount: integer("headcount").notNull().default(0),
  },
  (t) => [index("manpower_tenant_date_idx").on(t.tenantId, t.date)]
);

export const tbtRecords = sqliteTable(
  "tbt_records",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    topic: text("topic"),
    date: integer("date").notNull(),
    conductedBy: text("conducted_by").references(() => teamMembers.id, { onDelete: "set null" }),
    attendees: integer("attendees").notNull().default(0),
    durationMinutes: integer("duration_minutes").default(0),
    notes: text("notes"),
    photoUrls: text("photo_urls", { mode: "json" }).$type<string[]>(),
  },
  (t) => [index("tbt_tenant_date_idx").on(t.tenantId, t.date)]
);

export const inductions = sqliteTable(
  "inductions",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
    personnelName: text("personnel_name").notNull(),
    company: text("company"),
    idNumber: text("id_number"),
    inductionType: text("induction_type").notNull().default("general"),
    date: integer("date").notNull(),
    trainer: text("trainer"),
    status: text("status").notNull().default("completed"), // completed | scheduled | expired
    expiryDate: integer("expiry_date"),
    notes: text("notes"),
  },
  (t) => [index("inductions_tenant_idx").on(t.tenantId), index("inductions_tenant_date_idx").on(t.tenantId, t.date)]
);

export const trainings = sqliteTable(
  "trainings",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
    personnelName: text("personnel_name").notNull(),
    courseName: text("course_name").notNull(),
    trainingType: text("training_type").notNull().default("specific"),
    provider: text("provider"),
    date: integer("date").notNull(),
    certificateNo: text("certificate_no"),
    expiryDate: integer("expiry_date"),
    status: text("status").notNull().default("valid"), // valid | expiring | expired | invalid
    notes: text("notes"),
  },
  (t) => [index("trainings_tenant_idx").on(t.tenantId), index("trainings_tenant_date_idx").on(t.tenantId, t.date)]
);

export const PERMIT_TYPES = [
  "hot_work",
  "cold_work",
  "work_at_height",
  "confined_space",
  "excavation",
  "electrical",
  "lifting",
  "chemical",
  "demolition",
  "general",
] as const;

export const PERMIT_STATUSES = ["draft", "pending", "approved", "active", "completed", "rejected", "cancelled"] as const;

export const workPermits = sqliteTable(
  "work_permits",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
    permitNo: text("permit_no").notNull(),
    permitType: text("permit_type").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    location: text("location"),
    locationX: real("location_x"),
    locationY: real("location_y"),
    startDate: integer("start_date").notNull(),
    endDate: integer("end_date").notNull(),
    status: text("status").notNull().default("draft"),
    requestedBy: text("requested_by").references(() => teamMembers.id, { onDelete: "set null" }),
    assignedTo: text("assigned_to").references(() => teamMembers.id, { onDelete: "set null" }),
    approvedBy: text("approved_by").references(() => users.id, { onDelete: "set null" }),
    approvedAt: integer("approved_at"),
    ppeRequired: text("ppe_required", { mode: "json" }).$type<string[]>(),
    hazards: text("hazards", { mode: "json" }).$type<string[]>(),
    controls: text("controls", { mode: "json" }).$type<string[]>(),
    isolation: text("isolation"),
    reviewers: text("reviewers", { mode: "json" }).$type<string[]>(),
    remarks: text("remarks"),
    ...timestamps,
  },
  (t) => [index("permits_tenant_idx").on(t.tenantId), index("permits_status_idx").on(t.status)]
);

export const siteLayouts = sqliteTable(
  "site_layouts",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    imageUrl: text("image_url").notNull(),
    width: real("width"),
    height: real("height"),
    isActive: integer("is_active", { mode: "boolean" }).default(false),
    ...timestamps,
  },
  (t) => [index("site_layouts_tenant_idx").on(t.tenantId)]
);

// ---------------------------------------------------------------------------
// PPE Inventory
// ---------------------------------------------------------------------------

export const ppeItems = sqliteTable(
  "ppe_items",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category").notNull(),
    size: text("size"),
    brand: text("brand"),
    description: text("description"),
    totalStock: integer("total_stock").notNull().default(0),
    safetyStock: integer("safety_stock").notNull().default(0),
    issued: integer("issued").notNull().default(0),
    available: integer("available").notNull().default(0),
    unit: text("unit").notNull().default("pcs"),
    storageLocation: text("storage_location"),
    pricePerUnit: real("price_per_unit"),
    minReorderLevel: integer("min_reorder_level").notNull().default(5),
    photoUrl: text("photo_url"),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    ...timestamps,
  },
  (t) => [index("ppe_tenant_idx").on(t.tenantId)]
);

export const ppeTransactions = sqliteTable(
  "ppe_transactions",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    ppeItemId: text("ppe_item_id")
      .notNull()
      .references(() => ppeItems.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // receive | issue | return | damage | adjust
    quantity: integer("quantity").notNull(),
    teamMemberId: text("team_member_id").references(() => teamMembers.id, { onDelete: "set null" }),
    date: integer("date").notNull(),
    note: text("note"),
    ...timestamps,
  },
  (t) => [
    index("ppe_transactions_tenant_idx").on(t.tenantId),
    index("ppe_transactions_item_idx").on(t.ppeItemId),
    index("ppe_transactions_tenant_date_idx").on(t.tenantId, t.date),
  ]
);

// ---------------------------------------------------------------------------
// Reports, Articles, Media
// ---------------------------------------------------------------------------

export const reports = sqliteTable(
  "reports",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    type: text("type").notNull(), // finding | incident | monthly | annual | permit | custom
    description: text("description"),
    startDate: integer("start_date"),
    endDate: integer("end_date"),
    data: text("data", { mode: "json" }).$type<Record<string, unknown>>(),
    fileName: text("file_name"),
    fileUrl: text("file_url"),
    createdById: text("created_by_id").references(() => users.id, { onDelete: "set null" }),
    schedule: text("schedule"), // null | monthly (auto-email)
    emailTo: text("email_to"),
    lastSentAt: integer("last_sent_at"),
    ...timestamps,
  },
  (t) => [
    index("reports_tenant_idx").on(t.tenantId),
    index("reports_tenant_created_idx").on(t.tenantId, t.createdAt),
    index("reports_schedule_idx").on(t.schedule),
  ]
);

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
    actorName: text("actor_name"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    details: text("details", { mode: "json" }).$type<Record<string, unknown>>(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("audit_logs_tenant_idx").on(t.tenantId), index("audit_logs_created_idx").on(t.createdAt)]
);

export const articles = sqliteTable(
  "articles",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug"),
    category: text("category").notNull().default("news"), // news | article | safety_tip | announcement
    excerpt: text("excerpt"),
    content: text("content").notNull(),
    coverImage: text("cover_image"),
    status: text("status").notNull().default("draft"), // draft | published | archived
    publishedAt: integer("published_at"),
    authorId: text("author_id").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [index("articles_tenant_idx").on(t.tenantId), index("articles_status_idx").on(t.status)]
);

export const media = sqliteTable(
  "media",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    key: text("key"),
    name: text("name"),
    type: text("type"),
    size: integer("size"),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    uploadedById: text("uploaded_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("media_tenant_idx").on(t.tenantId), index("media_tenant_created_idx").on(t.tenantId, t.createdAt)]
);

// ---------------------------------------------------------------------------
// Training & Courses Catalog (Udemy-style)
// ---------------------------------------------------------------------------

export const COURSE_STATUSES = ["draft", "published", "archived"] as const;
export const PROGRESS_STATUSES = ["enrolled", "in_progress", "completed"] as const;

export const courses = sqliteTable(
  "courses",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    category: text("category").notNull().default("other"),
    provider: text("provider"),
    level: text("level").notNull().default("beginner"),
    durationMinutes: integer("duration_minutes").notNull().default(0),
    coverUrl: text("cover_url"),
    courseUrl: text("course_url"),
    tags: text("tags", { mode: "json" }).$type<string[]>(),
    status: text("status").notNull().default("draft"), // draft | published | archived
    createdById: text("created_by_id").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [
    index("courses_tenant_idx").on(t.tenantId),
    index("courses_tenant_status_idx").on(t.tenantId, t.status),
  ]
);

export const courseProgress = sqliteTable(
  "course_progress",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("enrolled"), // enrolled | in_progress | completed
    progress: integer("progress").notNull().default(0),
    enrolledAt: integer("enrolled_at").notNull(),
    completedAt: integer("completed_at"),
    ...timestamps,
  },
  (t) => [
    index("course_progress_tenant_idx").on(t.tenantId),
    index("course_progress_course_idx").on(t.courseId),
    index("course_progress_user_idx").on(t.userId),
    uniqueIndex("course_progress_user_course_idx").on(t.userId, t.courseId),
  ]
);

export type Course = typeof courses.$inferSelect;
export type CourseProgress = typeof courseProgress.$inferSelect;

export const subscribers = sqliteTable(
  "subscribers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    email: text("email").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [uniqueIndex("subscribers_email_idx").on(t.email)],
);

export type Subscriber = typeof subscribers.$inferSelect;
