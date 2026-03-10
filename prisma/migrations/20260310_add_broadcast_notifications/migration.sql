-- CreateTable
CREATE TABLE "broadcast_notifications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentById" TEXT,

    CONSTRAINT "broadcast_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "broadcast_notifications_sentAt_idx" ON "broadcast_notifications"("sentAt");

-- CreateIndex
CREATE INDEX "broadcast_notifications_sentById_idx" ON "broadcast_notifications"("sentById");

-- AddForeignKey
ALTER TABLE "broadcast_notifications" ADD CONSTRAINT "broadcast_notifications_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
