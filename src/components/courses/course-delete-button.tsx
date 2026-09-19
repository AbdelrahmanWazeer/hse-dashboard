"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/i18n/locale-provider";
import { deleteCourse } from "@/app/(dashboard)/courses/actions";

export function CourseDeleteButton({ courseId }: { courseId: string }) {
  const { tr } = useLocale();
  const [confirmed, setConfirmed] = React.useState(false);

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-destructive"
      disabled={confirmed}
      onClick={() => {
        const ok = window.confirm(
          tr(
            "Delete this course permanently? Team progress will be removed too.",
            "حذف هذه الدورة نهائيًا؟ سيتم إزالة تقدم الفريق أيضًا."
          )
        );
        if (!ok) return;
        setConfirmed(true);
        const fd = new FormData();
        fd.append("id", courseId);
        deleteCourse(fd);
      }}
    >
      {confirmed ? tr("Deleting…", "جارٍ الحذف…") : tr("Delete", "حذف")}
    </Button>
  );
}