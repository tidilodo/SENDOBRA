CREATE TABLE `supabase_user_bindings` (
	`subject` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `supabase_user_bindings_user_id_unique` ON `supabase_user_bindings` (`user_id`);