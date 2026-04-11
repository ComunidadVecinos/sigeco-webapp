-- CreateEnum
CREATE TYPE "CommunityIncidentStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED');

-- CreateTable
CREATE TABLE "community_incidents" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "author_membership_id" UUID,
    "title" VARCHAR(160) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "CommunityIncidentStatus" NOT NULL DEFAULT 'PENDING',
    "image_storage_path" TEXT,
    "image_mime_type" VARCHAR(100),
    "image_size_bytes" INTEGER,
    "edited_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "community_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "community_incidents_community_status_created_lookup_idx" ON "community_incidents"("community_id", "deleted_at", "status", "created_at");

-- CreateIndex
CREATE INDEX "community_incidents_author_membership_lookup_idx" ON "community_incidents"("author_membership_id");

-- AddForeignKey
ALTER TABLE "community_incidents"
ADD CONSTRAINT "community_incidents_community_id_fkey"
FOREIGN KEY ("community_id") REFERENCES "communities"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_incidents"
ADD CONSTRAINT "community_incidents_author_membership_id_fkey"
FOREIGN KEY ("author_membership_id") REFERENCES "memberships"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
