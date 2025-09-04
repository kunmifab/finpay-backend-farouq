/*
  Warnings:

  - You are about to drop the column `first_name` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `first_name`,
    DROP COLUMN `last_name`,
    DROP COLUMN `phone`,
    ADD COLUMN `accountType` VARCHAR(191) NULL DEFAULT 'Freelancer',
    ADD COLUMN `address` VARCHAR(191) NULL,
    ADD COLUMN `country` VARCHAR(191) NULL,
    ADD COLUMN `countryCode` VARCHAR(191) NULL,
    ADD COLUMN `name` VARCHAR(191) NULL,
    ADD COLUMN `phoneNumber` VARCHAR(30) NULL,
    ADD COLUMN `state` VARCHAR(191) NULL;
