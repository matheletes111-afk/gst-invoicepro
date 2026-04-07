/*
  Warnings:

  - Added the required column `organizationId` to the `DealerMaster` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `GoodsCatalog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Party` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `ServiceCatalog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `SupplierMaster` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add organizationId columns as nullable first
ALTER TABLE `DealerMaster` ADD COLUMN `organizationId` INTEGER NULL;
ALTER TABLE `GoodsCatalog` ADD COLUMN `organizationId` INTEGER NULL;
ALTER TABLE `Party` ADD COLUMN `organizationId` INTEGER NULL;
ALTER TABLE `ServiceCatalog` ADD COLUMN `organizationId` INTEGER NULL;
ALTER TABLE `SupplierMaster` ADD COLUMN `organizationId` INTEGER NULL;

-- Step 2: Assign existing records to organization ID 1 (default organization)
-- Change this to the actual default organization ID if different
UPDATE `GoodsCatalog` SET `organizationId` = 1 WHERE `organizationId` IS NULL;
UPDATE `Party` SET `organizationId` = 1 WHERE `organizationId` IS NULL;
UPDATE `ServiceCatalog` SET `organizationId` = 1 WHERE `organizationId` IS NULL;
UPDATE `SupplierMaster` SET `organizationId` = 1 WHERE `organizationId` IS NULL;
UPDATE `DealerMaster` SET `organizationId` = 1 WHERE `organizationId` IS NULL;

-- Step 3: Make organizationId columns NOT NULL
ALTER TABLE `GoodsCatalog` MODIFY COLUMN `organizationId` INTEGER NOT NULL;
ALTER TABLE `Party` MODIFY COLUMN `organizationId` INTEGER NOT NULL;
ALTER TABLE `ServiceCatalog` MODIFY COLUMN `organizationId` INTEGER NOT NULL;
ALTER TABLE `SupplierMaster` MODIFY COLUMN `organizationId` INTEGER NOT NULL;
ALTER TABLE `DealerMaster` MODIFY COLUMN `organizationId` INTEGER NOT NULL;

-- Step 4: Add foreign key constraints
ALTER TABLE `ServiceCatalog` ADD CONSTRAINT `ServiceCatalog_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `GoodsCatalog` ADD CONSTRAINT `GoodsCatalog_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `SupplierMaster` ADD CONSTRAINT `SupplierMaster_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `DealerMaster` ADD CONSTRAINT `DealerMaster_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Party` ADD CONSTRAINT `Party_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
