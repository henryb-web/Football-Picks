-- CreateTable
CREATE TABLE "PickemGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "joinCode" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PickemGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickemMembership" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PickemMembership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PickemGroup_joinCode_key" ON "PickemGroup"("joinCode");

-- CreateIndex
CREATE INDEX "PickemGroup_ownerId_idx" ON "PickemGroup"("ownerId");

-- CreateIndex
CREATE INDEX "PickemMembership_groupId_idx" ON "PickemMembership"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "PickemMembership_groupId_userId_key" ON "PickemMembership"("groupId", "userId");

-- AddForeignKey
ALTER TABLE "PickemGroup" ADD CONSTRAINT "PickemGroup_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickemMembership" ADD CONSTRAINT "PickemMembership_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "PickemGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickemMembership" ADD CONSTRAINT "PickemMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
