/*
  Warnings:

  - A unique constraint covering the columns `[base]` on the table `ExchangeRate` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `ExchangeRate_base_key` ON `ExchangeRate`(`base`);
