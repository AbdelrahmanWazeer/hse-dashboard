import { requirePermission } from "@/lib/guards";
import { PageHeader } from "@/components/page-header";
import { CourseForm } from "@/components/courses/course-form";

export default async function NewCoursePage() {
  await requirePermission("courses:manage");
  return (
    <div>
      <PageHeader title="New Course" description="Add a course to the catalog" />
      <CourseForm />
    </div>
  );
}