-- CreateUniqueIndex for XP idempotency
CREATE UNIQUE INDEX "xp_transactions_user_id_reason_reference_key" ON "xp_transactions"("user_id", "reason", "reference");
