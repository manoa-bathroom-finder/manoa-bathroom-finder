-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'FLAGGED', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Bathroom" (
    "id" SERIAL NOT NULL,
    "building" TEXT NOT NULL,
    "floor" TEXT NOT NULL,
    "roomNumber" TEXT,
    "type" TEXT NOT NULL DEFAULT 'Multi-Stall (Men & Women)',
    "stallCount" INTEGER NOT NULL DEFAULT 1,
    "lastRenovated" INTEGER,
    "isAccessible" BOOLEAN NOT NULL DEFAULT false,
    "amenities" TEXT[],
    "notes" TEXT,

    CONSTRAINT "Bathroom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "cleanliness" INTEGER NOT NULL,
    "odor" INTEGER NOT NULL,
    "conditionTags" TEXT[],
    "comment" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "bathroomId" INTEGER NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_bathroomId_fkey" FOREIGN KEY ("bathroomId") REFERENCES "Bathroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
