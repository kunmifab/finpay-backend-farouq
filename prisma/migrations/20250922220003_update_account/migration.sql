-- DropForeignKey
ALTER TABLE `account` DROP FOREIGN KEY `Account_userId_fkey`;

-- DropIndex
DROP INDEX `Account_userId_currency_provider_key` ON `account`;

-- AlterTable
ALTER TABLE `account` MODIFY `provider` VARCHAR(50) NULL;
