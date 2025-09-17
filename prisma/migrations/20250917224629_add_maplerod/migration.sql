/*
  Warnings:

  - A unique constraint covering the columns `[mapleradCustomerId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN `mapleradCustomerId` VARCHAR(191) NULL,
    ADD COLUMN `mapleradTier` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_mapleradCustomerId_key` ON `User`(`mapleradCustomerId`);
