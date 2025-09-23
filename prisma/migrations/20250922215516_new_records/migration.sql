-- CreateTable
CREATE TABLE `User` (
    `id` CHAR(36) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `phoneNumber` VARCHAR(30) NULL,
    `accountType` VARCHAR(191) NULL DEFAULT 'Freelancer',
    `countryCode` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `verify_email_code` INTEGER NULL,
    `verify_email` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `stripeConnectId` VARCHAR(191) NULL,
    `flutterwaveCustomerId` VARCHAR(191) NULL,
    `mapleradCustomerId` VARCHAR(191) NULL,
    `mapleradTier` VARCHAR(191) NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_stripeConnectId_key`(`stripeConnectId`),
    UNIQUE INDEX `User_flutterwaveCustomerId_key`(`flutterwaveCustomerId`),
    UNIQUE INDEX `User_mapleradCustomerId_key`(`mapleradCustomerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Balance` (
    `id` VARCHAR(191) NOT NULL,
    `amount` FLOAT NOT NULL DEFAULT 0.00,
    `currency` VARCHAR(10) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Balance_userId_currency_key`(`userId`, `currency`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExchangeRate` (
    `id` CHAR(36) NOT NULL,
    `base` CHAR(3) NOT NULL,
    `gbp` DECIMAL(20, 10) NULL,
    `eur` DECIMAL(20, 10) NULL,
    `ngn` DECIMAL(20, 10) NULL,
    `cad` DECIMAL(20, 10) NULL,
    `effectiveAt` DATETIME(3) NOT NULL,
    `provider` VARCHAR(50) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ExchangeRate_base_key`(`base`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Account` (
    `id` VARCHAR(191) NOT NULL,
    `accountHolder` VARCHAR(191) NULL,
    `bankName` VARCHAR(191) NULL,
    `accountNumber` VARCHAR(191) NULL,
    `routingNumber` VARCHAR(191) NULL,
    `accountType` VARCHAR(20) NULL,
    `address` VARCHAR(191) NULL,
    `currency` VARCHAR(10) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(50) NOT NULL,
    `providerRef` VARCHAR(191) NULL,
    `status` VARCHAR(50) NULL,
    `meta` JSON NULL,

    UNIQUE INDEX `Account_userId_currency_provider_key`(`userId`, `currency`, `provider`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Invoice` (
    `id` VARCHAR(191) NOT NULL,
    `currency` VARCHAR(10) NOT NULL,
    `sharableUrl` VARCHAR(191) NULL,
    `issueDate` DATETIME(3) NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InvoiceItem` (
    `id` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `amount` FLOAT NOT NULL,
    `invoiceId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InvoiceCustomer` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `invoiceId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Card_reference_key`(`reference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Address` (
    `id` VARCHAR(191) NOT NULL,
    `street` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `postalCode` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Balance` ADD CONSTRAINT `Balance_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Account` ADD CONSTRAINT `Account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvoiceItem` ADD CONSTRAINT `InvoiceItem_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvoiceCustomer` ADD CONSTRAINT `InvoiceCustomer_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Card` ADD CONSTRAINT `Card_addressId_fkey` FOREIGN KEY (`addressId`) REFERENCES `Address`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Card` ADD CONSTRAINT `Card_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
