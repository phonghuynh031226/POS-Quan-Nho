BEGIN;

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS fulfillment_status VARCHAR(30);

UPDATE orders
SET fulfillment_status = CASE
    WHEN status = 'CANCELLED' THEN 'CANCELLED'
    ELSE 'COMPLETED'
END
WHERE fulfillment_status IS NULL;

ALTER TABLE orders
    ALTER COLUMN fulfillment_status SET DEFAULT 'NEW',
    ALTER COLUMN fulfillment_status SET NOT NULL;

ALTER TABLE orders
    DROP CONSTRAINT IF EXISTS chk_orders_fulfillment_status;

ALTER TABLE orders
    ADD CONSTRAINT chk_orders_fulfillment_status
    CHECK (fulfillment_status IN ('NEW', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED'));

COMMIT;
