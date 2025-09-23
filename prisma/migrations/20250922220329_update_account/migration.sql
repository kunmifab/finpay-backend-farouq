/*
  Warnings:

  - A unique constraint covering the columns `[userId,currency,provider]` on the table `Account` will be added. If there are existing duplicate values, this will fail.
  - Made the column `provider` on table `account` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `account` MODIFY `provider` VARCHAR(50) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Account_userId_currency_provider_key` ON `Account`(`userId`, `currency`, `provider`);
