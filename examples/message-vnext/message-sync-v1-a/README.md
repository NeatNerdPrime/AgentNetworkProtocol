# Message Sync V1-A portable fixtures

These JSON files freeze the Profile's closed negotiation shapes and the generic lane handoff scenarios. They are contract fixtures, not a claim that the V1-B `sync_lane_inbox` consumer runtime already exists.

- `negotiation-fixtures.json`: legacy and extended zero/partial/all negotiation, extended-to-legacy suspension, plus closed-shape failures.
- `lane-handoff-fixtures.json`: production serialized P5/P6 adapter envelopes plus duplicate, conflict, capacity, rollback, lost-response, zero/partial rebootstrap, legacy-blocker migration, consumer, DID cutover, installation, and DTO-boundary scenarios. V1-B extends this same contract instead of creating a second fixture family.

`payload_limit_bytes` is 1 MiB for a single raw lane input. Large boundary cases use `generated_raw_payload_bytes` so each implementation can generate deterministic bytes without committing multi-megabyte fixture files.

The authoritative protocol text is [Message Sync Explicit Negotiation v1](../../../message/vnext/10-message-sync-explicit-negotiation.md).
