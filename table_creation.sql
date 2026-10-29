-- Nilgiribytes MySQL schema
-- Run before `npm run db:seed`. Safe to run more than once.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `Category` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Category_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Product` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(200) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `description` TEXT NOT NULL,
    `ingredients` TEXT NULL,
    `shelfLife` VARCHAR(120) NULL,
    `categoryId` INTEGER NOT NULL,
    `sizes` JSON NOT NULL,
    `imageUrl` JSON NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Product_slug_key`(`slug`),
    INDEX `Product_categoryId_idx`(`categoryId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `Product_categoryId_fkey` FOREIGN KEY (`categoryId`)
        REFERENCES `Category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Combo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(200) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `description` TEXT NOT NULL,
    `ingredients` TEXT NULL,
    `shelfLife` VARCHAR(120) NULL,
    `items` JSON NOT NULL,
    `imageUrl` JSON NULL,
    `weightLabel` VARCHAR(60) NULL,
    `pricePaise` INTEGER NOT NULL,
    `discountPercent` INTEGER NOT NULL DEFAULT 0,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Combo_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `BlogPost` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(240) NOT NULL,
    `category` VARCHAR(80) NOT NULL,
    `author` VARCHAR(120) NULL,
    `date` DATETIME(3) NOT NULL,
    `coverImage` VARCHAR(500) NULL,
    `excerpt` TEXT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `content` JSON NOT NULL,
    `readingTimeMin` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `BlogPost_status_date_idx`(`status`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `AdminUser` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(80) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `role` ENUM('ADMIN', 'EDITOR') NOT NULL DEFAULT 'ADMIN',
    `sessionToken` VARCHAR(64) NULL,
    `sessionExpiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AdminUser_username_key`(`username`),
    UNIQUE INDEX `AdminUser_sessionToken_key`(`sessionToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Order` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderNumber` VARCHAR(40) NOT NULL,
    `customerName` VARCHAR(160) NOT NULL,
    `phone` VARCHAR(30) NOT NULL,
    `email` VARCHAR(160) NULL,
    `address` TEXT NULL,
    `notes` TEXT NULL,
    `subtotalPaise` INTEGER NOT NULL,
    `totalPaise` INTEGER NOT NULL,
    `channel` ENUM('WHATSAPP', 'ONLINE') NOT NULL DEFAULT 'WHATSAPP',
    `status` ENUM('NEW', 'CONFIRMED', 'PACKED', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'NEW',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Order_orderNumber_key`(`orderNumber`),
    INDEX `Order_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `OrderItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `productId` INTEGER NULL,
    `comboId` INTEGER NULL,
    `nameSnapshot` VARCHAR(200) NOT NULL,
    `sizeLabel` VARCHAR(60) NULL,
    `unitPricePaise` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `lineTotalPaise` INTEGER NOT NULL,

    PRIMARY KEY (`id`),
    CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`)
        REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `OrderItem_productId_fkey` FOREIGN KEY (`productId`)
        REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `OrderItem_comboId_fkey` FOREIGN KEY (`comboId`)
        REFERENCES `Combo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(80) NOT NULL,
    `value` TEXT NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Settings_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

