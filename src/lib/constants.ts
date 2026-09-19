export const ROLES = [
  { value: "admin", label: "Admin", labelAr: "مدير النظام", description: "Full access to all features, users, and settings" },
  { value: "editor", label: "Editor", labelAr: "محرر", description: "Can create and edit records and content" },
  { value: "publisher", label: "Publisher", labelAr: "ناشر", description: "Editor + can publish articles, reports, and invite team members" },
  { value: "viewer", label: "Viewer", labelAr: "مشاهد", description: "Read-only access" },
] as const;

export const JOB_TITLES = [
  "HSE Manager",
  "HSE Senior Supervisor",
  "HSE Team Leader",
  "HSE",
  "Section Head",
  "HSE DC/Admin",
  "Scaffolding Inspector",
  "Nurse",
  "Officer",
  "Supervisor",
  "Auditor",
] as const;

export const ORGANIZATION_DEPTH = [
  "Company",
  "Project",
  "HSE Manager",
  "Team Leader",
  "Team Member",
] as const;

export const PPE_CATEGORIES = [
  "head",
  "eye_face",
  "hearing",
  "respiratory",
  "hand",
  "foot",
  "body",
  "fall_protection",
  "welding",
  "reflective",
  "other",
] as const;

export const DEFAULT_PPE_ITEMS = [
  { name: "Safety Helmet", category: "head" },
  { name: "Hard Hat", category: "head" },
  { name: "High Visibility Vest", category: "reflective" },
  { name: "Safety Shoes", category: "foot" },
  { name: "Face Shield (Welding)", category: "welding" },
  { name: "Clear Face Shield (Cutting)", category: "eye_face" },
  { name: "Safety Goggles", category: "eye_face" },
  { name: "Ear Plugs", category: "hearing" },
  { name: "Ear Muffs", category: "hearing" },
  { name: "Respirator (Half Face)", category: "respiratory" },
  { name: "Dust Mask", category: "respiratory" },
  { name: "Safety Gloves - Cut Resistant", category: "hand" },
  { name: "Leather Welding Gloves", category: "welding" },
  { name: "Rubber Gloves (Chemical)", category: "hand" },
  { name: "Safety Harness", category: "fall_protection" },
  { name: "Lanyard with Shock Absorber", category: "fall_protection" },
  { name: "Welding Jacket", category: "welding" },
  { name: "Reflective Coverall", category: "body" },
] as const;

export const INCIDENT_TYPE_META: Record<
  string,
  { label: string; labelAr: string; color: string; description: string }
> = {
  first_aid: { label: "First Aid Case", labelAr: "حالة إسعافات أولية", color: "#f59e0b", description: "First aid case" },
  medical_treatment: { label: "Medical Treatment Case", labelAr: "حالة علاج طبي", color: "#f97316", description: "Medical treatment case" },
  lti: { label: "Lost Time Injury (LTI)", labelAr: "إصابة بفقدان وقت (LTI)", color: "#ef4444", description: "Lost time injury" },
  restricted_work: { label: "Restricted Work Case", labelAr: "حالة عمل مقيد", color: "#e11d48", description: "Restricted work case" },
  disability: { label: "Permanent Disability", labelAr: "إعاقة دائمة", color: "#dc2626", description: "Permanent disability" },
  fatality: { label: "Fatality", labelAr: "وفاة", color: "#0f172a", description: "Fatality" },
  near_miss: { label: "Near Miss", labelAr: "حادثة وشيكة", color: "#3b82f6", description: "Near miss" },
  property_damage: { label: "Property Damage", labelAr: "أضرار بالممتلكات", color: "#8b5cf6", description: "Property damage" },
  environmental: { label: "Environmental Incident", labelAr: "حادث بيئي", color: "#10b981", description: "Environmental incident" },
  other: { label: "Other", labelAr: "أخرى", color: "#64748b", description: "Other" },
};

export const FINDING_SEVERITY_META: Record<string, { label: string; labelAr: string; color: string }> = {
  low: { label: "Low", labelAr: "منخفضة", color: "#22c55e" },
  medium: { label: "Medium", labelAr: "متوسطة", color: "#eab308" },
  high: { label: "High", labelAr: "عالية", color: "#f97316" },
  critical: { label: "Critical", labelAr: "حرجة", color: "#ef4444" },
};

export const FINDING_STATUS_META: Record<string, { label: string; labelAr: string; color: string }> = {
  open: { label: "Open", labelAr: "مفتوح", color: "#3b82f6" },
  in_progress: { label: "In Progress", labelAr: "قيد المعالجة", color: "#eab308" },
  closed: { label: "Closed", labelAr: "مغلق", color: "#22c55e" },
  overdue: { label: "Overdue", labelAr: "متأخر", color: "#ef4444" },
};

