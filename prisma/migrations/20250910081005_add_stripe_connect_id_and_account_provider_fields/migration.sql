/*
  Warnings:

  - A unique constraint covering the columns `[stripeConnectId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `account` ADD COLUMN `meta` JSON NULL,
    ADD COLUMN `provider` VARCHAR(50) NULL,
    ADD COLUMN `providerRef` VARCHAR(191) NULL,
    ADD COLUMN `status` VARCHAR(50) NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `stripeConnectId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_stripeConnectId_key` ON `User`(`stripeConnectId`);
