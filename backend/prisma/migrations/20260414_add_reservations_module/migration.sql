-- CreateEnum
CREATE TYPE "ReservationSpaceOccupancyMode" AS ENUM ('EXCLUSIVE', 'SHARED');

-- CreateEnum
CREATE TYPE "ReservationBookingStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- CreateTable
CREATE TABLE "reservation_spaces" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "color_hex" VARCHAR(7) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "total_capacity" INTEGER NOT NULL,
    "occupancy_mode" "ReservationSpaceOccupancyMode" NOT NULL,
    "max_seats_per_booking" INTEGER,
    "monday_enabled" BOOLEAN NOT NULL DEFAULT true,
    "tuesday_enabled" BOOLEAN NOT NULL DEFAULT true,
    "wednesday_enabled" BOOLEAN NOT NULL DEFAULT true,
    "thursday_enabled" BOOLEAN NOT NULL DEFAULT true,
    "friday_enabled" BOOLEAN NOT NULL DEFAULT true,
    "saturday_enabled" BOOLEAN NOT NULL DEFAULT true,
    "sunday_enabled" BOOLEAN NOT NULL DEFAULT true,
    "opening_time" VARCHAR(5) NOT NULL,
    "closing_time" VARCHAR(5) NOT NULL,
    "slot_minutes" INTEGER NOT NULL,
    "max_consecutive_slots" INTEGER NOT NULL DEFAULT 1,
    "min_advance_minutes" INTEGER NOT NULL DEFAULT 60,
    "max_advance_days" INTEGER NOT NULL DEFAULT 30,
    "cancellation_notice_minutes" INTEGER NOT NULL DEFAULT 120,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "reservation_spaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_bookings" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "space_id" UUID NOT NULL,
    "owner_membership_id" UUID NOT NULL,
    "status" "ReservationBookingStatus" NOT NULL DEFAULT 'ACTIVE',
    "booking_date" DATE NOT NULL,
    "start_slot_index" INTEGER NOT NULL,
    "slot_count" INTEGER NOT NULL,
    "start_time" VARCHAR(5) NOT NULL,
    "end_time" VARCHAR(5) NOT NULL,
    "requested_seats" INTEGER NOT NULL DEFAULT 1,
    "cancelled_at" TIMESTAMPTZ(3),
    "cancelled_by_membership_id" UUID,
    "cancellation_reason" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "reservation_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reservation_spaces_community_status_created_lookup_idx"
ON "reservation_spaces"("community_id", "deleted_at", "is_active", "created_at");

-- CreateIndex
CREATE INDEX "reservation_spaces_community_name_lookup_idx"
ON "reservation_spaces"("community_id", "deleted_at", "name");

-- CreateIndex
CREATE INDEX "reservation_bookings_owner_status_date_lookup_idx"
ON "reservation_bookings"("community_id", "owner_membership_id", "status", "booking_date");

-- CreateIndex
CREATE INDEX "reservation_bookings_space_status_date_lookup_idx"
ON "reservation_bookings"("community_id", "space_id", "status", "booking_date");

-- CreateIndex
CREATE INDEX "reservation_bookings_cancelled_by_lookup_idx"
ON "reservation_bookings"("cancelled_by_membership_id");

-- AddForeignKey
ALTER TABLE "reservation_spaces"
ADD CONSTRAINT "reservation_spaces_community_id_fkey"
FOREIGN KEY ("community_id") REFERENCES "communities"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_bookings"
ADD CONSTRAINT "reservation_bookings_community_id_fkey"
FOREIGN KEY ("community_id") REFERENCES "communities"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_bookings"
ADD CONSTRAINT "reservation_bookings_space_id_fkey"
FOREIGN KEY ("space_id") REFERENCES "reservation_spaces"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_bookings"
ADD CONSTRAINT "reservation_bookings_owner_membership_id_fkey"
FOREIGN KEY ("owner_membership_id") REFERENCES "memberships"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_bookings"
ADD CONSTRAINT "reservation_bookings_cancelled_by_membership_id_fkey"
FOREIGN KEY ("cancelled_by_membership_id") REFERENCES "memberships"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
