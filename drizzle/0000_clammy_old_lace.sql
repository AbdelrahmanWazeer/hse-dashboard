CREATE TABLE `articles` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`title` text NOT NULL,
	`slug` text,
	`category` text DEFAULT 'news' NOT NULL,
	`excerpt` text,
	`content` text NOT NULL,
	`cover_image` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` integer,
	`author_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `articles_tenant_idx` ON `articles` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `articles_status_idx` ON `articles` (`status`);--> statement-breakpoint
CREATE TABLE `findings` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`project_id` text,
	`finding_no` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`severity` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`location` text,
	`latitude` real,
	`longitude` real,
	`photo_urls` text,
	`reported_by_id` text,
	`assigned_to_id` text,
	`due_date` integer,
	`root_cause` text,
	`corrective_action` text,
	`remarks` text,
	`closed_at` integer,
	`closed_by_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`reported_by_id`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`assigned_to_id`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`closed_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `findings_tenant_idx` ON `findings` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `findings_project_idx` ON `findings` (`project_id`);--> statement-breakpoint
CREATE INDEX `findings_status_idx` ON `findings` (`status`);--> statement-breakpoint
CREATE TABLE `incidents` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`project_id` text,
	`incident_no` text NOT NULL,
	`incident_type` text NOT NULL,
	`date` integer NOT NULL,
	`time` text,
	`location` text,
	`description` text NOT NULL,
	`person_name` text,
	`person_company` text,
	`person_job_title` text,
	`age` integer,
	`gender` text,
	`body_part` text,
	`nature_of_injury` text,
	`cause` text,
	`immediate_action` text,
	`investigation` text,
	`root_cause` text,
	`corrective_actions` text,
	`lost_days` integer DEFAULT 0,
	`restricted_days` integer DEFAULT 0,
	`medical_treatment_cost` real,
	`property_damage_cost` real,
	`photo_urls` text,
	`status` text DEFAULT 'reported' NOT NULL,
	`reported_by_id` text,
	`is_lti` integer DEFAULT false,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`reported_by_id`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `incidents_tenant_idx` ON `incidents` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `incidents_type_idx` ON `incidents` (`incident_type`);--> statement-breakpoint
CREATE INDEX `incidents_date_idx` ON `incidents` (`date`);--> statement-breakpoint
CREATE TABLE `inductions` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`project_id` text,
	`personnel_name` text NOT NULL,
	`company` text,
	`id_number` text,
	`induction_type` text DEFAULT 'general' NOT NULL,
	`date` integer NOT NULL,
	`trainer` text,
	`status` text DEFAULT 'completed' NOT NULL,
	`expiry_date` integer,
	`notes` text,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `inductions_tenant_idx` ON `inductions` (`tenant_id`);--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`job_title` text NOT NULL,
	`token` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`invited_by_id` text,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invited_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `invitations_tenant_idx` ON `invitations` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `invitations_token_idx` ON `invitations` (`token`);--> statement-breakpoint
CREATE TABLE `manhours` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`project_id` text,
	`date` integer NOT NULL,
	`manhours` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `manhours_tenant_date_idx` ON `manhours` (`tenant_id`,`date`);--> statement-breakpoint
CREATE TABLE `manpower` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`project_id` text,
	`date` integer NOT NULL,
	`headcount` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `manpower_tenant_date_idx` ON `manpower` (`tenant_id`,`date`);--> statement-breakpoint
