-- AlterTable
ALTER TABLE `transaction` ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `meta` JSON NULL,
    MODIFY `amount` FLOAT NOT NULL DEFAULT 0.00;
