-- CreateTable
CREATE TABLE `Card` (
    `id` VARCHAR(191) NOT NULL,
    `holder_name` VARCHAR(191) NOT NULL,
    `cardNumber` VARCHAR(191) NULL,
    `maskedPan` VARCHAR(191) NULL,
    `expiry` VARCHAR(191) NULL,
    `cvv` VARCHAR(191) NULL,
    `status` VARCHAR(191) NULL,
    `type` VARCHAR(191) NULL,
    `brand` VARCHAR(191) NULL,
    `firstSix` VARCHAR(191) NULL,
    `lastFour` VARCHAR(191) NULL,
    `expiry_month` VARCHAR(191) NULL,
    `expiry_year` VARCHAR(191) NULL,
    `currency` VARCHAR(191) NULL,
    `balance` FLOAT NULL,
    `balanceUpdatedAt` DATETIME(3) NULL,
    `autoApprove` BOOLEAN NULL,
    `addressId` VARCHAR(191) NULL,
    `reference` VARCHAR(191) NULL,
    `card_reference` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Address` (
    `id` VARCHAR(191) NOT NULL,
    `street` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL,
    `postalCode` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Card` ADD CONSTRAINT `Card_addressId_fkey` FOREIGN KEY (`addressId`) REFERENCES `Address`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Card` ADD CONSTRAINT `Card_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
