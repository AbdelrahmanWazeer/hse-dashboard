"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/components/i18n/locale-provider";
import { enrollCourse, updateCourseProgress, resetCourse } from "@/app/(dashboard)/courses/actions";
import { ExternalLink, PlayCircle, CheckCircle2, Undo2 } from "lucide-react";

const statusMeta: Record<string, { label: string; labelAr: string; color: string }> = {
  enrolled: { label: "Enrolled", labelAr: "مسجل", color: "#3b82f6" },
  in_progress: { label: "In progress", labelAr: "قيد التقدم", color: "#f59e0b" },
  completed: { label: "Completed", labelAr: "مكتملة", color: "#22c55e" },
};

export function CourseActions({
  courseId,
  courseUrl,
  enrollment,
}: {
  courseId: string;
  courseUrl: string | null;
  enrollment: { status: string; progress: number } | null;
}) {
  const { tr } = useLocale();
  const [local, setLocal] = React.useState<number | null>(null);
  const progress = local ?? enrollment?.progress ?? 0;

  if (!enrollment) {
    return (
      <form action={enrollCourse} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={courseId} />
        {courseUrl && (
          <a href={courseUrl} target="_blank" rel="noopener noreferrer">
            <Button type="button" variant="outline">
              <ExternalLink className="h-4 w-4" />
              {tr("Open course", "فتح الدورة")}
            </Button>
          </a>
        )}
        <Button type="submit">
          <PlayCircle className="h-4 w-4" />
          {tr("Enroll", "تسجيل")}
        </Button>
      </form>
    );
  }

  const meta = statusMeta[enrollment.status] ?? statusMeta.enrolled;
  const completed = enrollment.status === "completed";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge style={{ backgroundColor: `${meta.color}22`, color: meta.color }}>
            {tr(meta.label, meta.labelAr)}
          </Badge>
          <span className="text-sm font-medium">{tr(`${enrollment.progress}% complete`, `${enrollment.progress}% مكتملة`)}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {courseUrl && (
            <a href={courseUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4" />
                {tr("Continue course", "متابعة الدورة")}
              </Button>
            </a>
          )}
          {!completed && (
            <form action={updateCourseProgress}>
              <input type="hidden" name="id" value={courseId} />
              <input type="hidden" name="progress" value="100" />
              <Button type="submit" size="sm">
                <CheckCircle2 className="h-4 w-4" />
                {tr("Mark complete", "تعليم كمكتملة")}
              </Button>
            </form>
          )}
          <form action={resetCourse}>
            <input type="hidden" name="id" value={courseId} />
            <Button type="submit" variant="ghost" size="sm">
              <Undo2 className="h-4 w-4" />
              {tr("Remove from my courses", "إزالة من دوراتي")}
            </Button>
          </form>
        </div>
      </div>

      <div className="space-y-2">
        <Progress value={enrollment.progress} className="h-2" />
        {!completed && (
          <form action={updateCourseProgress} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={courseId} />
            <input
              type="range"
              name="progress"
              min={0}
              max={100}
              step={5}
              value={progress}
              onChange={(e) => setLocal(Number(e.target.value))}
              className="w-40"
              aria-label={tr("Progress", "التقدم")}
            />
            <Button type="submit" size="sm" variant="outline">
              {tr(`Save ${progress}%`, `حفظ ${progress}%`)}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}