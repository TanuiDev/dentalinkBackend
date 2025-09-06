-- Step 1: Fix existing NULLs
UPDATE "public"."patients"
SET "emergencyContact"   = COALESCE("emergencyContact", 'None'),
    "insuranceProvider"  = COALESCE("insuranceProvider", 'N/A'),
    "insuranceNumber"    = COALESCE("insuranceNumber", 'None'),
    "medicalHistory"     = COALESCE("medicalHistory", 'None'),
    "allergies"          = COALESCE("allergies", 'None');

-- Step 2: Enforce NOT NULL + defaults
ALTER TABLE "public"."patients"
  ALTER COLUMN "emergencyContact" SET NOT NULL,
  ALTER COLUMN "emergencyContact" SET DEFAULT 'None',
  ALTER COLUMN "insuranceProvider" SET NOT NULL,
  ALTER COLUMN "insuranceProvider" SET DEFAULT 'N/A',
  ALTER COLUMN "insuranceNumber" SET NOT NULL,
  ALTER COLUMN "insuranceNumber" SET DEFAULT 'None',
  ALTER COLUMN "medicalHistory" SET NOT NULL,
  ALTER COLUMN "medicalHistory" SET DEFAULT 'None',
  ALTER COLUMN "allergies" SET NOT NULL,
  ALTER COLUMN "allergies" SET DEFAULT 'None';
