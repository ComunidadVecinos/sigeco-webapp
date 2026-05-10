CREATE TABLE "community_news" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "author_membership_id" UUID,
    "title" VARCHAR(160) NOT NULL,
    "description" TEXT NOT NULL,
    "event_starts_at" TIMESTAMP(3),
    "event_ends_at" TIMESTAMP(3),
    "edited_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "community_news_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "community_news_community_created_lookup_idx" ON "community_news"("community_id", "deleted_at", "created_at");
CREATE INDEX "community_news_community_event_created_lookup_idx" ON "community_news"("community_id", "deleted_at", "event_starts_at", "created_at");
CREATE INDEX "community_news_author_membership_lookup_idx" ON "community_news"("author_membership_id");

ALTER TABLE "community_news"
ADD CONSTRAINT "community_news_community_id_fkey"
FOREIGN KEY ("community_id") REFERENCES "communities"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "community_news"
ADD CONSTRAINT "community_news_author_membership_id_fkey"
FOREIGN KEY ("author_membership_id") REFERENCES "memberships"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
