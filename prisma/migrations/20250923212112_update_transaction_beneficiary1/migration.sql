/*
  Warnings:

  - A unique constraint covering the columns `[userId,accountHolder,accountNumber,bankName]` on the table `TransferBeneficiary` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `transferbeneficiary` DROP FOREIGN KEY `TransferBeneficiary_userId_fkey`;

-- DropIndex
DROP INDEX `TransferBeneficiary_userId_currency_accountHolder_accountNum_key` ON `transferbeneficiary`;

-- CreateIndex
CREATE UNIQUE INDEX `TransferBeneficiary_userId_accountHolder_accountNumber_bankN_key` ON `TransferBeneficiary`(`userId`, `accountHolder`, `accountNumber`, `bankName`);

-- AddForeignKey
ALTER TABLE `TransferBeneficiary` ADD CONSTRAINT `TransferBeneficiary_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
