CREATE TABLE `course_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`course_id` text NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'enrolled' NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`enrolled_at` integer NOT NULL,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `course_progress_tenant_idx` ON `course_progress` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `course_progress_course_idx` ON `course_progress` (`course_id`);--> statement-breakpoint
CREATE INDEX `course_progress_user_idx` ON `course_progress` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `course_progress_user_course_idx` ON `course_progress` (`user_id`,`course_id`);--> statement-breakpoint
CREATE TABLE `courses` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`category` text DEFAULT 'other' NOT NULL,
	`provider` text,
	`level` text DEFAULT 'beginner' NOT NULL,
	`duration_minutes` integer DEFAULT 0 NOT NULL,
	`cover_url` text,
	`course_url` text,
	`tags` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_by_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `courses_tenant_idx` ON `courses` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `courses_tenant_status_idx` ON `courses` (`tenant_id`,`status`);