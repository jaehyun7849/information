CREATE TABLE `board_status` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`attempted_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `daily_readings` (
	`id` text PRIMARY KEY NOT NULL,
	`reading` text NOT NULL,
	`raw` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`reading` text NOT NULL,
	`raw` text NOT NULL,
	`created_at` text NOT NULL
);
