/*
  Warnings:

  - Added the required column `appointmentType` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `conditionDescription` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `conditionDuration` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientAge` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `severity` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeSlot` to the `appointments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."appointments" ADD COLUMN     "appointmentType" TEXT NOT NULL,
ADD COLUMN     "conditionDescription" TEXT NOT NULL,
ADD COLUMN     "conditionDuration" TEXT NOT NULL,
ADD COLUMN     "meetingPassword" TEXT,
ADD COLUMN     "patientAge" INTEGER NOT NULL,
ADD COLUMN     "severity" TEXT NOT NULL,
ADD COLUMN     "timeSlot" TEXT NOT NULL,
ADD COLUMN     "videoChatLink" TEXT;
