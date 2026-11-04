CREATE TABLE `whatsapp_group_directory` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`seen` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `whatsapp_group_members` (
	`group_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`seen` text NOT NULL,
	PRIMARY KEY(`group_id`, `sender_id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_group_senders` (
	`group_id` text NOT NULL,
	`sender_id` text NOT NULL,
	PRIMARY KEY(`group_id`, `sender_id`),
	FOREIGN KEY (`group_id`) REFERENCES `whatsapp_groups`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sender_id`) REFERENCES `whatsapp_senders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `whatsapp_group_settings` (
	`group_id` text PRIMARY KEY NOT NULL,
	`mode` text DEFAULT 'project' NOT NULL,
	`updated` text NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `whatsapp_groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `whatsapp_messages_group_received` ON `whatsapp_messages` (`group_id`,`received`);