export const PERMIT_TYPE_LABELS: Record<string, string> = {
  hot_work: "Hot Work",
  cold_work: "Cold Work",
  work_at_height: "Work at Height",
  confined_space: "Confined Space",
  excavation: "Excavation",
  electrical: "Electrical",
  lifting: "Lifting / Rigging",
  chemical: "Chemical",
  demolition: "Demolition",
  general: "General",
};

export const PERMIT_TYPE_LABELS_AR: Record<string, string> = {
  hot_work: "أعمال ساخنة",
  cold_work: "أعمال باردة",
  work_at_height: "العمل على ارتفاعات",
  confined_space: "الأماكن المغلقة",
  excavation: "حفريات",
  electrical: "كهربائية",
  lifting: "رفع / مناولة",
  chemical: "كيميائية",
  demolition: "هدم",
  general: "عامة",
};

export const PERMIT_STATUS_META: Record<string, { label: string; labelAr: string; color: string }> = {
  draft: { label: "Draft", labelAr: "مسودة", color: "#64748b" },
  pending: { label: "Pending Approval", labelAr: "بانتظار الموافقة", color: "#f59e0b" },
  approved: { label: "Approved", labelAr: "موافق عليه", color: "#3b82f6" },
  active: { label: "Active", labelAr: "نشط", color: "#22c55e" },
  completed: { label: "Completed", labelAr: "مكتمل", color: "#0ea5e9" },
  rejected: { label: "Rejected", labelAr: "مرفوض", color: "#ef4444" },
  cancelled: { label: "Cancelled", labelAr: "ملغى", color: "#94a3b8" },
};

export const PROJECT_STATUS_META: Record<string, { label: string; labelAr: string; color: string }> = {
  active: { label: "Active", labelAr: "نشط", color: "#22c55e" },
  on_hold: { label: "On Hold", labelAr: "متوقف مؤقتاً", color: "#f59e0b" },
  completed: { label: "Completed", labelAr: "مكتمل", color: "#0ea5e9" },
};

export const ARTICLE_CATEGORIES = [
  { value: "news", label: "News", labelAr: "أخبار" },
  { value: "article", label: "Article", labelAr: "مقال" },
  { value: "safety_tip", label: "Safety Tip", labelAr: "نصيحة سلامة" },
  { value: "announcement", label: "Announcement", labelAr: "إعلان" },
] as const;

export const INDUCTION_TYPES = [
  { value: "general", label: "General", labelAr: "عام" },
  { value: "site_induction", label: "Site Induction", labelAr: "تهيئة للموقع" },
  { value: "safety", label: "Safety Induction", labelAr: "تهيئة سلامة" },
  { value: "environmental", label: "Environmental", labelAr: "بيئية" },
  { value: "electrical", label: "Electrical Safety", labelAr: "سلامة كهربائية" },
  { value: "confined_space", label: "Confined Space", labelAr: "الأماكن المغلقة" },
  { value: "hot_work", label: "Hot Work", labelAr: "أعمال ساخنة" },
  { value: "other", label: "Other", labelAr: "أخرى" },
] as const;

export const INDUCTION_STATUSES = [
  { value: "completed", label: "Completed", labelAr: "مكتمل" },
  { value: "scheduled", label: "Scheduled", labelAr: "مجدول" },
  { value: "expired", label: "Expired", labelAr: "منتهي الصلاحية" },
] as const;

export const COURSE_CATEGORIES = [
  { value: "safety", label: "Safety", labelAr: "السلامة" },
  { value: "health", label: "Health", labelAr: "الصحة" },
  { value: "environment", label: "Environment", labelAr: "البيئة" },
  { value: "technical", label: "Technical", labelAr: "فني" },
  { value: "management", label: "Management", labelAr: "إداري" },
  { value: "soft_skills", label: "Soft Skills", labelAr: "مهارات شخصية" },
  { value: "other", label: "Other", labelAr: "أخرى" },
] as const;

export const COURSE_LEVELS = [
  { value: "beginner", label: "Beginner", labelAr: "مبتدئ" },
  { value: "intermediate", label: "Intermediate", labelAr: "متوسط" },
  { value: "advanced", label: "Advanced", labelAr: "متقدم" },
  { value: "all_levels", label: "All Levels", labelAr: "جميع المستويات" },
] as const;

export const COURSE_STATUS_META: Record<string, { label: string; labelAr: string; color: string }> = {
  draft: { label: "Draft", labelAr: "مسودة", color: "#64748b" },
  published: { label: "Published", labelAr: "منشور", color: "#22c55e" },
  archived: { label: "Archived", labelAr: "مؤرشف", color: "#94a3b8" },
};