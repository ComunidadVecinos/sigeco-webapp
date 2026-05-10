-- AlterTable
ALTER TABLE "polls" ALTER COLUMN "ends_at" DROP NOT NULL;

-- CreateEnum
CREATE TYPE "ForumCategory" AS ENUM ('ANNOUNCEMENT', 'REQUEST', 'QUESTION', 'POLL');

-- CreateTable
CREATE TABLE "forum_posts" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "author_membership_id" UUID,
    "poll_id" UUID,
    "title" VARCHAR(160) NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ForumCategory" NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "edited_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forum_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_comments" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "author_membership_id" UUID,
    "content" TEXT NOT NULL,
    "edited_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forum_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_post_likes" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "membership_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forum_post_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_comment_likes" (
    "id" UUID NOT NULL,
    "comment_id" UUID NOT NULL,
    "membership_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forum_comment_likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "forum_posts_poll_id_key" ON "forum_posts"("poll_id");

-- CreateIndex
CREATE INDEX "forum_posts_community_created_lookup_idx" ON "forum_posts"("community_id", "is_deleted", "pinned", "created_at");

-- CreateIndex
CREATE INDEX "forum_posts_community_activity_lookup_idx" ON "forum_posts"("community_id", "is_deleted", "pinned", "last_activity_at");

-- CreateIndex
CREATE INDEX "forum_posts_community_category_created_lookup_idx" ON "forum_posts"("community_id", "category", "is_deleted", "created_at");

-- CreateIndex
CREATE INDEX "forum_comments_post_created_lookup_idx" ON "forum_comments"("post_id", "created_at");

-- CreateIndex
CREATE INDEX "forum_comments_author_membership_lookup_idx" ON "forum_comments"("author_membership_id");

-- CreateIndex
CREATE UNIQUE INDEX "forum_post_likes_post_id_membership_id_key" ON "forum_post_likes"("post_id", "membership_id");

-- CreateIndex
CREATE INDEX "forum_post_likes_post_id_idx" ON "forum_post_likes"("post_id");

-- CreateIndex
CREATE INDEX "forum_post_likes_membership_id_idx" ON "forum_post_likes"("membership_id");

-- CreateIndex
CREATE UNIQUE INDEX "forum_comment_likes_comment_id_membership_id_key" ON "forum_comment_likes"("comment_id", "membership_id");

-- CreateIndex
CREATE INDEX "forum_comment_likes_comment_id_idx" ON "forum_comment_likes"("comment_id");

-- CreateIndex
CREATE INDEX "forum_comment_likes_membership_id_idx" ON "forum_comment_likes"("membership_id");

-- AddForeignKey
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_author_membership_id_fkey" FOREIGN KEY ("author_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_comments" ADD CONSTRAINT "forum_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "forum_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_comments" ADD CONSTRAINT "forum_comments_author_membership_id_fkey" FOREIGN KEY ("author_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_post_likes" ADD CONSTRAINT "forum_post_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "forum_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_post_likes" ADD CONSTRAINT "forum_post_likes_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_comment_likes" ADD CONSTRAINT "forum_comment_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "forum_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_comment_likes" ADD CONSTRAINT "forum_comment_likes_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
