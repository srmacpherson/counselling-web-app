/*
  Warnings:

  - You are about to drop the `EmailNotification` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "EmailNotification" DROP CONSTRAINT "EmailNotification_adminUserId_fkey";

-- DropForeignKey
ALTER TABLE "EmailNotification" DROP CONSTRAINT "EmailNotification_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "EmailNotification" DROP CONSTRAINT "EmailNotification_clientId_fkey";

-- DropForeignKey
ALTER TABLE "EmailNotification" DROP CONSTRAINT "EmailNotification_enquiryId_fkey";

-- DropTable
DROP TABLE "EmailNotification";

-- DropEnum
DROP TYPE "NotificationStatus";

-- DropEnum
DROP TYPE "NotificationType";
