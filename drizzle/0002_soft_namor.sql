CREATE TABLE `whatsapp_receipts` (
	`id` text PRIMARY KEY NOT NULL,
	`message_id` text NOT NULL,
	`author` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`hash` text NOT NULL,
	`caption` text NOT NULL,
	`received` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`record_id` text,
	`reviewer` text,
	FOREIGN KEY (`message_id`) REFERENCES `whatsapp_messages`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`author`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`record_id`) REFERENCES `records`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewer`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `whatsapp_receipts_message_id_unique` ON `whatsapp_receipts` (`message_id`);