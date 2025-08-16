-- CreateTable
CREATE TABLE "public"."patients" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emergencyContact" TEXT,
    "insuranceProvider" TEXT,
    "insuranceNumber" TEXT,
    "medicalHistory" TEXT,
    "allergies" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dentists" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dentistId" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "education" TEXT NOT NULL,
    "experience" INTEGER NOT NULL,
    "bio" TEXT,
    "availability" TEXT,
    "hourlyRate" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dentists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admins" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adminLevel" TEXT NOT NULL DEFAULT 'STAFF',
    "permissions" TEXT[],
    "department" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."appointments" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "dentistId" TEXT NOT NULL,
    "appointmentDate" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patients_userId_key" ON "public"."patients"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "dentists_userId_key" ON "public"."dentists"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "dentists_dentistId_key" ON "public"."dentists"("dentistId");

-- CreateIndex
CREATE UNIQUE INDEX "admins_userId_key" ON "public"."admins"("userId");

-- AddForeignKey
ALTER TABLE "public"."patients" ADD CONSTRAINT "patients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dentists" ADD CONSTRAINT "dentists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admins" ADD CONSTRAINT "admins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_dentistId_fkey" FOREIGN KEY ("dentistId") REFERENCES "public"."dentists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
