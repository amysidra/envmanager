-- DropIndex
DROP INDEX "EnvFile_projectId_key";

-- AlterTable
ALTER TABLE "EnvFile" ADD COLUMN     "name" TEXT NOT NULL DEFAULT '.env';
