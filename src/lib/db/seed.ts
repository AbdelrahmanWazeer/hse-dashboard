import { db, sqlite } from "./index";
import { id } from "./schema";
import {
  users,
  tenants,
  memberships,
  projects,
  teamMembers,
  findings,
  incidents,
  manhours,
  manpower,
  tbtRecords,
  inductions,
  trainings,
  courses,
  courseProgress,
  workPermits,
  ppeItems,
  ppeTransactions,
  articles,
  siteLayouts,
  invitations,
} from "./schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { DEFAULT_PPE_ITEMS } from "@/lib/constants";

const DAY = 86400000;

function hashPw(pw: string) {
  return bcrypt.hashSync(pw, 10);
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function ts(year: number, month: number, day: number, hour = 8, minute = 0) {
  return new Date(year, month - 1, day, hour, minute).getTime();
}

export async function seed(options: { force?: boolean } = {}) {
  migrate(db, { migrationsFolder: "./drizzle" });
  const existing = db.select().from(users).all();
  if (existing.length > 0 && !options.force) {
    console.log("Seed skipped — database already populated. Use SEED_FORCE=1 to reseed.");
    return;
  }

  if (options.force) {
    const rows = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
    const tables = rows.map((r) => r.name).filter((n) => !n.startsWith("sqlite_"));
    sqlite.exec(`PRAGMA foreign_keys = OFF`);
    for (const name of tables) {
      sqlite.exec(`DELETE FROM "${name}"`);
    }
    sqlite.exec(`PRAGMA foreign_keys = ON`);
    console.log("Database reset.");
  }

  const now = Date.now();
  const year = new Date().getFullYear();

  // ------------------------------------------------------------------
  // Tenant & Users
  // ------------------------------------------------------------------
  const tenantId = id("tnt");
  const adminUserId = id("usr");
  const projectLeadId = id("usr");
  const nurseUserId = id("usr");

  db.insert(tenants)
    .values({
      id: tenantId,
      name: "Global Construction Group",
      slug: "main",
      plan: "corporate",
      primaryColor: "#0f766e",
      settings: { safetyTarget: 0.5, lostTimeTarget: 0 },
      createdAt: now,
      updatedAt: now,
    })
    .run();

  db.insert(users)
    .values([
      {
        id: adminUserId,
        name: "Ahmed Hassan",
        email: "admin@hse.demo",
        passwordHash: hashPw("admin123"),
        phone: "+971 50 000 0000",
        createdAt: ts(year, 1, 1),
        updatedAt: now,
      },
      {
        id: projectLeadId,
        name: "Emily Carter",
        email: "editor@hse.demo",
        passwordHash: hashPw("admin123"),
        createdAt: ts(year, 1, 1),
        updatedAt: now,
      },
      {
        id: nurseUserId,
        name: "Omar Nasser",
        email: "viewer@hse.demo",
        passwordHash: hashPw("admin123"),
        createdAt: ts(year, 1, 1),
        updatedAt: now,
      },
    ])
    .run();

  db.insert(memberships)
    .values([
      { id: id("mbr"), userId: adminUserId, tenantId, role: "admin", jobTitle: "HSE Manager", isActive: true, createdAt: now, updatedAt: now },
      { id: id("mbr"), userId: projectLeadId, tenantId, role: "editor", jobTitle: "HSE Senior Supervisor", isActive: true, createdAt: now, updatedAt: now },
      { id: id("mbr"), userId: nurseUserId, tenantId, role: "viewer", jobTitle: "Nurse", isActive: true, createdAt: now, updatedAt: now },
    ])
    .run();

  const adminUser = db.select().from(users).where(eq(users.email, "admin@hse.demo")).get();
  const editorUser = db.select().from(users).where(eq(users.email, "editor@hse.demo")).get();
  const nurseUser = db.select().from(users).where(eq(users.email, "viewer@hse.demo")).get();
  const allUsers = db.select().from(users).all();
  if (!adminUser || !editorUser || !nurseUser) {
    throw new Error("Seed users not found.");
  }

  // ------------------------------------------------------------------
  // Projects
  // ------------------------------------------------------------------
  const p1 = id("prj");
  const p2 = id("prj");

  db.insert(projects)
    .values([
      {
        id: p1,
        tenantId,
        name: "Harbour Tower Development",
        code: "HT-2026",
        description: "42-storey mixed-use tower — Phase 2 structural & MEP works.",
        location: "Plot 42, Marina District",
        status: "active",
        startDate: ts(year, 1, 15),
        endDate: ts(year, 12, 20),
        createdAt: now,
        updatedAt: now,
      },
      {
        id: p2,
        tenantId,
        name: "North Ring Road Bridge",
        code: "NR-2026",
        description: "Four-lane bridge and interchange with 3 underpasses.",
        location: "North Ring Interchange",
        status: "active",
        startDate: ts(year, 3, 1),
        endDate: ts(year + 1, 6, 30),
        createdAt: now,
        updatedAt: now,
      },
    ])
    .run();

  // ------------------------------------------------------------------
  // Team tree (org chart)
  // ------------------------------------------------------------------
  const team: Record<string, string> = {};

  const mkMember = (opts: {
    name: string;
    jobTitle: string;
    role: string;
    projectId?: string;
    managerId?: string;
    email?: string;
  }) => {
    const memberId = id("tm");
    team[opts.name] = memberId;
    db.insert(teamMembers)
      .values({
        id: memberId,
        tenantId,
        projectId: opts.projectId ?? null,
        userId: opts.email ? allUsers.find((u) => u.email === opts.email)?.id ?? null : null,
        managerId: opts.managerId ?? null,
        name: opts.name,
        email: opts.email ?? null,
        jobTitle: opts.jobTitle,
        role: opts.role,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .run();
    return memberId;
  };

  const hseMg1 = mkMember({ name: "Ahmed Hassan", jobTitle: "HSE Manager", role: "admin", projectId: p1, email: "admin@hse.demo" });
  mkMember({ name: "Emily Carter", jobTitle: "HSE Senior Supervisor", role: "editor", projectId: p1, managerId: hseMg1, email: "editor@hse.demo" });
  const tl1 = mkMember({ name: "Kevin Osei", jobTitle: "HSE Team Leader", role: "publisher", projectId: p1, managerId: hseMg1 });
  mkMember({ name: "Sarah Mitchell", jobTitle: "HSE", role: "editor", projectId: p1, managerId: tl1 });
  mkMember({ name: "John Parker", jobTitle: "Scaffolding Inspector", role: "editor", projectId: p1, managerId: tl1 });
  mkMember({ name: "Maria Santos", jobTitle: "Nurse", role: "viewer", projectId: p1, managerId: hseMg1 });
  mkMember({ name: "Peter Novak", jobTitle: "Section Head", role: "publisher", projectId: p1, managerId: hseMg1 });
  mkMember({ name: "David Kim", jobTitle: "HSE DC/Admin", role: "publisher", projectId: p1, managerId: hseMg1 });
  mkMember({ name: "Lucy Chen", jobTitle: "Auditor", role: "viewer", projectId: p1, managerId: hseMg1 });
  mkMember({ name: "Robert Ford", jobTitle: "HSE Officer", role: "editor", projectId: p1, managerId: tl1 });
  mkMember({ name: "Anna Kowalski", jobTitle: "HSE Supervisor", role: "editor", projectId: p1, managerId: tl1 });

  const hseMg2 = mkMember({ name: "Omar Nasser", jobTitle: "HSE Manager", role: "admin", projectId: p2, email: "viewer@hse.demo" });
  mkMember({ name: "Fatima Al Zahra", jobTitle: "HSE Senior Supervisor", role: "editor", projectId: p2, managerId: hseMg2 });
  const tl2 = mkMember({ name: "Mark Johnson", jobTitle: "HSE Team Leader", role: "publisher", projectId: p2, managerId: hseMg2 });
  mkMember({ name: "Nadia Rahman", jobTitle: "Nurse", role: "viewer", projectId: p2, managerId: hseMg2 });
  mkMember({ name: "Victor Hugo", jobTitle: "Scaffolding Inspector", role: "editor", projectId: p2, managerId: tl2 });

  db.update(projects).set({ hseManagerId: hseMg1 }).where(eq(projects.id, p1)).run();
  db.update(projects).set({ hseManagerId: hseMg2 }).where(eq(projects.id, p2)).run();

  // ------------------------------------------------------------------
  // Manhours & Manpower — daily records for 12 months
  // ------------------------------------------------------------------
  const manhourVals = [
    { m: 10, mh: 18500, mp: 310 },
    { m: 11, mh: 18920, mp: 322 },
    { m: 12, mh: 19880, mp: 335 },
  ];
  for (let month = 1; month <= 12; month++) {
    const baseMh = manhourVals.find((v) => v.m === month)?.mh ?? (month < 6 ? 15000 + month * 400 : 19000 + (month - 6) * 120);
    const baseMp = manhourVals.find((v) => v.m === month)?.mp ?? (month < 6 ? 260 + month * 8 : 300 + (month - 6) * 4);
    const days = new Date(year, month, 0).getDate();
    for (let d = 1; d <= days; d++) {
      const jitter = Math.round(Math.sin(d * 1.7) * baseMh * 0.04);
      db.insert(manhours)
        .values({ id: id("mh"), tenantId, projectId: d % 3 === 0 ? p2 : p1, date: ts(year, month, d, 12), manhours: Math.max(100, baseMh + jitter) })
        .run();
      const mpJitter = Math.round(Math.sin(d * 2.3) * baseMp * 0.05);
      db.insert(manpower)
        .values({ id: id("mp"), tenantId, projectId: d % 3 === 0 ? p2 : p1, date: ts(year, month, d, 12), headcount: Math.max(20, baseMp + mpJitter) })
        .run();
    }
  }

  // ------------------------------------------------------------------
  // Findings across the year
  // ------------------------------------------------------------------
  const findingTitles = [
    { title: "Unsecured ladder on level 12", category: "working_at_height", sev: "critical" },
    { title: "Missing guardrail on scaffolding bay 4", category: "scaffolding", sev: "high" },
    { title: "Worker without safety helmet in laydown area", category: "ppe", sev: "medium" },
    { title: "Damaged electrical cable near water pipe", category: "electrical", sev: "high" },
    { title: "Combustible material near hot work area", category: "fire", sev: "high" },
    { title: "Extension cord crossing walkway unprotected", category: "housekeeping", sev: "low" },
    { title: "Chemical drums unlabelled in storage", category: "chemical", sev: "medium" },
    { title: "Crane lifting path not barricaded", category: "lifting_rigging", sev: "critical" },
    { title: "Excavation edges without barriers", category: "excavation", sev: "high" },
    { title: "Welding face shield scratched & dirty", category: "ppe", sev: "low" },
    { title: "Fire extinguisher monthly check not done", category: "fire", sev: "medium" },
    { title: "Confined space entry without attendant", category: "confined_space", sev: "critical" },
    { title: "Defective grinding disc in use", category: "machine_guard", sev: "high" },
    { title: "Diesel spill near drainage", category: "environmental", sev: "medium" },
    { title: "Suspended load left unattended", category: "lifting_rigging", sev: "critical" },
  ];
  const teamKeys = () => Object.keys(team);

  let fCount = 0;
  for (let month = 1; month <= 12; month++) {
    const n = month <= 4 ? 8 : month <= 8 ? 5 : 4;
    for (let i = 0; i < n; i++) {
      const t = findingTitles[(fCount + i) % findingTitles.length];
      const day = 2 + ((fCount * 7 + i * 5) % 26);
      const created = ts(year, month, day, 9);
      const closed = created + 3 * DAY + (i * 2 * DAY);
      const status = created < now - 6 * DAY ? "closed" : created < now - 2 * DAY ? "in_progress" : "open";
      fCount++;
      db.insert(findings)
        .values({
          id: id("fnd"),
          tenantId,
          projectId: i % 3 === 0 ? p2 : p1,
          findingNo: `FND-${year}-${pad2(month)}-${pad2(i + 1)}`,
          title: t.title,
          description: `${t.title} — observed during routine patrol. Immediate corrective action initiated.`,
          category: t.category,
          severity: t.sev,
          status,
          location: `Block ${["A", "B", "C"][i % 3]}-Level ${(i % 20) + 2}`,
          photoUrls: [],
          reportedById: team[teamKeys()[fCount % teamKeys().length]],
          assignedToId: team[teamKeys()[(fCount + 2) % teamKeys().length]],
          dueDate: created + 7 * DAY,
          rootCause: status === "closed" ? "Lack of adequate supervision and task planning." : null,
          correctiveAction: status === "closed" ? "Installed guardrail, briefed crew, and updated inspection checklist." : null,
          closedAt: status === "closed" ? closed : null,
          createdAt: created,
          updatedAt: created,
        })
        .run();
    }
  }

  // ------------------------------------------------------------------
  // Incidents across the year
  // ------------------------------------------------------------------
  const incidentDefs = [
    { type: "first_aid", sev: 1 },
    { type: "near_miss", sev: 2 },
    { type: "medical_treatment", sev: 3 },
    { type: "restricted_work", sev: 4 },
    { type: "lti", sev: 5 },
    { type: "property_damage", sev: 3 },
  ] as const;

  let iCount = 0;
  for (let month = 1; month <= 12; month++) {
    const byType: Record<string, number> = {
      first_aid: month <= 4 ? 5 : month <= 8 ? 4 : 3,
      near_miss: month <= 4 ? 8 : month <= 8 ? 6 : 4,
      medical_treatment: month <= 4 ? 2 : 1,
      restricted_work: month <= 4 ? 1 : 1,
      lti: month === 3 || month === 6 || month === 9 || month === 12 ? 1 : 0,
      property_damage: month % 2 === 0 ? 1 : 0,
    };
    for (const def of incidentDefs) {
      const n = byType[def.type] ?? 0;
      for (let k = 0; k < n; k++) {
        const day = 3 + ((iCount * 3 + k * 7) % 26);
        const date = ts(year, month, day, 10 + (k % 6));
        const daysLost = def.type === "lti" ? 3 + (k % 4) : def.type === "restricted_work" ? 1 + (k % 2) : 0;
        iCount++;
        db.insert(incidents)
          .values({
            id: id("inc"),
            tenantId,
            projectId: k % 4 === 0 ? p2 : p1,
            incidentNo: `INC-${year}-${pad2(month)}-${pad2(k + 1)}`,
            incidentType: def.type,
            date,
            time: `${pad2(10 + (k % 6))}:${pad2((k * 11) % 60)}`,
            location: `Area ${["A-12", "B-07", "C-03", "Laydown", "Level 5"][k % 5]}`,
            description: `Worker reported ${def.type.replace("_", " ")} while handling materials on site.`,
            personName: ["James Wright", "Hassan Ali", "Tom Becker", "Yusuf Demir", "Ravi Patel", "Paul Myers"][k % 6],
            personCompany: ["Al Fahad Contracting", "MEP Solutions Co", "Steel Works Intl", "Electrix UAE"][k % 4],
            jobTitle: ["Rigger", "Electrician", "Steel Fixer", "Carpenter", "Operator"][k % 5],
            age: 26 + (k % 22),
            gender: "male",
            bodyPart: ["Hand", "Leg", "Finger", "Eye", "Back", "Foot"][k % 6],
            natureOfInjury: ["Cut", "Contusion", "Fracture", "Strain", "Burn"][k % 5],
            cause: "Improper handling and lack of awareness.",
            immediateAction: "First aid administered on site, area secured.",
            investigation: null,
            rootCause: null,
            correctiveActions: null,
            lostDays: daysLost,
            restrictedDays: def.type === "restricted_work" ? 2 : 0,
            photoUrls: [],
            status: daysLost > 0 || def.type === "medical_treatment" ? "investigating" : "closed",
            reportedById: team[teamKeys()[iCount % teamKeys().length]],
            isLTI: def.type === "lti",
            createdAt: date,
            updatedAt: date,
          })
          .run();
      }
    }
  }

  // ------------------------------------------------------------------
  // TBT records
  // ------------------------------------------------------------------
  for (let month = 1; month <= 12; month++) {
    for (let w = 1; w <= 4; w++) {
      const topics = ["Safe Lifting", "Working at Height", "PPE Essentials", "Hot Work Safety", "Housekeeping", "Tool Safety"];
      db.insert(tbtRecords)
        .values({
          id: id("tbt"),
          tenantId,
          projectId: w % 2 === 0 ? p2 : p1,
          title: `Toolbox Talk #${w}`,
          topic: topics[(month + w) % topics.length],
          date: ts(year, month, w * 7, 7, 30),
          conductedBy: w % 2 === 0 ? team["Emily Carter"] : team["Kevin Osei"],
          attendees: 14 + ((month * w) % 20),
          durationMinutes: 15 + (w % 3) * 5,
          notes: "Attendees signed the TBT log sheet.",
          photoUrls: [],
        })
        .run();
    }
  }

  // ------------------------------------------------------------------
  // Inductions
  // ------------------------------------------------------------------
  for (let m = 1; m <= 12; m++) {
    const n = 4 + (m % 5);
    for (let k = 0; k < n; k++) {
      const date = ts(year, m, 4 + k * 3, 8);
      db.insert(inductions)
        .values({
          id: id("ind"),
          tenantId,
          projectId: k % 2 === 0 ? p1 : p2,
          personnelName: ["Mohamed S", "Ali R", "John D", "Wei L", "Carlos M", "Bilal K"][k % 6],
          company: ["Al Fahad Contracting", "MEP Solutions Co", "Steel Works Intl"][k % 3],
          idNumber: `ID-${m}-${k}-${Math.floor(Math.random() * 900) + 100}`,
          inductionType: k % 4 === 0 ? "refresher" : "general",
          date,
          trainer: "Ahmed Hassan",
          status: "completed",
          expiryDate: date + (k % 3 === 0 ? 365 : 180) * DAY,
          notes: null,
        })
        .run();
    }
  }

  // ------------------------------------------------------------------
  // Trainings
  // ------------------------------------------------------------------
  const trainingCourses = ["IOSH Managing Safely", "Working at Height", "Fire Warden", "First Aid / CPR", "Confined Space Rescue", "Defensive Driving", "Chemical Handling", "Scaffold Inspection"];
  for (let m = 1; m <= 12; m++) {
    for (let k = 0; k < 3; k++) {
      const date = ts(year, m, 5 + k * 9, 9);
      const expiry = date + 720 * DAY;
      const course = trainingCourses[(m + k) % trainingCourses.length];
      const expiring = date > now - 60 * DAY;
      db.insert(trainings)
        .values({
          id: id("trn"),
          tenantId,
          projectId: k % 2 === 0 ? p1 : p2,
          personnelName: ["Ahmed Hassan", "Emily Carter", "Kevin Osei", "Maria Santos", "John Parker", "Peter Novak"][k % 6],
          courseName: course,
          trainingType: k % 3 === 0 ? "refresher" : "specific",
          provider: ["Global Safety Academy", "OSHA Training Center", "BrightPath HSE"][k % 3],
          date,
          certificateNo: `CERT-${m}-${k}${Math.floor(Math.random() * 900) + 100}`,
          expiryDate: expiry,
          status: expiring ? "expiring" : "valid",
          notes: null,
        })
        .run();
    }
  }

  // ------------------------------------------------------------------
  // Work permits
  // ------------------------------------------------------------------
  const permitStatuses = ["active", "approved", "pending", "draft", "active", "completed", "active", "approved", "pending", "active"] as const;
  for (let month = 1; month <= 12; month++) {
    for (let k = 0; k < 8; k++) {
      const type = ["hot_work", "work_at_height", "confined_space", "excavation", "electrical", "lifting", "general"][k % 7];
      const start = ts(year, month, 5 + k * 3, 8);
      const end = start + (6 + k) * 3600000 * (3 + (k % 2));
      const status = permitStatuses[k % permitStatuses.length];
      const approved = status === "active" || status === "approved" || status === "completed";
      db.insert(workPermits)
        .values({
          id: id("wpt"),
          tenantId,
          projectId: k % 3 === 0 ? p2 : p1,
          permitNo: `PTW-${year}-${pad2(month)}-${pad2(k + 1)}${pad2(k + 1)}`,
          permitType: type,
          title: `${type.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())} — Block ${["A", "B", "C"][k % 3]}`,
          description: `Permit for ${type.replace(/_/g, " ")} operations at the assigned location.`,
          location: `Block ${["A", "B", "C"][k % 3]} Level ${(k % 18) + 2}`,
          locationX: 15 + (k % 5) * 20 + Math.random() * 10,
          locationY: 15 + ((k * 3) % 5) * 18 + Math.random() * 10,
          startDate: start,
          endDate: end,
          status,
          requestedBy: team["Kevin Osei"],
          assignedTo: team[teamKeys()[k % teamKeys().length]],
          approvedBy: approved ? adminUser.id : null,
          approvedAt: approved ? start - 3600000 : null,
          ppeRequired: ["helmet", "safety_shoes", "vest"],
          hazards: ["fire", "fall", "energy"],
          controls: ["fire_watch", "barricade", "isolation"],
          isolation: "LOTO applied per procedure.",
          reviewers: ["Emily Carter"],
          remarks: null,
          createdAt: start - 2 * DAY,
          updatedAt: approved ? start - 3600000 : start - 2 * DAY,
        })
        .run();
    }
  }

  db.insert(invitations)
    .values({
      id: id("inv"),
      tenantId,
      email: "newteam@hse.demo",
      name: "Sara Ahmed",
      role: "editor",
      jobTitle: "HSE Team Leader",
      token: "demo-token-001",
      status: "pending",
      invitedById: adminUser.id,
      expiresAt: now + 7 * DAY,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  // ------------------------------------------------------------------
  // Site layout (map background placeholder)
  // ------------------------------------------------------------------
  db.insert(siteLayouts)
    .values({
      id: id("lay"),
      tenantId,
      projectId: p1,
      name: "Harbour Tower Site Layout",
      imageUrl: "",
      width: 100,
      height: 70,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
    .run();
  db.insert(siteLayouts)
    .values({
      id: id("lay"),
      tenantId,
      projectId: p2,
      name: "North Ring Bridge Layout",
      imageUrl: "",
      width: 100,
      height: 70,
      isActive: false,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  // ------------------------------------------------------------------
  // PPE inventory with the requested items
  // ------------------------------------------------------------------
  for (const item of DEFAULT_PPE_ITEMS) {
    const total = 80 + Math.floor(Math.random() * 240);
    const issued = Math.floor(total * 0.55);
    const itemId = id("ppe");
    db.insert(ppeItems)
      .values({
        id: itemId,
        tenantId,
        name: item.name,
        category: item.category,
        size: null,
        brand: ["3M", "Honeywell", "MSA", "Delta Plus", "Uvex"][Math.floor(Math.random() * 5)],
        description: `${item.name} — standard issue PPE.`,
        totalStock: total,
        safetyStock: Math.floor(total * 0.15),
        issued,
        available: total - issued,
        unit: "pcs",
        storageLocation: `Warehouse Rack ${["A1", "A2", "B1", "B2", "C1"][Math.floor(Math.random() * 5)]}`,
        pricePerUnit: 5 + Math.floor(Math.random() * 120),
        minReorderLevel: 15,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    for (let mo = 1; mo <= 12; mo++) {
      db.insert(ppeTransactions)
        .values({
          id: id("ppx"),
          tenantId,
          ppeItemId: itemId,
          type: mo % 3 === 0 ? "receive" : "issue",
          quantity: mo % 3 === 0 ? 20 + (mo % 4) * 10 : 8 + ((mo * 7) % 18),
          teamMemberId: team[teamKeys()[mo % teamKeys().length]] ?? null,
          date: ts(year, mo, 6 + (mo % 5) * 4, 9),
          note: mo % 3 === 0 ? "Monthly stock replenishment" : "Issued to project team",
          createdAt: now,
          updatedAt: now,
        })
        .run();
    }
  }

  // ------------------------------------------------------------------
  // Articles
  // ------------------------------------------------------------------
  db.insert(articles)
    .values([
      {
        id: id("art"),
        tenantId,
        title: "Top 10 Safety Tips for Working at Height",
        slug: "top-10-safety-tips-working-at-height",
        category: "safety_tip",
        excerpt: "Practical guidance every worker on elevated platforms must follow.",
        content:
          "Work at height remains one of the leading causes of serious injury. Always check your harness, anchor points, and guardrails before starting...",
        coverImage: "",
        status: "published",
        publishedAt: ts(year, 1, 20),
        authorId: adminUser.id,
        createdAt: ts(year, 1, 18),
        updatedAt: ts(year, 1, 18),
      },
      {
        id: id("art"),
        tenantId,
        title: "Project Safety Performance — Q1 Report Published",
        slug: "q1-safety-performance-report",
        category: "news",
        excerpt: "Our LTI rate improved 40% quarter over quarter. Read the full breakdown.",
        content:
          "We are pleased to share that the first quarter closed with zero lost time injuries across both active projects...",
        coverImage: "",
        status: "published",
        publishedAt: ts(year, 4, 2),
        authorId: adminUser.id,
        createdAt: ts(year, 4, 1),
        updatedAt: ts(year, 4, 1),
      },
      {
        id: id("art"),
        tenantId,
        title: "New PPE Standard Rollout",
        slug: "new-ppe-standard-rollout",
        category: "announcement",
        excerpt: "Updated high-visibility vests and welding face shields now available in stores.",
        content:
          "The new PPE standard is effective immediately. All personnel must collect the updated equipment before entering the work area...",
        coverImage: "",
        status: "published",
        publishedAt: ts(year, 6, 18),
        authorId: editorUser.id,
        createdAt: ts(year, 6, 17),
        updatedAt: ts(year, 6, 17),
      },
      {
        id: id("art"),
        tenantId,
        title: "Heat Stress Awareness Guide",
        slug: "heat-stress-awareness-guide",
        category: "article",
        excerpt: "Understanding heat cramps, exhaustion, and heat stroke in outdoor work.",
        content:
          "Summer peak temperatures create serious heat stress risk. Monitor water intake, rest cycles, and buddy checks closely...",
        coverImage: "",
        status: "draft",
        authorId: nurseUser.id,
        createdAt: ts(year, 8, 5),
        updatedAt: ts(year, 8, 5),
      },
    ])
    .run();

  // ------------------------------------------------------------------
  // Courses catalog (Udemy-style) with enrollments
  // ------------------------------------------------------------------
  const course1 = id("crs");
  const course2 = id("crs");
  const course3 = id("crs");
  const course4 = id("crs");
  const course5 = id("crs");
  const course6 = id("crs");

  db.insert(courses)
    .values([
      {
        id: course1,
        tenantId,
        title: "Confined Space Entry & H2S Awareness",
        description:
          "Covers confined space hazards, gas testing, atmospheric monitoring, H2S effects, rescue planning, and the permit requirements for safe entry operations.",
        category: "safety",
        provider: "Global Safety Academy",
        level: "intermediate",
        durationMinutes: 150,
        coverUrl: "",
        courseUrl: "https://training.globalsafety.example/confined-space-h2s",
        tags: ["confined space", "H2S", "gas testing", "rescue"],
        status: "published",
        createdById: adminUser.id,
        createdAt: ts(year, 1, 10),
        updatedAt: ts(year, 1, 10),
      },
      {
        id: course2,
        tenantId,
        title: "Working at Height Essentials",
        description:
          "Fall protection systems, anchor points, ladders, scaffolds, and rescue from height. Practical guidance for supervisors and workers on elevated platforms.",
        category: "safety",
        provider: "OSHA Training Center",
        level: "beginner",
        durationMinutes: 90,
        coverUrl: "",
        courseUrl: "https://training.osha.example/working-at-height",
        tags: ["fall protection", "scaffolding", "ladders"],
        status: "published",
        createdById: adminUser.id,
        createdAt: ts(year, 1, 15),
        updatedAt: ts(year, 1, 15),
      },
      {
        id: course3,
        tenantId,
        title: "First Aid & CPR for Site Medics",
        description:
          "Emergency response on construction sites: primary survey, CPR, bleeding control, burns, fractures, and heat stress emergencies.",
        category: "health",
        provider: "BrightPath HSE",
        level: "all_levels",
        durationMinutes: 240,
        coverUrl: "",
        courseUrl: "https://training.brightpath.example/first-aid-cpr",
        tags: ["first aid", "CPR", "emergency", "medic"],
        status: "published",
        createdById: adminUser.id,
        createdAt: ts(year, 2, 1),
        updatedAt: ts(year, 2, 1),
      },
      {
        id: course4,
        tenantId,
        title: "Construction Waste & Environmental Compliance",
        description:
          "Waste segregation, spill response, chemical storage, and regulatory compliance for construction activities near sensitive areas.",
        category: "environment",
        provider: "Green Build Institute",
        level: "intermediate",
        durationMinutes: 120,
        coverUrl: "",
        courseUrl: "",
        tags: ["waste", "spill", "environment", "compliance"],
        status: "published",
        createdById: editorUser.id,
        createdAt: ts(year, 3, 5),
        updatedAt: ts(year, 3, 5),
      },
      {
        id: course5,
        tenantId,
        title: "Crane Lifting & Rigging Safety",
        description:
          "Lift planning, load charts, rigging hardware inspection, signaling, and exclusion zones for mobile crane operations.",
        category: "technical",
        provider: "CraneOps Academy",
        level: "advanced",
        durationMinutes: 180,
        coverUrl: "",
        courseUrl: "https://training.craneops.example/lifting-rigging",
        tags: ["crane", "rigging", "lifting", "signalman"],
        status: "published",
        createdById: adminUser.id,
        createdAt: ts(year, 4, 10),
        updatedAt: ts(year, 4, 10),
      },
      {
        id: course6,
        tenantId,
        title: "HSE Leadership & Toolbox Talk Delivery",
        description:
          "Delivering effective toolbox talks, safety briefings, coaching crews, and building a positive safety culture on site.",
        category: "management",
        provider: "",
        level: "all_levels",
        durationMinutes: 75,
        coverUrl: "",
        courseUrl: "",
        tags: ["leadership", "toolbox talk", "culture"],
        status: "draft",
        createdById: adminUser.id,
        createdAt: ts(year, 5, 1),
        updatedAt: ts(year, 5, 1),
      },
    ])
    .run();

  const nowC = now;
  db.insert(courseProgress)
    .values([
      {
        id: id("cpr"),
        tenantId,
        courseId: course1,
        userId: adminUserId,
        status: "in_progress",
        progress: 60,
        enrolledAt: ts(year, 5, 2),
        completedAt: null,
        createdAt: ts(year, 5, 2),
        updatedAt: nowC,
      },
      {
        id: id("cpr"),
        tenantId,
        courseId: course5,
        userId: adminUserId,
        status: "completed",
        progress: 100,
        enrolledAt: ts(year, 4, 12),
        completedAt: ts(year, 6, 1),
        createdAt: ts(year, 4, 12),
        updatedAt: ts(year, 6, 1),
      },
      {
        id: id("cpr"),
        tenantId,
        courseId: course2,
        userId: projectLeadId,
        status: "enrolled",
        progress: 10,
        enrolledAt: ts(year, 5, 10),
        completedAt: null,
        createdAt: ts(year, 5, 10),
        updatedAt: nowC,
      },
      {
        id: id("cpr"),
        tenantId,
        courseId: course3,
        userId: nurseUserId,
        status: "completed",
        progress: 100,
        enrolledAt: ts(year, 2, 3),
        completedAt: ts(year, 3, 20),
        createdAt: ts(year, 2, 3),
        updatedAt: ts(year, 3, 20),
      },
    ])
    .run();

  console.log("Seed complete.");
  console.log("");
  console.log("Demo accounts:");
  console.log("  admin@hse.demo  / admin123  (Admin — HSE Manager)");
  console.log("  editor@hse.demo / admin123  (Editor — HSE Senior Supervisor)");
  console.log("  viewer@hse.demo / admin123  (Viewer — Nurse)");
}

if (process.argv[1] && process.argv[1].endsWith("seed.ts")) {
  const force = process.env.SEED_FORCE === "1";
  seed({ force });
}