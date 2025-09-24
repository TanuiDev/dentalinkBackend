-- DropForeignKey
ALTER TABLE "public"."appointments" DROP CONSTRAINT "appointments_dentistId_fkey";

-- AlterTable
ALTER TABLE "public"."appointments" ALTER COLUMN "dentistId" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT';

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_dentistId_fkey" FOREIGN KEY ("dentistId") REFERENCES "public"."dentists"("id") ON DELETE SET NULL ON UPDATE CASCADE;