CREATE TABLE `media` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`url` text NOT NULL,
	`key` text,
	`name` text,
	`type` text,
	`size` integer,
	`entity_type` text,
	`entity_id` text,
	`uploaded_by_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploaded_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `media_tenant_idx` ON `media` (`tenant_id`);--> statement-breakpoint
CREATE TABLE `memberships` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`tenant_id` text NOT NULL,
	`role` text NOT NULL,
	`job_title` text NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `memberships_user_tenant_idx` ON `memberships` (`user_id`,`tenant_id`);--> statement-breakpoint
CREATE TABLE `ppe_items` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`size` text,
	`brand` text,
	`description` text,
	`total_stock` integer DEFAULT 0 NOT NULL,
	`safety_stock` integer DEFAULT 0 NOT NULL,
	`issued` integer DEFAULT 0 NOT NULL,
	`available` integer DEFAULT 0 NOT NULL,
	`unit` text DEFAULT 'pcs' NOT NULL,
	`storage_location` text,
	`price_per_unit` real,
	`min_reorder_level` integer DEFAULT 5 NOT NULL,
	`photo_url` text,
	`is_active` integer DEFAULT true,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ppe_tenant_idx` ON `ppe_items` (`tenant_id`);--> statement-breakpoint
CREATE TABLE `ppe_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`ppe_item_id` text NOT NULL,
	`type` text NOT NULL,
	`quantity` integer NOT NULL,
	`team_member_id` text,
	`date` integer NOT NULL,
	`note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ppe_item_id`) REFERENCES `ppe_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`team_member_id`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `ppe_transactions_tenant_idx` ON `ppe_transactions` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `ppe_transactions_item_idx` ON `ppe_transactions` (`ppe_item_id`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`name` text NOT NULL,
	`code` text,
	`description` text,
	`location` text,
	`status` text DEFAULT 'active' NOT NULL,
	`start_date` integer,
	`end_date` integer,
	`hse_manager_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `projects_tenant_idx` ON `projects` (`tenant_id`);--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`description` text,
	`start_date` integer,
	`end_date` integer,
	`data` text,
	`file_name` text,
	`file_url` text,
	`created_by_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `reports_tenant_idx` ON `reports` (`tenant_id`);--> statement-breakpoint
CREATE TABLE `site_layouts` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`project_id` text,
	`name` text NOT NULL,
	`image_url` text NOT NULL,
	`width` real,
	`height` real,
	`is_active` integer DEFAULT false,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `site_layouts_tenant_idx` ON `site_layouts` (`tenant_id`);--> statement-breakpoint
CREATE TABLE `tbt_records` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`project_id` text,
	`title` text NOT NULL,
	`topic` text,
	`date` integer NOT NULL,
	`conducted_by` text,
	`attendees` integer DEFAULT 0 NOT NULL,
	`duration_minutes` integer DEFAULT 0,
	`notes` text,
	`photo_urls` text,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`conducted_by`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `tbt_tenant_date_idx` ON `tbt_records` (`tenant_id`,`date`);--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`project_id` text,
	`user_id` text,
	`manager_id` text,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`avatar` text,
	`job_title` text NOT NULL,
	`role` text NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `team_members_tenant_idx` ON `team_members` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `team_members_project_idx` ON `team_members` (`project_id`);--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`plan` text DEFAULT 'starter',
	`logo_url` text,
	`primary_color` text DEFAULT '#0f766e',
	`settings` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tenants_slug_idx` ON `tenants` (`slug`);--> statement-breakpoint
CREATE TABLE `trainings` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`project_id` text,
	`personnel_name` text NOT NULL,
	`course_name` text NOT NULL,
	`training_type` text DEFAULT 'specific' NOT NULL,
	`provider` text,
	`date` integer NOT NULL,
	`certificate_no` text,
	`expiry_date` integer,
	`status` text DEFAULT 'valid' NOT NULL,
	`notes` text,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `trainings_tenant_idx` ON `trainings` (`tenant_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`image` text,
	`phone` text,
	`is_super_admin` integer DEFAULT false,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `work_permits` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`project_id` text,
	`permit_no` text NOT NULL,
	`permit_type` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`location` text,
	`location_x` real,
	`location_y` real,
	`start_date` integer NOT NULL,
	`end_date` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`requested_by` text,
	`assigned_to` text,
	`approved_by` text,
	`approved_at` integer,
	`ppe_required` text,
	`hazards` text,
	`controls` text,
	`isolation` text,
	`reviewers` text,
	`remarks` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`requested_by`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`assigned_to`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `permits_tenant_idx` ON `work_permits` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `permits_status_idx` ON `work_permits` (`status`);