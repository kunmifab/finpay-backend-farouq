/*
  Warnings:

  - A unique constraint covering the columns `[userId,currency,accountHolder,accountNumber]` on the table `TransferBeneficiary` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `TransferBeneficiary_userId_currency_accountHolder_accountNum_key` ON `TransferBeneficiary`(`userId`, `currency`, `accountHolder`, `accountNumber`);
