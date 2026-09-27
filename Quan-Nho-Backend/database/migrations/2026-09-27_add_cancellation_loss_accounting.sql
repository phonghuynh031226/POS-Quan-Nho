BEGIN;

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS cancelled_from_status VARCHAR(30),
    ADD COLUMN IF NOT EXISTS cancellation_loss_type VARCHAR(30),
    ADD COLUMN IF NOT EXISTS loss_amount BIGINT;

UPDATE orders
SET loss_amount = 0
WHERE loss_amount IS NULL;

ALTER TABLE orders
    ALTER COLUMN loss_amount SET DEFAULT 0,
    ALTER COLUMN loss_amount SET NOT NULL;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_orders_cancelled_from_status;
ALTER TABLE orders ADD CONSTRAINT chk_orders_cancelled_from_status
    CHECK (cancelled_from_status IS NULL OR cancelled_from_status IN ('NEW', 'PREPARING', 'READY_FOR_PICKUP'));

ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_orders_cancellation_loss_type;
ALTER TABLE orders ADD CONSTRAINT chk_orders_cancellation_loss_type
    CHECK (cancellation_loss_type IS NULL OR cancellation_loss_type IN ('NO_MATERIAL_LOSS', 'FULL_ORDER_LOSS'));

ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_orders_loss_amount;
ALTER TABLE orders ADD CONSTRAINT chk_orders_loss_amount CHECK (loss_amount >= 0);

COMMIT;
