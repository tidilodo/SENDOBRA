CREATE TABLE `whatsapp_connection` (
	`id` text PRIMARY KEY NOT NULL,
	`state` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `whatsapp_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`project` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`project`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `whatsapp_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`group_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`kind` text NOT NULL,
	`status` text NOT NULL,
	`record_id` text,
	`received` text NOT NULL,
	`question` text,
	`correlation` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `whatsapp_senders` (
	`id` text PRIMARY KEY NOT NULL,
	`user` text NOT NULL,
	FOREIGN KEY (`user`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
