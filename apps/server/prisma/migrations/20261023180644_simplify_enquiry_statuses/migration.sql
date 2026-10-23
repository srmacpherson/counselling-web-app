/*
  Warnings:

  - The values [CONTACTED] on the enum `EnquiryStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- Migrate any existing rows off the removed enum variant before altering the type.
UPDATE "Enquiry"
SET "status" = 'AWAITING_RESPONSE'
WHERE "status"::text = 'CONTACTED';

-- AlterEnum
BEGIN;
CREATE TYPE "EnquiryStatus_new" AS ENUM ('NEW', 'AWAITING_RESPONSE', 'CONVERTED_TO_CLIENT', 'CLOSED', 'SPAM');
ALTER TABLE "Enquiry" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Enquiry" ALTER COLUMN "status" TYPE "EnquiryStatus_new" USING ("status"::text::"EnquiryStatus_new");
ALTER TYPE "EnquiryStatus" RENAME TO "EnquiryStatus_old";
ALTER TYPE "EnquiryStatus_new" RENAME TO "EnquiryStatus";
DROP TYPE "EnquiryStatus_old";
ALTER TABLE "Enquiry" ALTER COLUMN "status" SET DEFAULT 'NEW';
COMMIT;
