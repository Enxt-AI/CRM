-- CreateEnum
CREATE TYPE "FolderType" AS ENUM ('SHARED', 'PERSONAL');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('SHARED', 'PERSONAL');

-- CreateTable
CREATE TABLE "Folder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FolderType" NOT NULL DEFAULT 'SHARED',
    "parentId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManagedDocument" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "type" "DocumentType" NOT NULL DEFAULT 'SHARED',
    "folderId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManagedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SharedFolders" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SharedFolders_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SharedDocuments" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SharedDocuments_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Folder_parentId_idx" ON "Folder"("parentId");

-- CreateIndex
CREATE INDEX "Folder_type_idx" ON "Folder"("type");

-- CreateIndex
CREATE INDEX "Folder_createdById_idx" ON "Folder"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "ManagedDocument_s3Key_key" ON "ManagedDocument"("s3Key");

-- CreateIndex
CREATE INDEX "ManagedDocument_folderId_idx" ON "ManagedDocument"("folderId");

-- CreateIndex
CREATE INDEX "ManagedDocument_type_idx" ON "ManagedDocument"("type");

-- CreateIndex
CREATE INDEX "ManagedDocument_uploadedById_idx" ON "ManagedDocument"("uploadedById");

-- CreateIndex
CREATE INDEX "ManagedDocument_s3Key_idx" ON "ManagedDocument"("s3Key");

-- CreateIndex
CREATE INDEX "_SharedFolders_B_index" ON "_SharedFolders"("B");

-- CreateIndex
CREATE INDEX "_SharedDocuments_B_index" ON "_SharedDocuments"("B");

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagedDocument" ADD CONSTRAINT "ManagedDocument_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagedDocument" ADD CONSTRAINT "ManagedDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SharedFolders" ADD CONSTRAINT "_SharedFolders_A_fkey" FOREIGN KEY ("A") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SharedFolders" ADD CONSTRAINT "_SharedFolders_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SharedDocuments" ADD CONSTRAINT "_SharedDocuments_A_fkey" FOREIGN KEY ("A") REFERENCES "ManagedDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SharedDocuments" ADD CONSTRAINT "_SharedDocuments_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
