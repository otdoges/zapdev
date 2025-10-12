-- Ensure Framework enum exists
DO $$
BEGIN
    CREATE TYPE "Framework" AS ENUM ('NEXTJS', 'ANGULAR', 'REACT', 'VUE', 'SVELTE');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Ensure Project.framework column exists
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "framework" "Framework" NOT NULL DEFAULT 'NEXTJS';

-- Ensure Fragment.framework column exists
ALTER TABLE "Fragment" ADD COLUMN IF NOT EXISTS "framework" "Framework" NOT NULL DEFAULT 'NEXTJS';

-- CreateTable
CREATE TABLE "FragmentDraft" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sandboxId" TEXT,
    "sandboxUrl" TEXT,
    "files" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "framework" "Framework" NOT NULL DEFAULT 'NEXTJS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FragmentDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FragmentDraft_projectId_key" ON "FragmentDraft"("projectId");

-- AddForeignKey
ALTER TABLE "FragmentDraft" ADD CONSTRAINT "FragmentDraft_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
