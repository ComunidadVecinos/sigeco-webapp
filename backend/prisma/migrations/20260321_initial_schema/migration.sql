-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('MEMBER', 'VICE_PRESIDENT', 'PRESIDENT');

-- CreateEnum
CREATE TYPE "CommunityRequestType" AS ENUM ('JOIN', 'UPDATE_INFO');

-- CreateEnum
CREATE TYPE "CommunityRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "phone" VARCHAR(20),
    "password_hash" TEXT NOT NULL,
    "password_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_active_membership_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "active_membership_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "invalidated_at" TIMESTAMP(3),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communities" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "cif" VARCHAR(20) NOT NULL,
    "country" VARCHAR(100) NOT NULL,
    "province" VARCHAR(120) NOT NULL,
    "municipality" VARCHAR(120) NOT NULL,
    "street_type" VARCHAR(50) NOT NULL,
    "street_name" VARCHAR(255) NOT NULL,
    "postal_code" VARCHAR(10) NOT NULL,
    "street_number_km" VARCHAR(30) NOT NULL,
    "access_code" VARCHAR(20) NOT NULL,
    "storage_quota_bytes" BIGINT NOT NULL DEFAULT 5368709120,
    "storage_used_bytes" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "communities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_avatars" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "storage_path" TEXT NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_avatars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_avatars" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "storage_path" TEXT NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_avatars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_folders" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "parent_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "community_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_documents" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "folder_id" UUID,
    "uploaded_by_membership_id" UUID,
    "original_name" VARCHAR(255) NOT NULL,
    "storage_path" TEXT NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "extension" VARCHAR(20),
    "size_bytes" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "community_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'MEMBER',
    "alias" VARCHAR(120) NOT NULL,
    "is_suspended" BOOLEAN NOT NULL DEFAULT false,
    "suspended_at" TIMESTAMP(3),
    "suspended_until" TIMESTAMP(3),
    "suspension_reason" TEXT,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "end_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" UUID NOT NULL,
    "membership_id" UUID NOT NULL,
    "label" VARCHAR(120) NOT NULL,
    "country" VARCHAR(100) NOT NULL,
    "province" VARCHAR(120) NOT NULL,
    "municipality" VARCHAR(120) NOT NULL,
    "street_type" VARCHAR(50) NOT NULL,
    "street_name" VARCHAR(255) NOT NULL,
    "postal_code" VARCHAR(20) NOT NULL,
    "street_number_km" VARCHAR(30) NOT NULL,
    "block" VARCHAR(30),
    "floor" VARCHAR(30),
    "door" VARCHAR(30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_requests" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "CommunityRequestType" NOT NULL,
    "status" "CommunityRequestStatus" NOT NULL DEFAULT 'PENDING',
    "request_comment" TEXT,
    "resolution_message" TEXT,
    "resolved_by_membership_id" UUID,
    "resolved_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_request_details" (
    "id" UUID NOT NULL,
    "community_request_id" UUID NOT NULL,
    "proposed_alias" VARCHAR(120),
    "label" VARCHAR(120) NOT NULL,
    "country" VARCHAR(100) NOT NULL,
    "province" VARCHAR(120) NOT NULL,
    "municipality" VARCHAR(120) NOT NULL,
    "street_type" VARCHAR(50) NOT NULL,
    "street_name" VARCHAR(255) NOT NULL,
    "postal_code" VARCHAR(20) NOT NULL,
    "street_number_km" VARCHAR(30) NOT NULL,
    "block" VARCHAR(30),
    "floor" VARCHAR(30),
    "door" VARCHAR(30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_request_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_help_sections" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "description" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "community_help_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_last_active_membership_id_idx" ON "users"("last_active_membership_id");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_active_membership_id_idx" ON "sessions"("active_membership_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "sessions_invalidated_at_idx" ON "sessions"("invalidated_at");

-- CreateIndex
CREATE UNIQUE INDEX "communities_cif_key" ON "communities"("cif");

-- CreateIndex
CREATE UNIQUE INDEX "communities_access_code_key" ON "communities"("access_code");

-- CreateIndex
CREATE INDEX "communities_cif_idx" ON "communities"("cif");

-- CreateIndex
CREATE INDEX "communities_access_code_idx" ON "communities"("access_code");

-- CreateIndex
CREATE INDEX "communities_deleted_at_idx" ON "communities"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_avatars_user_id_key" ON "user_avatars"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_avatars_storage_path_key" ON "user_avatars"("storage_path");

-- CreateIndex
CREATE UNIQUE INDEX "community_avatars_community_id_key" ON "community_avatars"("community_id");

-- CreateIndex
CREATE UNIQUE INDEX "community_avatars_storage_path_key" ON "community_avatars"("storage_path");

-- CreateIndex
CREATE INDEX "community_folders_community_id_idx" ON "community_folders"("community_id");

-- CreateIndex
CREATE INDEX "community_folders_parent_id_idx" ON "community_folders"("parent_id");

-- CreateIndex
CREATE INDEX "community_folders_deleted_at_idx" ON "community_folders"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "community_folders_community_id_parent_id_name_key" ON "community_folders"("community_id", "parent_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "community_documents_storage_path_key" ON "community_documents"("storage_path");

-- CreateIndex
CREATE INDEX "community_documents_community_id_idx" ON "community_documents"("community_id");

-- CreateIndex
CREATE INDEX "community_documents_folder_id_idx" ON "community_documents"("folder_id");

-- CreateIndex
CREATE INDEX "community_documents_uploaded_by_membership_id_idx" ON "community_documents"("uploaded_by_membership_id");

-- CreateIndex
CREATE INDEX "community_documents_deleted_at_idx" ON "community_documents"("deleted_at");

-- CreateIndex
CREATE INDEX "memberships_user_id_idx" ON "memberships"("user_id");

-- CreateIndex
CREATE INDEX "memberships_community_id_idx" ON "memberships"("community_id");

-- CreateIndex
CREATE INDEX "memberships_community_id_role_idx" ON "memberships"("community_id", "role");

-- CreateIndex
CREATE INDEX "memberships_ended_at_idx" ON "memberships"("ended_at");

-- CreateIndex
CREATE INDEX "memberships_deleted_at_idx" ON "memberships"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_user_id_community_id_key" ON "memberships"("user_id", "community_id");

-- CreateIndex
CREATE UNIQUE INDEX "properties_membership_id_key" ON "properties"("membership_id");

-- CreateIndex
CREATE INDEX "properties_deleted_at_idx" ON "properties"("deleted_at");

-- CreateIndex
CREATE INDEX "community_requests_community_id_idx" ON "community_requests"("community_id");

-- CreateIndex
CREATE INDEX "community_requests_user_id_idx" ON "community_requests"("user_id");

-- CreateIndex
CREATE INDEX "community_requests_type_idx" ON "community_requests"("type");

-- CreateIndex
CREATE INDEX "community_requests_status_idx" ON "community_requests"("status");

-- CreateIndex
CREATE INDEX "community_requests_resolved_by_membership_id_idx" ON "community_requests"("resolved_by_membership_id");

-- CreateIndex
CREATE INDEX "community_requests_archived_at_idx" ON "community_requests"("archived_at");

-- CreateIndex
CREATE UNIQUE INDEX "community_request_details_community_request_id_key" ON "community_request_details"("community_request_id");

-- CreateIndex
CREATE INDEX "community_help_sections_community_id_idx" ON "community_help_sections"("community_id");

-- CreateIndex
CREATE INDEX "community_help_sections_community_id_sort_order_idx" ON "community_help_sections"("community_id", "sort_order");

-- CreateIndex
CREATE INDEX "community_help_sections_sort_order_idx" ON "community_help_sections"("sort_order");

-- CreateIndex
CREATE INDEX "community_help_sections_deleted_at_idx" ON "community_help_sections"("deleted_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_last_active_membership_id_fkey" FOREIGN KEY ("last_active_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_active_membership_id_fkey" FOREIGN KEY ("active_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_avatars" ADD CONSTRAINT "user_avatars_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_avatars" ADD CONSTRAINT "community_avatars_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_folders" ADD CONSTRAINT "community_folders_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_folders" ADD CONSTRAINT "community_folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "community_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_documents" ADD CONSTRAINT "community_documents_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_documents" ADD CONSTRAINT "community_documents_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "community_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_documents" ADD CONSTRAINT "community_documents_uploaded_by_membership_id_fkey" FOREIGN KEY ("uploaded_by_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_requests" ADD CONSTRAINT "community_requests_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_requests" ADD CONSTRAINT "community_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_requests" ADD CONSTRAINT "community_requests_resolved_by_membership_id_fkey" FOREIGN KEY ("resolved_by_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_request_details" ADD CONSTRAINT "community_request_details_community_request_id_fkey" FOREIGN KEY ("community_request_id") REFERENCES "community_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_help_sections" ADD CONSTRAINT "community_help_sections_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
