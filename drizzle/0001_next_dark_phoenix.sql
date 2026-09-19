CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`actor_id` text,
	`actor_name` text,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`details` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `audit_logs_tenant_idx` ON `audit_logs` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_created_idx` ON `audit_logs` (`created_at`);--> statement-breakpoint
ALTER TABLE `reports` ADD `schedule` text;--> statement-breakpoint
ALTER TABLE `reports` ADD `email_to` text;--> statement-breakpoint
ALTER TABLE `reports` ADD `last_sent_at` integer;--> statement-breakpoint
CREATE INDEX `reports_tenant_created_idx` ON `reports` (`tenant_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `reports_schedule_idx` ON `reports` (`schedule`);--> statement-breakpoint
CREATE INDEX `findings_tenant_created_idx` ON `findings` (`tenant_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `incidents_tenant_date_idx` ON `incidents` (`tenant_id`,`date`);--> statement-breakpoint
CREATE INDEX `inductions_tenant_date_idx` ON `inductions` (`tenant_id`,`date`);--> statement-breakpoint
CREATE INDEX `media_tenant_created_idx` ON `media` (`tenant_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `ppe_transactions_tenant_date_idx` ON `ppe_transactions` (`tenant_id`,`date`);--> statement-breakpoint
CREATE INDEX `trainings_tenant_date_idx` ON `trainings` (`tenant_id`,`date`);