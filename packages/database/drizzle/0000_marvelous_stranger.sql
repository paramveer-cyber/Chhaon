CREATE TABLE "grid_cell" (
	"id" serial PRIMARY KEY NOT NULL,
	"centre_latitude" double precision NOT NULL,
	"centre_longitude" double precision NOT NULL,
	"surface_temperature_celsius" double precision NOT NULL,
	"ndvi" double precision NOT NULL,
	"ndbi" double precision NOT NULL,
	"ndwi" double precision NOT NULL,
	"baseline_heat" double precision NOT NULL,
	"population" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cooling_point" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"source" text NOT NULL,
	"hours_status" text DEFAULT 'unconfirmed' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cooling_point_report" (
	"id" serial PRIMARY KEY NOT NULL,
	"cooling_point_id" integer,
	"report_type" text NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_weather" (
	"weather_date" date PRIMARY KEY NOT NULL,
	"apparent_temperature_max_celsius" double precision NOT NULL,
	"weather_index" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_plan" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_date" date NOT NULL,
	"coverage_percent_before" double precision NOT NULL,
	"coverage_percent_after" double precision NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "daily_plan_planDate_unique" UNIQUE("plan_date")
);
--> statement-breakpoint
CREATE TABLE "plan_pick" (
	"id" serial PRIMARY KEY NOT NULL,
	"daily_plan_id" integer NOT NULL,
	"cooling_point_id" integer NOT NULL,
	"rank" integer NOT NULL,
	"people_newly_covered" double precision NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cooling_point_report" ADD CONSTRAINT "cooling_point_report_cooling_point_id_cooling_point_id_fk" FOREIGN KEY ("cooling_point_id") REFERENCES "public"."cooling_point"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_pick" ADD CONSTRAINT "plan_pick_daily_plan_id_daily_plan_id_fk" FOREIGN KEY ("daily_plan_id") REFERENCES "public"."daily_plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_pick" ADD CONSTRAINT "plan_pick_cooling_point_id_cooling_point_id_fk" FOREIGN KEY ("cooling_point_id") REFERENCES "public"."cooling_point"("id") ON DELETE cascade ON UPDATE no action;