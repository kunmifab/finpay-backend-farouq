/*
  Warnings:

  - You are about to alter the column `currency` on the `transaction` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(12)`.
  - You are about to alter the column `status` on the `transaction` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(81)`.

*/
-- AlterTable
ALTER TABLE `transaction` ADD COLUMN `type` VARCHAR(81) NULL,
    MODIFY `currency` VARCHAR(12) NULL,
    MODIFY `status` VARCHAR(81) NOT NULL;
