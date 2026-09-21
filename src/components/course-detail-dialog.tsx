"use client";

import * as React from "react";
import { enrollCourse } from "@/app/(dashboard)/courses/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookOpen, Users, Clock } from "lucide-react";

export interface CourseDetailDialogProps {
  id: string;
  title: string;
  description: string;
  coverUrl: string | null;
  categoryLabel: string | null;
  levelLabel: string | null;
  durationLabel: string | null;
  enrolledCount: number;
  enrollLabel: string;
  learnersLabel: string;
  trigger: React.ReactNode;
}

export function CourseDetailDialog({
  id,
  title,
  description,
  coverUrl,
  categoryLabel,
  levelLabel,
  durationLabel,
  enrolledCount,
  enrollLabel,
  learnersLabel,
  trigger,
}: CourseDetailDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        type="button"
        className="block w-full text-left"
        onClick={() => setOpen(true)}
      >
        {trigger}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={title}
              className="aspect-video w-full rounded-t-xl object-cover"
            />
          ) : null}
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <p className="line-clamp-3 text-sm text-muted-foreground">{description}</p>
          </DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            {categoryLabel && <Badge variant="secondary">{categoryLabel}</Badge>}
            {levelLabel && <Badge variant="outline">{levelLabel}</Badge>}
          </div>
          {(durationLabel || enrolledCount > 0) && (
            <p className="flex items-center gap-4 text-sm text-muted-foreground">
              {durationLabel && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {durationLabel}
                </span>
              )}
              {enrolledCount > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {enrolledCount} {learnersLabel}
                </span>
              )}
            </p>
          )}
          <DialogFooter>
            <form action={enrollCourse}>
              <input type="hidden" name="id" value={id} />
              <Button type="submit">{enrollLabel}</Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
