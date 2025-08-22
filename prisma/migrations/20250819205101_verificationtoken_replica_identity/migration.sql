-- Allow deletes under logical replication for NextAuth email flow
ALTER TABLE "VerificationToken" REPLICA IDENTITY FULL;
