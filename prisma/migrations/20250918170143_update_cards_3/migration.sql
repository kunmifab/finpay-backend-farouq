/*
  Warnings:

  - A unique constraint covering the columns `[reference]` on the table `Card` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Card_reference_key` ON `Card`(`reference`);
