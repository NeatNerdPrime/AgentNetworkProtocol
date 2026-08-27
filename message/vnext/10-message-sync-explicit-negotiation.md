# AWiki Message Sync Explicit Negotiation v1

- Status: Draft / not released
- Profile: `awiki.message-sync.explicit-negotiation.v1`
- Scope: explicit logical-lane negotiation and bounded Ordinary recovery for `anp.sync.local.v2`
- Chinese mirror: [AWiki 消息同步显式协商 v1](../../chinese/message/vnext/10-消息同步显式协商.md)

## 1. Discovery

A client **MUST** discover this Profile with the read-only `anp.get_capabilities` method before it uses the extended bootstrap shape. Discovery **MUST NOT** create or modify a replica, cursor, lane stream, activation, recovery session, backlog, or sync timestamp.

Missing Profile support, method-not-found, an invalid capability response, or a network failure means that extended negotiation is unavailable. A client requesting an empty or partial lane set **MUST NOT** fall back to a legacy bootstrap that implicitly enables lanes.

## 2. Bootstrap negotiation

The legacy bootstrap capability object remains a closed two-field shape, or a three-field shape when `p6_delivery` is present:

```json
{
  "sync_profile": "anp.sync.local.v2",
  "event_schema_max": 1,
  "p6_delivery": "p6.delivery_context.v1"
}
```

The presence of `requested_sync_capabilities` selects the extended shape. It is a closed three-field shape, or a four-field shape when P6 is requested:

```json
{
  "sync_profile": "anp.sync.local.v2",
  "event_schema_max": 1,
  "requested_sync_capabilities": []
}
```

The only recognized values are:

- `lanes.p5_device.v1`
- `lanes.p6_group.v1`
- `p6.delivery_context.v1`

`lanes.p6_group.v1` and `p6.delivery_context.v1` **MUST** occur together. Unknown values, duplicates, an unpaired P6 value, or additional fields fail with `4200 / sync.invalid_request`; the service does not silently select a subset.

The service persists the complete requested and negotiated sets plus `activation_state = active | suspended` for the exact `(account_id, device_id, auth_generation, client_instance_id)` tuple. An extended row, including an empty set, is authoritative and is never unioned with legacy state. Saving a valid extended bootstrap sets the row to `active`.

If the same installation already has an extended row and later sends a legacy bootstrap, the service **MUST** atomically change the expected `active` row to `suspended`, retain both capability sets, and fail with `4220 / sync.client_upgrade_required`. A suspended row rejects all fresh P5/P6 producer writes. Only a subsequent valid extended bootstrap can reactivate it. An installation with no extended row retains the frozen legacy behavior.

The extended response returns `sync_capabilities` as the authoritative negotiated logical-lane set. `lanes` contains only the matching `p5_device` and/or `p6_group` cursor sections. `p6_delivery` is returned only for negotiated P6. For an empty set, the response contains `"sync_capabilities": []` and omits both `lanes` and `p6_delivery`.

`sync.delta` does not repeat the requested set. It reads the exact persisted negotiation, accepts and returns only its lanes, and reuses the existing `p6_delivery` context object only for negotiated P6.

## 3. Producer gate

Before any fresh P5/P6 delivery, notice, retry, or redelivery is durably accepted, the producer checks the same authoritative negotiation repository. It accepts only an `active` row whose negotiated set contains the target lane. A completed idempotent operation is replayed before this check. Rejection creates no delivery, lane, or backlog row. A replica with no extended row retains the frozen legacy behavior required by an older client.

## 4. Lane isolation and durable handoff contract

Ordinary events are decoded and committed independently from requested lane sections. An unknown or unrequested lane is not acknowledged. A malformed requested lane fails only that lane.

Each P5/P6 transport envelope contains:

```text
lane_kind, lane_epoch, position, event_id, event_type,
raw_payload, replica_binding, created_at, expires_at
```

V1-A freezes the following local handoff transaction; the runtime is implemented by the subsequent consumer phase:

```text
BEGIN
  insert the complete raw JSON payload into sync_lane_inbox
  verify the expected logical-lane cursor
  update that cursor
COMMIT
```

Duplicate equality is JSON structural equality for the same lane, epoch, event ID, and position. A different payload for the same event ID or position is a local `lane_input_conflict` and does not advance the cursor. Crypto, MLS, projection, rejoin, and consumer disposition are outside this transaction and never decide the sync cursor.

## 5. Fixed Ordinary Snapshot

Snapshot schema 2 contains exactly these authority domains:

- `read_states`
- `groups`
- `recent_plain_messages`
- `unexpired_system_notifications`

It is a single, non-partial response. Recent plaintext messages cover the fixed 48-hour window and are limited to 500 items; the presence of item 501 fails the whole response. Exact-device notifications are limited to 100 items. The complete encoded response is limited to 16 MiB. Implementations use stable ordering and `limit + 1` to detect overflow.

- notification overflow: `4218 / sync.snapshot_notification_limit_exceeded`
- message-item or complete-response overflow: `4219 / sync.snapshot_response_limit_exceeded`

On either error the service returns no partial Snapshot and the client does not adopt a new cursor. Applying a Snapshot replaces only sync-owned projections inside these four domains. It preserves older history, drafts, outbox, local configuration, and `sync_lane_inbox`.

## 6. Core scheduling profile

A Core run processes at most 20 pages or 20 seconds, whichever occurs first. Budget exhaustion persists `sync_pending=true` and a continuation. The same failure fingerprint is attempted at most three times per run, and server `retry_after` is capped at 30 seconds. Network I/O is never performed while holding the local projection transaction.

The App invokes Core first; patch readiness is not a prerequisite. Its watchdog is 30 seconds. After timeout it detaches the old Future, and the run generation fences any late result from updating the current UI or clearing current pending state.

## Copyright Notice

Copyright (c) 2024 ANP Open Source Community
This file is released under the [Apache License 2.0](../../LICENSE).
