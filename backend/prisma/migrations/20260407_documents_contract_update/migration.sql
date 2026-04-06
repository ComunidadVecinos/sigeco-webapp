ALTER TABLE "community_documents" RENAME COLUMN "original_name" TO "name";

ALTER TABLE "community_documents"
    ADD COLUMN "description" TEXT,
    ADD COLUMN "original_filename" VARCHAR(255);

UPDATE "community_documents"
SET "original_filename" = "name"
WHERE "original_filename" IS NULL;

ALTER TABLE "community_documents"
    ALTER COLUMN "original_filename" SET NOT NULL;

DROP INDEX IF EXISTS "community_folders_community_id_parent_id_name_key";

CREATE INDEX "community_folders_scope_lookup_idx" ON "community_folders"("community_id", "parent_id", "deleted_at");
CREATE INDEX "community_documents_scope_created_lookup_idx" ON "community_documents"("community_id", "folder_id", "deleted_at", "created_at");
