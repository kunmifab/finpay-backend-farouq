-- AlterTable
ALTER TABLE `transaction` ADD COLUMN `reference` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `TransferBeneficiary` (
    `id` VARCHAR(191) NOT NULL,
    `accountHolder` VARCHAR(191) NOT NULL,
    `accountNumber` VARCHAR(191) NULL,
    `bankName` VARCHAR(191) NULL,
    `currency` VARCHAR(50) NULL,
    `addressId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TransferBeneficiary` ADD CONSTRAINT `TransferBeneficiary_addressId_fkey` FOREIGN KEY (`addressId`) REFERENCES `Address`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransferBeneficiary` ADD CONSTRAINT `TransferBeneficiary_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
