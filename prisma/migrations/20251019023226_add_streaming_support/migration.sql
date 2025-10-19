-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('PENDING', 'STREAMING', 'COMPLETE');

-- AlterEnum
ALTER TYPE "MessageType" ADD VALUE 'STREAMING';

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "status" "MessageStatus" NOT NULL DEFAULT 'COMPLETE';
