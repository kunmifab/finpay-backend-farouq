/*
  Warnings:

  - The primary key for the `balance` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `eur` on the `balance` table. All the data in the column will be lost.
  - You are about to drop the column `gbp` on the `balance` table. All the data in the column will be lost.
  - You are about to drop the column `ngn` on the `balance` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `balance` table. All the data in the column will be lost.
  - You are about to drop the column `usd` on the `balance` table. All the data in the column will be lost.
  - The primary key for the `exchangerate` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `currency` on the `exchangerate` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,currency]` on the table `Balance` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Balance` table without a default value. This is not possible if the table is not empty.
  - Made the column `currency` on table `balance` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `base` to the `ExchangeRate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `effectiveAt` to the `ExchangeRate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `balance` DROP PRIMARY KEY,
    DROP COLUMN `eur`,
    DROP COLUMN `gbp`,
    DROP COLUMN `ngn`,
    DROP COLUMN `total`,
    DROP COLUMN `usd`,
    ADD COLUMN `amount` FLOAT NOT NULL DEFAULT 0.00,
    ADD COLUMN `userId` VARCHAR(191) NOT NULL,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `currency` VARCHAR(10) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `exchangerate` DROP PRIMARY KEY,
    DROP COLUMN `currency`,
    ADD COLUMN `base` CHAR(3) NOT NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `effectiveAt` DATETIME(3) NOT NULL,
    ADD COLUMN `provider` VARCHAR(50) NULL,
    MODIFY `id` CHAR(36) NOT NULL,
    MODIFY `gbp` DECIMAL(20, 10) NULL,
    MODIFY `eur` DECIMAL(20, 10) NULL,
    MODIFY `ngn` DECIMAL(20, 10) NULL,
    MODIFY `cad` DECIMAL(20, 10) NULL,
    ADD PRIMARY KEY (`id`);

-- CreateIndex
CREATE UNIQUE INDEX `Balance_userId_currency_key` ON `Balance`(`userId`, `currency`);

-- AddForeignKey
ALTER TABLE `Balance` ADD CONSTRAINT `Balance_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
