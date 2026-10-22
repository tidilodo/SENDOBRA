CREATE TABLE `attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`record` text NOT NULL,
	`name` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`hash` text NOT NULL,
	`actor` text NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`record`) REFERENCES `records`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`entity` text NOT NULL,
	`before` text,
	`after` text,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`address` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_code_unique` ON `projects` (`code`);--> statement-breakpoint
CREATE TABLE `records` (
	`id` text PRIMARY KEY NOT NULL,
	`project` text NOT NULL,
	`author` text NOT NULL,
	`description` text NOT NULL,
	`amount` integer,
	`type` text NOT NULL,
	`category` text NOT NULL,
	`supplier` text,
	`date` text NOT NULL,
	`status` text NOT NULL,
	`payment` text DEFAULT 'unreported' NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`project`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`author`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`contact` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`identity` text,
	`role` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`projects` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_identity_unique` ON `users` (`identity`);