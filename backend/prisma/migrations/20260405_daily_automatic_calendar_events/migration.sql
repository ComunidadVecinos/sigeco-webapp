-- AlterTable
ALTER TABLE "calendar_events"
ADD COLUMN "source_occurrence_key" VARCHAR(10);

-- DropIndex
DROP INDEX "calendar_events_auto_source_key";

-- CreateIndex
CREATE UNIQUE INDEX "calendar_events_auto_source_occurrence_key"
ON "calendar_events"("community_id", "type", "source_entity_id", "source_occurrence_key");
