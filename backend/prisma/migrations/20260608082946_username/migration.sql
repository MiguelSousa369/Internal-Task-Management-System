/*
  Warnings:

  - The values [Baixa,Alta] on the enum `Prioridade` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `titulo` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Prioridade_new" AS ENUM ('Normal', 'Urgente');
ALTER TABLE "public"."Task" ALTER COLUMN "prioridade" DROP DEFAULT;
ALTER TABLE "Task" ALTER COLUMN "prioridade" TYPE "Prioridade_new" USING ("prioridade"::text::"Prioridade_new");
ALTER TYPE "Prioridade" RENAME TO "Prioridade_old";
ALTER TYPE "Prioridade_new" RENAME TO "Prioridade";
DROP TYPE "public"."Prioridade_old";
ALTER TABLE "Task" ALTER COLUMN "prioridade" SET DEFAULT 'Normal';
COMMIT;

-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "titulo";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "email",
ADD COLUMN     "username" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
