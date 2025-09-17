/*
  Warnings:

  - A unique constraint covering the columns `[flutterwaveCustomerId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN `flutterwaveCustomerId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_flutterwaveCustomerId_key` ON `User`(`flutterwaveCustomerId`);
