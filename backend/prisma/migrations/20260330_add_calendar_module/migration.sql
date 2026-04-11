-- CreateEnum
CREATE TYPE "CalendarEventType" AS ENUM ('PERSONAL', 'NEWS', 'RESERVATION', 'VOTING');

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "owner_membership_id" UUID,
    "type" "CalendarEventType" NOT NULL,
    "source_entity_id" VARCHAR(191),
    "title" VARCHAR(160) NOT NULL,
    "event_date" DATE NOT NULL,
    "start_time" VARCHAR(5) NOT NULL,
    "end_time" VARCHAR(5) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "calendar_events_auto_source_key" ON "calendar_events"("community_id", "type", "source_entity_id");

-- CreateIndex
CREATE INDEX "calendar_events_month_lookup_idx" ON "calendar_events"("community_id", "event_date", "deleted_at");

-- CreateIndex
CREATE INDEX "calendar_events_owner_month_lookup_idx" ON "calendar_events"("community_id", "owner_membership_id", "event_date", "deleted_at");

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_owner_membership_id_fkey" FOREIGN KEY ("owner_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;
