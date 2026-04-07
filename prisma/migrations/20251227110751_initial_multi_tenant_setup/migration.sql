-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `organizationId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Item` (
    `itemId` INTEGER NOT NULL AUTO_INCREMENT,
    `itemType` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `desc` VARCHAR(191) NULL,
    `price` DOUBLE NOT NULL,
    `unit` INTEGER NOT NULL,
    `status` ENUM('A', 'I') NOT NULL DEFAULT 'A',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `isDeleted` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `Item_code_key`(`code`),
    PRIMARY KEY (`itemId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GstSlab` (
    `slabId` INTEGER NOT NULL AUTO_INCREMENT,
    `slabName` VARCHAR(191) NOT NULL,
    `startRange` DOUBLE NOT NULL,
    `endRange` DOUBLE NOT NULL,
    `effectiveDate` DATETIME(3) NOT NULL,
    `remarks` VARCHAR(191) NULL,
    `status` ENUM('A', 'I') NOT NULL DEFAULT 'A',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `isDeleted` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`slabId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Dzongkhag` (
    `dzongkhagId` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NULL,
    `status` ENUM('A', 'I') NOT NULL DEFAULT 'A',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`dzongkhagId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Gewog` (
    `gewogId` INTEGER NOT NULL AUTO_INCREMENT,
    `dzongkhagId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NULL,
    `status` ENUM('A', 'I') NOT NULL DEFAULT 'A',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`gewogId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Village` (
    `villageId` INTEGER NOT NULL AUTO_INCREMENT,
    `gewogId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NULL,
    `status` ENUM('A', 'I') NOT NULL DEFAULT 'A',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`villageId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Organization` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orgType` ENUM('business', 'government', 'corporation', 'cso') NOT NULL,
    `status` ENUM('A', 'I') NOT NULL DEFAULT 'A',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `isDeleted` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BusinessDetails` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organizationId` INTEGER NOT NULL,
    `businessName` VARCHAR(191) NULL,
    `businessNameCode` VARCHAR(191) NULL,
    `licenseNo` VARCHAR(191) NULL,
    `companyRegistrationNo` VARCHAR(191) NULL,
    `taxpayerNumber` VARCHAR(191) NULL,
    `taxpayerType` VARCHAR(191) NULL,
    `taxpayerRegistrationRegion` VARCHAR(191) NULL,
    `businessLicenseRegion` VARCHAR(191) NULL,
    `businessLocationJson` JSON NULL,
    `officeLocationJson` JSON NULL,
    `ownershipType` VARCHAR(191) NULL,
    `proprietorJson` JSON NULL,
    `partnersJson` JSON NULL,
    `registeredCompanyJson` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BusinessDetails_organizationId_key`(`organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GovernmentAgencyDetails` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organizationId` INTEGER NOT NULL,
    `agencyName` VARCHAR(191) NULL,
    `agencyCode` VARCHAR(191) NULL,
    `tpn` VARCHAR(191) NULL,
    `taxpayerRegistrationRegion` VARCHAR(191) NULL,
    `registrationType` VARCHAR(191) NULL,
    `contactPerson` VARCHAR(191) NULL,
    `contactEmail` VARCHAR(191) NULL,
    `contactPhone` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `GovernmentAgencyDetails_organizationId_key`(`organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CorporationDetails` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organizationId` INTEGER NOT NULL,
    `corporationName` VARCHAR(191) NULL,
    `organizationCode` VARCHAR(191) NULL,
    `tpn` VARCHAR(191) NULL,
    `taxpayerRegistrationRegion` VARCHAR(191) NULL,
    `registrationType` VARCHAR(191) NULL,
    `contactPerson` VARCHAR(191) NULL,
    `contactEmail` VARCHAR(191) NULL,
    `contactPhone` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CorporationDetails_organizationId_key`(`organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CsoDetails` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organizationId` INTEGER NOT NULL,
    `agencyName` VARCHAR(191) NULL,
    `agencyCode` VARCHAR(191) NULL,
    `registrationNo` VARCHAR(191) NULL,
    `tpn` VARCHAR(191) NULL,
    `taxpayerRegistrationRegion` VARCHAR(191) NULL,
    `registrationType` VARCHAR(191) NULL,
    `contactPerson` VARCHAR(191) NULL,
    `contactEmail` VARCHAR(191) NULL,
    `contactPhone` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CsoDetails_organizationId_key`(`organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServiceCatalog` (
    `service_id` INTEGER NOT NULL AUTO_INCREMENT,
    `service_name` VARCHAR(191) NOT NULL,
    `service_code` VARCHAR(191) NOT NULL,
    `service_description` TEXT NULL,
    `status` ENUM('A', 'I', 'D') NOT NULL DEFAULT 'A',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ServiceCatalog_service_code_key`(`service_code`),
    PRIMARY KEY (`service_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GoodsCatalog` (
    `goodsId` INTEGER NOT NULL AUTO_INCREMENT,
    `goodsName` VARCHAR(191) NOT NULL,
    `goodsCode` VARCHAR(191) NOT NULL,
    `goodsDescription` TEXT NULL,
    `goodsPrice` DOUBLE NOT NULL,
    `unitId` INTEGER NOT NULL,
    `status` ENUM('A', 'I', 'D') NOT NULL DEFAULT 'A',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `GoodsCatalog_goodsCode_key`(`goodsCode`),
    PRIMARY KEY (`goodsId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MapGstRates` (
    `mappingId` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('GOODS', 'SERVICE') NOT NULL,
    `serviceGoodsId` INTEGER NOT NULL,
    `slabId` INTEGER NULL,
    `gstStatus` ENUM('APPLICABLE', 'EXEMPT', 'ZERO_RATED') NOT NULL DEFAULT 'APPLICABLE',
    `rateId` INTEGER NULL,
    `minimumValue` DOUBLE NULL,
    `remarks` TEXT NULL,
    `status` ENUM('A', 'I', 'D') NOT NULL DEFAULT 'A',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`mappingId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GstRate` (
    `rateId` INTEGER NOT NULL AUTO_INCREMENT,
    `slabId` INTEGER NULL,
    `gstRate` DOUBLE NOT NULL,
    `effectiveDate` DATETIME(3) NOT NULL,
    `remarks` VARCHAR(191) NULL,
    `status` ENUM('A', 'I', 'D') NOT NULL DEFAULT 'A',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`rateId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Currency` (
    `currencyId` INTEGER NOT NULL AUTO_INCREMENT,
    `currencyName` VARCHAR(191) NOT NULL,
    `currencySymbol` VARCHAR(191) NOT NULL,
    `status` ENUM('A', 'I', 'D') NOT NULL DEFAULT 'A',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`currencyId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExchangeRateMaster` (
    `exchangeId` INTEGER NOT NULL AUTO_INCREMENT,
    `currencyId` INTEGER NOT NULL,
    `exchangeRate` DOUBLE NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `status` ENUM('A', 'I', 'D') NOT NULL DEFAULT 'A',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`exchangeId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SupplierMaster` (
    `supplierId` INTEGER NOT NULL AUTO_INCREMENT,
    `businessLicenseNo` VARCHAR(191) NULL,
    `supplierName` VARCHAR(191) NOT NULL,
    `taxpayerRegStatus` ENUM('YES', 'NO') NOT NULL DEFAULT 'NO',
    `taxpayerRegNo` VARCHAR(191) NULL,
    `taxpayerRegRegion` VARCHAR(191) NULL,
    `dzongkhagId` INTEGER NULL,
    `gewogId` INTEGER NULL,
    `villageId` INTEGER NULL,
    `location` TEXT NULL,
    `contactName` VARCHAR(191) NULL,
    `contactEmail` VARCHAR(191) NULL,
    `contactPhone` VARCHAR(191) NULL,
    `status` ENUM('A', 'I', 'D') NOT NULL DEFAULT 'A',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`supplierId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DealerMaster` (
    `dealerId` INTEGER NOT NULL AUTO_INCREMENT,
    `businessLicenseNo` VARCHAR(191) NULL,
    `dealerName` VARCHAR(191) NOT NULL,
    `taxpayerRegStatus` ENUM('YES', 'NO') NOT NULL DEFAULT 'NO',
    `taxpayerRegNo` VARCHAR(191) NULL,
    `taxpayerRegRegion` VARCHAR(191) NULL,
    `dzongkhagId` INTEGER NULL,
    `gewogId` INTEGER NULL,
    `villageId` INTEGER NULL,
    `location` TEXT NULL,
    `contactName` VARCHAR(191) NULL,
    `contactEmail` VARCHAR(191) NULL,
    `contactPhone` VARCHAR(191) NULL,
    `status` ENUM('A', 'I', 'D') NOT NULL DEFAULT 'A',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`dealerId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SecondHandGoodsPurchase` (
    `purchaseOrderId` INTEGER NOT NULL AUTO_INCREMENT,
    `supplierId` INTEGER NULL,
    `dealerId` INTEGER NULL,
    `date` DATETIME(3) NOT NULL,
    `purchaseOrderNo` VARCHAR(191) NULL,
    `purchaseOrderDate` DATETIME(3) NULL,
    `currencyId` INTEGER NULL,
    `totalPrice` DOUBLE NOT NULL DEFAULT 0,
    `status` ENUM('A', 'I', 'D') NOT NULL DEFAULT 'A',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`purchaseOrderId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SecondHandGoodsPurchaseItem` (
    `itemId` INTEGER NOT NULL AUTO_INCREMENT,
    `purchaseOrderId` INTEGER NOT NULL,
    `goodsName` VARCHAR(191) NOT NULL,
    `goodsDescription` TEXT NULL,
    `unitId` INTEGER NULL,
    `unitPrice` DOUBLE NOT NULL,
    `quantity` DOUBLE NOT NULL,
    `amount` DOUBLE NOT NULL,
    `status` ENUM('A', 'I', 'D') NOT NULL DEFAULT 'A',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`itemId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SecondHandGoodsInventory` (
    `inventoryId` INTEGER NOT NULL AUTO_INCREMENT,
    `goodsName` VARCHAR(191) NOT NULL,
    `goodsDescription` TEXT NULL,
    `unitId` INTEGER NULL,
    `unitPrice` DOUBLE NOT NULL,
    `quantity` DOUBLE NOT NULL,
    `inventoryValue` DOUBLE NOT NULL,
    `status` ENUM('A', 'I', 'D') NOT NULL DEFAULT 'A',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`inventoryId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SecondHandGoodsSales` (
    `salesOrderId` INTEGER NOT NULL AUTO_INCREMENT,
    `customer` VARCHAR(191) NULL,
    `customerTPN` VARCHAR(191) NULL,
    `date` DATETIME(3) NOT NULL,
    `invoiceNo` VARCHAR(191) NULL,
    `invoiceDate` DATETIME(3) NULL,
    `currencyId` INTEGER NULL,
    `totalPrice` DOUBLE NOT NULL DEFAULT 0,
    `status` ENUM('A', 'I', 'D') NOT NULL DEFAULT 'A',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`salesOrderId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SecondHandGoodsSalesItem` (
    `itemId` INTEGER NOT NULL AUTO_INCREMENT,
    `salesOrderId` INTEGER NOT NULL,
    `goodsName` VARCHAR(191) NOT NULL,
    `goodsDescription` TEXT NULL,
    `unitId` INTEGER NULL,
    `unitPrice` DOUBLE NOT NULL,
    `quantity` DOUBLE NOT NULL,
    `amount` DOUBLE NOT NULL,
    `status` ENUM('A', 'I', 'D') NOT NULL DEFAULT 'A',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`itemId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SecondHandGoodsSalesInvoice` (
    `invoiceId` INTEGER NOT NULL AUTO_INCREMENT,
    `invoiceNo` VARCHAR(191) NOT NULL,
    `invoiceDate` DATETIME(3) NOT NULL,
    `isOriginal` BOOLEAN NOT NULL DEFAULT true,
    `salesOrderId` INTEGER NULL,
    `organizationId` INTEGER NULL,
    `partyId` INTEGER NULL,
    `customerName` VARCHAR(191) NULL,
    `customerTPN` VARCHAR(191) NULL,
    `customerAddress` TEXT NULL,
    `customerEmail` VARCHAR(191) NULL,
    `customerPhone` VARCHAR(191) NULL,
    `currencyId` INTEGER NULL,
    `totalAmount` DOUBLE NOT NULL DEFAULT 0,
    `exemptAmount` DOUBLE NOT NULL DEFAULT 0,
    `taxableAmount` DOUBLE NOT NULL DEFAULT 0,
    `gstRate` DOUBLE NULL,
    `gstAmount` DOUBLE NOT NULL DEFAULT 0,
    `totalInvoiceValue` DOUBLE NOT NULL DEFAULT 0,
    `amountInWords` TEXT NULL,
    `declaration` VARCHAR(191) NULL DEFAULT 'We certify that the particulars are true',
    `authorizedSignature` VARCHAR(191) NULL,
    `placeOfSupply` VARCHAR(191) NULL,
    `status` ENUM('A', 'I', 'D') NOT NULL DEFAULT 'A',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SecondHandGoodsSalesInvoice_invoiceNo_key`(`invoiceNo`),
    PRIMARY KEY (`invoiceId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SecondHandGoodsSalesInvoiceItem` (
    `itemId` INTEGER NOT NULL AUTO_INCREMENT,
    `invoiceId` INTEGER NOT NULL,
    `slNo` INTEGER NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `quantity` DOUBLE NOT NULL,
    `unitId` INTEGER NULL,
    `rate` DOUBLE NOT NULL,
    `discount` DOUBLE NOT NULL DEFAULT 0,
    `saleAmount` DOUBLE NOT NULL,
    `gstStatus` ENUM('APPLICABLE', 'EXEMPT', 'ZERO_RATED') NULL,
    `status` ENUM('A', 'I', 'D') NOT NULL DEFAULT 'A',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`itemId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Party` (
    `partyId` INTEGER NOT NULL AUTO_INCREMENT,
    `partyType` ENUM('BUSINESS', 'GOVERNMENT_AGENCY', 'CORPORATION', 'CSO', 'INDIVIDUAL') NOT NULL,
    `status` ENUM('A', 'I') NOT NULL DEFAULT 'A',
    `isDeleted` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`partyId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BusinessParty` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `partyId` INTEGER NOT NULL,
    `businessName` VARCHAR(191) NULL,
    `licenseNo` VARCHAR(191) NULL,
    `companyRegistrationNo` VARCHAR(191) NULL,
    `businessLicenseRegion` VARCHAR(191) NULL,
    `taxPayerRegStatus` ENUM('YES', 'NO') NOT NULL DEFAULT 'NO',
    `taxPayerRegNo` VARCHAR(191) NULL,
    `taxPayerRegion` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `officeEmail` VARCHAR(191) NULL,
    `officePhone` VARCHAR(191) NULL,
    `representativeName` VARCHAR(191) NULL,
    `representativeEmail` VARCHAR(191) NULL,
    `representativePhone` VARCHAR(191) NULL,

    UNIQUE INDEX `BusinessParty_partyId_key`(`partyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GovernmentAgencyParty` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `partyId` INTEGER NOT NULL,
    `agencyName` VARCHAR(191) NULL,
    `taxPayerRegStatus` ENUM('YES', 'NO') NOT NULL DEFAULT 'NO',
    `taxPayerRegNo` VARCHAR(191) NULL,
    `taxPayerRegion` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `officeEmail` VARCHAR(191) NULL,
    `officePhone` VARCHAR(191) NULL,
    `contactName` VARCHAR(191) NULL,
    `contactEmail` VARCHAR(191) NULL,
    `contactPhone` VARCHAR(191) NULL,

    UNIQUE INDEX `GovernmentAgencyParty_partyId_key`(`partyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CorporationParty` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `partyId` INTEGER NOT NULL,
    `corporationName` VARCHAR(191) NULL,
    `taxPayerRegStatus` ENUM('YES', 'NO') NOT NULL DEFAULT 'NO',
    `taxPayerRegNo` VARCHAR(191) NULL,
    `taxPayerRegion` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `officeEmail` VARCHAR(191) NULL,
    `officePhone` VARCHAR(191) NULL,
    `contactName` VARCHAR(191) NULL,
    `contactEmail` VARCHAR(191) NULL,
    `contactPhone` VARCHAR(191) NULL,

    UNIQUE INDEX `CorporationParty_partyId_key`(`partyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CSOParty` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `partyId` INTEGER NOT NULL,
    `csoRegistrationNo` VARCHAR(191) NULL,
    `csoName` VARCHAR(191) NULL,
    `taxPayerRegStatus` ENUM('YES', 'NO') NOT NULL DEFAULT 'NO',
    `taxPayerRegNo` VARCHAR(191) NULL,
    `taxPayerRegion` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `officeEmail` VARCHAR(191) NULL,
    `officePhone` VARCHAR(191) NULL,
    `contactName` VARCHAR(191) NULL,
    `contactEmail` VARCHAR(191) NULL,
    `contactPhone` VARCHAR(191) NULL,

    UNIQUE INDEX `CSOParty_partyId_key`(`partyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IndividualParty` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `partyId` INTEGER NOT NULL,
    `cid` VARCHAR(191) NULL,
    `name` VARCHAR(191) NULL,
    `taxPayerRegStatus` ENUM('YES', 'NO') NOT NULL DEFAULT 'NO',
    `taxPayerRegion` VARCHAR(191) NULL,
    `taxPayerRegNo` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,

    UNIQUE INDEX `IndividualParty_partyId_key`(`partyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Unit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `status` ENUM('A', 'I') NOT NULL DEFAULT 'A',
    `isDeleted` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_sales` (
    `sales_id` INTEGER NOT NULL AUTO_INCREMENT,
    `organization_id` INTEGER NOT NULL,
    `customer_id` INTEGER NOT NULL,
    `currency` INTEGER NOT NULL,
    `customer_tpn` VARCHAR(200) NULL,
    `customer_name` VARCHAR(500) NULL,
    `sales_date` DATE NOT NULL,
    `sales_amount` DECIMAL(10, 2) NOT NULL,
    `exempt_amount` DECIMAL(10, 2) NOT NULL,
    `taxable_amount` DECIMAL(10, 2) NOT NULL,
    `gst_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `total_invoice_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `sales_invoice_no` VARCHAR(50) NULL,
    `status` ENUM('IP', 'C', 'D', 'CN') NOT NULL DEFAULT 'IP',
    `created_by` INTEGER NOT NULL,
    `created_on` DATE NOT NULL,
    `emailOriginalInvoiceSent` ENUM('Y', 'N') NOT NULL DEFAULT 'Y',

    PRIMARY KEY (`sales_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_sales_items` (
    `sales_item_id` INTEGER NOT NULL AUTO_INCREMENT,
    `sales_id` INTEGER NOT NULL,
    `sales_item_type` ENUM('GOODS', 'SERVICE') NOT NULL,
    `goods_id` INTEGER NULL,
    `service_id` INTEGER NULL,
    `goods_service_name` VARCHAR(500) NULL,
    `goods_service_description` VARCHAR(2500) NULL,
    `unit_of_measurement_id` INTEGER NOT NULL,
    `unit_price` DECIMAL(10, 2) NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `discount` DECIMAL(10, 2) NOT NULL,
    `amount_after_discount` DECIMAL(10, 2) NOT NULL,
    `gst_amount` DECIMAL(10, 2) NOT NULL,
    `gst_percentage` VARCHAR(500) NULL,
    `goods_service_total_amount` DECIMAL(10, 2) NOT NULL,
    `created_by` INTEGER NOT NULL,
    `created_on` DATE NOT NULL,

    PRIMARY KEY (`sales_item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_invocie_original` (
    `gst_invoice_id` INTEGER NOT NULL AUTO_INCREMENT,
    `organization_id` INTEGER NOT NULL,
    `sales_id` INTEGER NOT NULL,
    `customer_id` INTEGER NOT NULL,
    `gst_invoice_date` DATE NOT NULL,
    `total_sales_amount` DECIMAL(10, 2) NOT NULL,
    `total_exempt_amount` DECIMAL(10, 2) NOT NULL,
    `total_taxable_amount` DECIMAL(10, 2) NOT NULL,
    `total_gst_amount` DECIMAL(10, 2) NOT NULL,
    `total_invoice_amount` DECIMAL(10, 2) NOT NULL,
    `gst_invoice_no` VARCHAR(50) NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`gst_invoice_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_invoice_copy` (
    `gst_invoice_copy_id` VARCHAR(191) NOT NULL,
    `gst_invoice_id` INTEGER NOT NULL,
    `organization_id` INTEGER NOT NULL,
    `sales_id` INTEGER NOT NULL,
    `customer_id` INTEGER NOT NULL,
    `gst_invoice_date` DATE NOT NULL,
    `total_sales_amount` DECIMAL(10, 2) NOT NULL,
    `total_exempt_amount` DECIMAL(10, 2) NOT NULL,
    `total_taxable_amount` DECIMAL(10, 2) NOT NULL,
    `total_gst_amount` DECIMAL(10, 2) NOT NULL,
    `total_invoice_amount` DECIMAL(10, 2) NOT NULL,
    `gst_invoice_no` VARCHAR(50) NULL,
    `duplicate_issue_date` DATETIME(3) NULL,
    `created_by` INTEGER NOT NULL,
    `created_on` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`gst_invoice_copy_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_adjustment` (
    `adjustment_id` INTEGER NOT NULL AUTO_INCREMENT,
    `adjustment_note_no` VARCHAR(200) NOT NULL,
    `date` DATE NOT NULL,
    `organization_id` INTEGER NULL,
    `customer_id` INTEGER NULL,
    `sale_id` INTEGER NULL,
    `invoice_no` VARCHAR(200) NOT NULL,
    `sales_amount` DECIMAL(10, 2) NOT NULL,
    `exempt_amount` DECIMAL(10, 2) NOT NULL,
    `taxable_amount` DECIMAL(10, 2) NOT NULL,
    `gst_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `total_invoice_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `total_adjustment_amount` DECIMAL(10, 2) NOT NULL,
    `effect_on_gst_payable` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `status` ENUM('IP', 'C', 'D', 'CN') NOT NULL DEFAULT 'IP',
    `created_by` INTEGER NOT NULL,
    `created_on` DATE NOT NULL,

    PRIMARY KEY (`adjustment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_adjustment_items` (
    `adjustment_item_id` INTEGER NOT NULL AUTO_INCREMENT,
    `adjustment_id` INTEGER NOT NULL,
    `sales_item_type` ENUM('GOODS', 'SERVICE') NOT NULL,
    `goods_id` INTEGER NULL,
    `service_id` INTEGER NULL,
    `goods_service_name` VARCHAR(500) NULL,
    `goods_service_description` VARCHAR(2500) NULL,
    `unit_of_measurement_id` INTEGER NOT NULL,
    `unit_price` DECIMAL(10, 2) NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `discount` DECIMAL(10, 2) NOT NULL,
    `amount_after_discount` DECIMAL(10, 2) NOT NULL,
    `gst_amount` DECIMAL(10, 2) NOT NULL,
    `gst_percentage` VARCHAR(500) NULL,
    `goods_service_total_amount` DECIMAL(10, 2) NOT NULL,
    `reason_for_adjustment` VARCHAR(1000) NULL,
    `adjustment_type` ENUM('DEBIT', 'CREDIT', 'NONE') NOT NULL,
    `adjustment_amount` DECIMAL(10, 2) NOT NULL,
    `created_by` INTEGER NOT NULL,
    `created_on` DATE NOT NULL,

    PRIMARY KEY (`adjustment_item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_copy_tracking_adjustment` (
    `copy_tracking_adjustment_id` INTEGER NOT NULL AUTO_INCREMENT,
    `adjustment_id` INTEGER NOT NULL,
    `issue_date` DATE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`copy_tracking_adjustment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Item` ADD CONSTRAINT `Item_unit_fkey` FOREIGN KEY (`unit`) REFERENCES `Unit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Gewog` ADD CONSTRAINT `Gewog_dzongkhagId_fkey` FOREIGN KEY (`dzongkhagId`) REFERENCES `Dzongkhag`(`dzongkhagId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Village` ADD CONSTRAINT `Village_gewogId_fkey` FOREIGN KEY (`gewogId`) REFERENCES `Gewog`(`gewogId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BusinessDetails` ADD CONSTRAINT `BusinessDetails_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GovernmentAgencyDetails` ADD CONSTRAINT `GovernmentAgencyDetails_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CorporationDetails` ADD CONSTRAINT `CorporationDetails_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CsoDetails` ADD CONSTRAINT `CsoDetails_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GoodsCatalog` ADD CONSTRAINT `GoodsCatalog_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `Unit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MapGstRates` ADD CONSTRAINT `MapGstRates_slabId_fkey` FOREIGN KEY (`slabId`) REFERENCES `GstSlab`(`slabId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MapGstRates` ADD CONSTRAINT `MapGstRates_rateId_fkey` FOREIGN KEY (`rateId`) REFERENCES `GstRate`(`rateId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GstRate` ADD CONSTRAINT `GstRate_slabId_fkey` FOREIGN KEY (`slabId`) REFERENCES `GstSlab`(`slabId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExchangeRateMaster` ADD CONSTRAINT `ExchangeRateMaster_currencyId_fkey` FOREIGN KEY (`currencyId`) REFERENCES `Currency`(`currencyId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupplierMaster` ADD CONSTRAINT `SupplierMaster_dzongkhagId_fkey` FOREIGN KEY (`dzongkhagId`) REFERENCES `Dzongkhag`(`dzongkhagId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupplierMaster` ADD CONSTRAINT `SupplierMaster_gewogId_fkey` FOREIGN KEY (`gewogId`) REFERENCES `Gewog`(`gewogId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupplierMaster` ADD CONSTRAINT `SupplierMaster_villageId_fkey` FOREIGN KEY (`villageId`) REFERENCES `Village`(`villageId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DealerMaster` ADD CONSTRAINT `DealerMaster_dzongkhagId_fkey` FOREIGN KEY (`dzongkhagId`) REFERENCES `Dzongkhag`(`dzongkhagId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DealerMaster` ADD CONSTRAINT `DealerMaster_gewogId_fkey` FOREIGN KEY (`gewogId`) REFERENCES `Gewog`(`gewogId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DealerMaster` ADD CONSTRAINT `DealerMaster_villageId_fkey` FOREIGN KEY (`villageId`) REFERENCES `Village`(`villageId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SecondHandGoodsPurchase` ADD CONSTRAINT `SecondHandGoodsPurchase_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `SupplierMaster`(`supplierId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SecondHandGoodsPurchase` ADD CONSTRAINT `SecondHandGoodsPurchase_dealerId_fkey` FOREIGN KEY (`dealerId`) REFERENCES `DealerMaster`(`dealerId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SecondHandGoodsPurchase` ADD CONSTRAINT `SecondHandGoodsPurchase_currencyId_fkey` FOREIGN KEY (`currencyId`) REFERENCES `Currency`(`currencyId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SecondHandGoodsPurchaseItem` ADD CONSTRAINT `SecondHandGoodsPurchaseItem_purchaseOrderId_fkey` FOREIGN KEY (`purchaseOrderId`) REFERENCES `SecondHandGoodsPurchase`(`purchaseOrderId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SecondHandGoodsPurchaseItem` ADD CONSTRAINT `SecondHandGoodsPurchaseItem_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `Unit`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SecondHandGoodsInventory` ADD CONSTRAINT `SecondHandGoodsInventory_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `Unit`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SecondHandGoodsSales` ADD CONSTRAINT `SecondHandGoodsSales_currencyId_fkey` FOREIGN KEY (`currencyId`) REFERENCES `Currency`(`currencyId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SecondHandGoodsSalesItem` ADD CONSTRAINT `SecondHandGoodsSalesItem_salesOrderId_fkey` FOREIGN KEY (`salesOrderId`) REFERENCES `SecondHandGoodsSales`(`salesOrderId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SecondHandGoodsSalesItem` ADD CONSTRAINT `SecondHandGoodsSalesItem_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `Unit`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SecondHandGoodsSalesInvoice` ADD CONSTRAINT `SecondHandGoodsSalesInvoice_salesOrderId_fkey` FOREIGN KEY (`salesOrderId`) REFERENCES `SecondHandGoodsSales`(`salesOrderId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SecondHandGoodsSalesInvoice` ADD CONSTRAINT `SecondHandGoodsSalesInvoice_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SecondHandGoodsSalesInvoice` ADD CONSTRAINT `SecondHandGoodsSalesInvoice_partyId_fkey` FOREIGN KEY (`partyId`) REFERENCES `Party`(`partyId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SecondHandGoodsSalesInvoice` ADD CONSTRAINT `SecondHandGoodsSalesInvoice_currencyId_fkey` FOREIGN KEY (`currencyId`) REFERENCES `Currency`(`currencyId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SecondHandGoodsSalesInvoiceItem` ADD CONSTRAINT `SecondHandGoodsSalesInvoiceItem_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `SecondHandGoodsSalesInvoice`(`invoiceId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SecondHandGoodsSalesInvoiceItem` ADD CONSTRAINT `SecondHandGoodsSalesInvoiceItem_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `Unit`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BusinessParty` ADD CONSTRAINT `BusinessParty_partyId_fkey` FOREIGN KEY (`partyId`) REFERENCES `Party`(`partyId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GovernmentAgencyParty` ADD CONSTRAINT `GovernmentAgencyParty_partyId_fkey` FOREIGN KEY (`partyId`) REFERENCES `Party`(`partyId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CorporationParty` ADD CONSTRAINT `CorporationParty_partyId_fkey` FOREIGN KEY (`partyId`) REFERENCES `Party`(`partyId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CSOParty` ADD CONSTRAINT `CSOParty_partyId_fkey` FOREIGN KEY (`partyId`) REFERENCES `Party`(`partyId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IndividualParty` ADD CONSTRAINT `IndividualParty_partyId_fkey` FOREIGN KEY (`partyId`) REFERENCES `Party`(`partyId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbl_sales` ADD CONSTRAINT `tbl_sales_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbl_sales` ADD CONSTRAINT `tbl_sales_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `Party`(`partyId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbl_sales` ADD CONSTRAINT `tbl_sales_currency_fkey` FOREIGN KEY (`currency`) REFERENCES `Currency`(`currencyId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbl_sales_items` ADD CONSTRAINT `tbl_sales_items_sales_id_fkey` FOREIGN KEY (`sales_id`) REFERENCES `tbl_sales`(`sales_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbl_sales_items` ADD CONSTRAINT `fk_salesitem_goods` FOREIGN KEY (`goods_id`) REFERENCES `GoodsCatalog`(`goodsId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbl_sales_items` ADD CONSTRAINT `fk_salesitem_service` FOREIGN KEY (`service_id`) REFERENCES `ServiceCatalog`(`service_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbl_sales_items` ADD CONSTRAINT `fk_salesitem_unit` FOREIGN KEY (`unit_of_measurement_id`) REFERENCES `Unit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbl_adjustment` ADD CONSTRAINT `tbl_adjustment_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `Party`(`partyId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbl_adjustment` ADD CONSTRAINT `tbl_adjustment_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `Organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbl_adjustment` ADD CONSTRAINT `tbl_adjustment_sale_id_fkey` FOREIGN KEY (`sale_id`) REFERENCES `tbl_sales`(`sales_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbl_adjustment_items` ADD CONSTRAINT `tbl_adjustment_items_adjustment_id_fkey` FOREIGN KEY (`adjustment_id`) REFERENCES `tbl_adjustment`(`adjustment_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbl_adjustment_items` ADD CONSTRAINT `fk_adjustmentitem_goods` FOREIGN KEY (`goods_id`) REFERENCES `GoodsCatalog`(`goodsId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbl_adjustment_items` ADD CONSTRAINT `fk_adjustmentitem_service` FOREIGN KEY (`service_id`) REFERENCES `ServiceCatalog`(`service_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbl_adjustment_items` ADD CONSTRAINT `fk_adjustmentitem_unit` FOREIGN KEY (`unit_of_measurement_id`) REFERENCES `Unit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
