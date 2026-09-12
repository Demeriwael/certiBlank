-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Platform" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Platform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "examCode" TEXT,
    "blueprintUrl" TEXT,
    "examConfig" JSONB,
    "domains" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "type" TEXT NOT NULL DEFAULT 'single',
    "selectionCount" INTEGER NOT NULL DEFAULT 1,
    "optionItems" JSONB,
    "correctOptionIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "correctExplanation" TEXT,
    "distractorExplanations" JSONB,
    "domain" TEXT,
    "referenceUrl" TEXT,
    "questionText" TEXT NOT NULL,
    "options" TEXT[],
    "correctAnswer" TEXT NOT NULL,
    "hint" TEXT,
    "explanation" TEXT,
    "certificationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamAttempt" (
    "id" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "certSlug" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "answers" JSONB NOT NULL,
    "checked" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "flagged" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "currentIndex" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Platform_name_key" ON "Platform"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Platform_slug_key" ON "Platform"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Certification_slug_key" ON "Certification"("slug");

-- CreateIndex
CREATE INDEX "ExamAttempt_owner_certSlug_idx" ON "ExamAttempt"("owner", "certSlug");

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_certificationId_fkey" FOREIGN KEY ("certificationId") REFERENCES "Certification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
