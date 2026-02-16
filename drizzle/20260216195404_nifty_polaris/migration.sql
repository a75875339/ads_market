CREATE TABLE "ad_formats" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ad_formats_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"channel_id" bigint NOT NULL,
	"format_type" text NOT NULL,
	"description" text,
	"price_usd" numeric(18,2) NOT NULL,
	"retention_hours" integer NOT NULL,
	"top_hours" integer NOT NULL,
	"cpm" numeric(18,2),
	"er_percent" numeric(5,2),
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "campaigns_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"advertiser_id" bigint NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"accept_applications" boolean DEFAULT false NOT NULL,
	"application_min_price_usd" numeric(18,2),
	"application_max_price_usd" numeric(18,2),
	"application_min_cpmusd" numeric(18,2),
	"application_max_cpmusd" numeric(18,2),
	"application_format_type" text,
	"application_category_id" bigint,
	"application_min_subscribers" integer,
	"application_max_subscribers" integer,
	"application_min_avg_views" integer,
	"application_max_avg_views" integer,
	"application_min_er_percent" numeric(5,2),
	"application_max_er_percent" numeric(5,2),
	"application_publication_datetime_from" timestamp,
	"application_publication_datetime_to" timestamp,
	"notes" text,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"emoji" text,
	"order_value" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channel_managers" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "channel_managers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"channel_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"permissions" text DEFAULT 'none' NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "channel_manager_unique" UNIQUE("channel_id","user_id"),
	CONSTRAINT "channel_managers_permissions_check" CHECK ("permissions" IN ('none', 'view', 'manage_deals', 'manage_formats', 'full'))
);
--> statement-breakpoint
CREATE TABLE "channel_stats" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "channel_stats_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"channel_id" bigint NOT NULL UNIQUE,
	"subscribers" integer,
	"avg_views" integer,
	"avg_reach" integer,
	"er_percent" numeric(5,2),
	"premium_percent" numeric(5,2),
	"language_distribution" jsonb,
	"gender_distribution" jsonb,
	"verified_metrics" jsonb,
	"source" text DEFAULT 'external_service' NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channels" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "channels_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"telegram_chat_id" bigint NOT NULL UNIQUE,
	"owner_id" bigint NOT NULL,
	"title" text NOT NULL,
	"username" text,
	"description" text,
	"channel_type" text NOT NULL,
	"category_id" bigint,
	"status" text DEFAULT 'pending' NOT NULL,
	"bot_is_admin" boolean DEFAULT false NOT NULL,
	"bot_admin_verified_at" timestamp,
	"avatar_url" text,
	"language" text DEFAULT 'en',
	"reward_wallet_address" text,
	"is_visible" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "channels_channel_type_check" CHECK ("channel_type" IN ('channel', 'private_channel', 'group', 'private_group')),
	CONSTRAINT "channels_status_check" CHECK ("status" IN ('pending', 'active', 'suspended', 'too_small', 'error'))
);
--> statement-breakpoint
CREATE TABLE "deal_events" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "deal_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"deal_id" bigint NOT NULL,
	"event_type" text NOT NULL,
	"actor_id" bigint,
	"actor_type" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deal_messages" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "deal_messages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"deal_id" bigint NOT NULL,
	"sender_id" bigint NOT NULL,
	"message_text" text NOT NULL,
	"telegram_message_id" bigint,
	"message_type" text DEFAULT 'text' NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deal_topics" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "deal_topics_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"deal_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"topic_id" integer NOT NULL,
	"role" text NOT NULL,
	"start_message_id" integer,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "deal_topics_deal_user_unique" UNIQUE("deal_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "deal_wallet_transactions" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "deal_wallet_transactions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"deal_id" bigint NOT NULL,
	"tx_type" text NOT NULL,
	"tx_hash" text CONSTRAINT "escrow_tx_hash_idx" UNIQUE,
	"amount_nanotons" bigint NOT NULL,
	"amount_usdt" numeric(18,6),
	"from_address" text,
	"to_address" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"query_id" text,
	"confirmed_at" timestamp,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "deal_wallet_tx_idempotency_key_idx" UNIQUE("query_id","deal_id")
);
--> statement-breakpoint
CREATE TABLE "deals" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "deals_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"creator_id" bigint NOT NULL,
	"channel_id" bigint NOT NULL,
	"campaign_id" bigint NOT NULL,
	"draft_deal_message" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"ad_format_id" bigint,
	"ad_price_usd" numeric(18,2),
	"ad_schedule_at" timestamp,
	"creative_data" jsonb,
	"deal_wallet" text CONSTRAINT "deals_deal_wallet_idx" UNIQUE,
	"scheduled_at" timestamp,
	"posted_at" timestamp,
	"posted_message_id" bigint,
	"completed_at" timestamp,
	"cancelled_at" timestamp,
	"cancelled_by_id" bigint,
	"cancel_reason" text,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"telegram_id" bigint UNIQUE,
	"first_name" text,
	"last_name" text,
	"username" text,
	"avatar_url" text,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"blocked_reason" text,
	"language" text DEFAULT 'en',
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "ad_formats_channel_format_unique" ON "ad_formats" ("channel_id","format_type");--> statement-breakpoint
CREATE INDEX "ad_formats_active_idx" ON "ad_formats" ("is_active");--> statement-breakpoint
CREATE INDEX "ad_formats_price_idx" ON "ad_formats" ("price_usd");--> statement-breakpoint
CREATE INDEX "campaign_requests_advertiser_idx" ON "campaigns" ("advertiser_id","status","id");--> statement-breakpoint
CREATE INDEX "campaign_requests_status_idx" ON "campaigns" ("status","accept_applications","application_category_id");--> statement-breakpoint
CREATE INDEX "channel_managers_channel_idx" ON "channel_managers" ("channel_id");--> statement-breakpoint
CREATE INDEX "channel_managers_user_idx" ON "channel_managers" ("user_id");--> statement-breakpoint
CREATE INDEX "channel_stats_channel_idx" ON "channel_stats" ("channel_id");--> statement-breakpoint
CREATE INDEX "channel_stats_subscribers_idx" ON "channel_stats" ("subscribers");--> statement-breakpoint
CREATE INDEX "channel_stats_avg_views_idx" ON "channel_stats" ("avg_views");--> statement-breakpoint
CREATE INDEX "channels_owner_idx" ON "channels" ("owner_id");--> statement-breakpoint
CREATE INDEX "channels_category_idx" ON "channels" ("category_id");--> statement-breakpoint
CREATE INDEX "channels_status_idx" ON "channels" ("status");--> statement-breakpoint
CREATE INDEX "channels_visible_idx" ON "channels" ("is_visible");--> statement-breakpoint
CREATE INDEX "deal_events_deal_idx" ON "deal_events" ("deal_id","event_type");--> statement-breakpoint
CREATE INDEX "deal_messages_deal_idx" ON "deal_messages" ("deal_id");--> statement-breakpoint
CREATE INDEX "deal_messages_sender_idx" ON "deal_messages" ("sender_id");--> statement-breakpoint
CREATE INDEX "deal_messages_created_idx" ON "deal_messages" ("created_at");--> statement-breakpoint
CREATE INDEX "deal_topics_user_idx" ON "deal_topics" ("topic_id","user_id");--> statement-breakpoint
CREATE INDEX "deal_topics_deal_idx" ON "deal_topics" ("user_id");--> statement-breakpoint
CREATE INDEX "deal_wallet_tx_deal_idx" ON "deal_wallet_transactions" ("deal_id");--> statement-breakpoint
CREATE INDEX "escrow_tx_status_idx" ON "deal_wallet_transactions" ("status");--> statement-breakpoint
CREATE INDEX "deals_channel_idx" ON "deals" ("channel_id","status");--> statement-breakpoint
CREATE INDEX "deals_campaign_idx" ON "deals" ("campaign_id","status");--> statement-breakpoint
CREATE INDEX "users_telegram_id_idx" ON "users" ("telegram_id");--> statement-breakpoint
CREATE INDEX "users_username_idx" ON "users" ("username");--> statement-breakpoint
ALTER TABLE "ad_formats" ADD CONSTRAINT "ad_formats_channel_id_channels_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id");--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_advertiser_id_users_id_fkey" FOREIGN KEY ("advertiser_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_application_category_id_categories_id_fkey" FOREIGN KEY ("application_category_id") REFERENCES "categories"("id");--> statement-breakpoint
ALTER TABLE "channel_managers" ADD CONSTRAINT "channel_managers_channel_id_channels_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id");--> statement-breakpoint
ALTER TABLE "channel_managers" ADD CONSTRAINT "channel_managers_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "channel_stats" ADD CONSTRAINT "channel_stats_channel_id_channels_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id");--> statement-breakpoint
ALTER TABLE "channels" ADD CONSTRAINT "channels_owner_id_users_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "channels" ADD CONSTRAINT "channels_category_id_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id");--> statement-breakpoint
ALTER TABLE "deal_events" ADD CONSTRAINT "deal_events_deal_id_deals_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id");--> statement-breakpoint
ALTER TABLE "deal_events" ADD CONSTRAINT "deal_events_actor_id_users_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "deal_messages" ADD CONSTRAINT "deal_messages_deal_id_deals_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id");--> statement-breakpoint
ALTER TABLE "deal_messages" ADD CONSTRAINT "deal_messages_sender_id_users_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "deal_topics" ADD CONSTRAINT "deal_topics_deal_id_deals_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id");--> statement-breakpoint
ALTER TABLE "deal_topics" ADD CONSTRAINT "deal_topics_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "deal_wallet_transactions" ADD CONSTRAINT "deal_wallet_transactions_deal_id_deals_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id");--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_creator_id_users_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_channel_id_channels_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id");--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_campaign_id_campaigns_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id");--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_ad_format_id_ad_formats_id_fkey" FOREIGN KEY ("ad_format_id") REFERENCES "ad_formats"("id");--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_cancelled_by_id_users_id_fkey" FOREIGN KEY ("cancelled_by_id") REFERENCES "users"("id");