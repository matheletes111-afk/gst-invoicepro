/*
  Warnings:

  - Made the column `organization_id` on table `tbl_adjustment` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `tbl_adjustment` DROP FOREIGN KEY `tbl_adjustment_organization_id_fkey`;

-- AlterTable
ALTER TABLE `tbl_adjustment` MODIFY `organization_id` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `tbl_adjustment` ADD CONSTRAINT `tbl_adjustment_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
