ALTER TABLE "community_news"
ADD COLUMN "image_storage_path" TEXT,
ADD COLUMN "image_mime_type" VARCHAR(100),
ADD COLUMN "image_size_bytes" INTEGER;
