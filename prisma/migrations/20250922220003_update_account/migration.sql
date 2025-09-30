-- DropForeignKey
ALTER TABLE `Account` DROP FOREIGN KEY `Account_userId_fkey`;

-- DropIndex
DROP INDEX `Account_userId_currency_provider_key` ON `Account`;

-- AlterTable
ALTER TABLE `Account` MODIFY `provider` VARCHAR(50) NULL;
