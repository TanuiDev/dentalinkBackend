-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('PATIENT', 'ADMIN', 'DENTIST');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "emailAddress" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'PATIENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_emailAddress_key" ON "public"."users"("emailAddress");

-- CreateIndex
CREATE UNIQUE INDEX "users_phoneNumber_key" ON "public"."users"("phoneNumber");
