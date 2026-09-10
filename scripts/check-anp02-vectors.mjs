// Copyright (c) 2024 ANP Open Source Community. Apache-2.0.
// Checks offline fixture structure and cryptographic bytes, not SDK behavior.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {sha256, clone, jcs, unbase58, keyFromSeed, proofParts, signatureBase, contentDigest, percentEncodeDid} from './anp02-vector-utils.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directory = path.join(root, 'examples/did-authentication-vnext');
const read = name => JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8'));
const manifest = read('manifest.json');
for (const [name, hash] of Object.entries(manifest.files)) {
  assert.equal(sha256(fs.readFileSync(path.join(directory, name))).toString('hex'), hash, 'Manifest digest: ' + name);
}
const identitySet = read('identities.json');
const {identities} = identitySet;
const byteSet = read('byte-vectors.json');
const scenarios = read('scenario-vectors.json');
const positives = new Map(byteSet.positives.map(vector => [vector.id, vector]));
assert.equal(positives.size, byteSet.positives.length, 'Duplicate positive vector IDs');

// Independent known answers for primitives used by the offline fixture tooling.
assert.equal(sha256('abc').toString('hex'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
assert.equal(jcs({'2': 'two', '10': 'ten', z: [true, null, -0]}), '{"10":"ten","2":"two","z":[true,null,0]}');
assert.equal(jcs({n: [1e30, 0.002, 1e-27]}), '{"n":[1e+30,0.002,1e-27]}');
assert.throws(() => jcs({bad: '\ud800'}));
assert.throws(() => jcs({bad: Number.NaN}));
const known = keyFromSeed(Buffer.from('9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60', 'hex'));
assert.equal(known.raw.toString('hex'), 'd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a');
assert.equal(crypto.sign(null, Buffer.alloc(0), known.privateKey).toString('hex'), 'e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e065224901555fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b');

function keyInDocument(identity, kid) {
  const method = identity.document.verificationMethod.find(entry => entry.id === kid);
  assert(method, 'Missing vector key in Document: ' + kid);
  let jwk;
  if (method.publicKeyJwk) jwk = method.publicKeyJwk;
  else {
    assert(method.publicKeyMultibase.startsWith('z'));
    const bytes = unbase58(method.publicKeyMultibase.slice(1));
    assert.equal(bytes.subarray(0, 2).toString('hex'), 'ed01', 'Signing key multicodec');
    assert.equal(bytes.length, 34);
    jwk = {kty: 'OKP', crv: 'Ed25519', x: bytes.subarray(2).toString('base64url')};
  }
  return {jwk, publicKey: crypto.createPublicKey({key: jwk, format: 'jwk'})};
}

for (const [id, identity] of Object.entries(identities)) {
  assert.equal(identity.document.id, identity.did);
  if (identity.kind === 'api') {
    assert.equal(identity.document.deviceManifest, undefined, id + ' must not depend on a Manifest');
    assert.equal(identity.document.service, undefined, id + ' must not depend on message discovery');
  }
  if (identity.method === 'web') assert.equal(identity.document.proof, undefined, 'Native Web proof-free positive');
  if (identity.method === 'wba' && identity.kind !== 'service') {
    const {jwk, publicKey} = keyInDocument(identity, identity.document.proof.verificationMethod);
    const thumb = sha256(jcs({crv: jwk.crv, kty: jwk.kty, x: jwk.x})).toString('base64url');
    assert(identity.did.endsWith(':e1_' + thumb), 'E1 thumbprint mismatch: ' + id);
    assert(crypto.verify(null, proofParts(identity.document).hashData, publicKey, unbase58(identity.document.proof.proofValue.slice(1))), 'E1 proof bytes: ' + id);
  }
  if (identity.document.deviceManifest) {
    const manifest = identity.document.deviceManifest;
    assert.equal(Array.isArray(manifest), false, id + ' P2 Manifest must be an object');
    assert.deepEqual(Object.keys(manifest).sort(), ['devices', 'type'], id + ' P2 Manifest fields');
    assert.equal(manifest.type, 'ANPDeviceManifest', id + ' P2 Manifest type');
    assert(Array.isArray(manifest.devices), id + ' P2 devices must be an array');
    const ids = identity.document.deviceManifest.devices.map(entry => entry.device_id);
    assert.equal(new Set(ids).size, ids.length);
    for (const device of identity.document.deviceManifest.devices) {
      assert.deepEqual(Object.keys(device).sort(), ['device_id', 'e2ee_key_id', 'profiles', 'signing_key_id'], id + ' P2 device fields');
      assert(identity.document.authentication.includes(device.signing_key_id));
      assert(identity.document.assertionMethod.includes(device.signing_key_id));
      assert(identity.document.keyAgreement.includes(device.e2ee_key_id));
      assert(device.profiles.includes('anp.direct.e2ee.v2'));
      assert(device.profiles.includes('anp.group.base.v2'));
    }
  }
}

function requestBase(vector, overrides = {}) {
  const method = overrides.method ?? vector.method;
  const target = overrides.target ?? vector.target_uri;
  const payload = overrides.payload ?? vector.payload_utf8;
  const values = {'@method': method, '@target-uri': target};
  if (payload !== null) values['content-digest'] = contentDigest(payload);
  return signatureBase(vector.components, values, vector.signature_params);
}

function decrypt(vector, aad = vector.aad_jcs, ciphertext = Buffer.from(vector.ciphertext_b64u, 'base64url')) {
  const cipher = crypto.createDecipheriv('chacha20-poly1305', Buffer.from(vector.message_key_hex, 'hex'), Buffer.from(vector.nonce_hex, 'hex'), {authTagLength: 16});
  cipher.setAuthTag(ciphertext.subarray(-16));
  cipher.setAAD(Buffer.from(aad));
  return Buffer.concat([cipher.update(ciphertext.subarray(0, -16)), cipher.final()]).toString('utf8');
}

for (const vector of byteSet.positives) {
  if (vector.kind === 'request-signature') {
    const identity = identities[vector.identity_fixture];
    const {jwk, publicKey} = keyInDocument(identity, vector.keyid);
    assert.equal(jcs(jwk), jcs(vector.public_key_jwk));
    assert(identity.document.authentication.includes(vector.keyid), vector.id + ' purpose');
    assert.equal(vector.subject_did, identity.did);
    assert.equal(vector.signature_input, 'sig1=' + vector.signature_params);
    assert.equal(vector.signature, 'sig1=:' + vector.signature_b64 + ':');
    assert.equal(requestBase(vector), vector.signature_base_utf8, vector.id + ' base');
    assert.equal(vector.content_digest, vector.payload_utf8 === null ? null : contentDigest(vector.payload_utf8));
    assert(crypto.verify(null, Buffer.from(vector.signature_base_utf8), publicKey, Buffer.from(vector.signature_b64, 'base64')), vector.id + ' signature');
    if (vector.transport === 'http-json-metadata') {
      assert.equal(jcs(vector.envelope.payload), vector.payload_utf8);
      assert.notEqual(contentDigest(jcs(vector.envelope)), vector.content_digest, 'Envelope and payload digest separation');
      assert.equal(vector.envelope.auth.signatureInput, vector.signature_input);
      assert.equal(vector.envelope.auth.signature, vector.signature);
    }
    if (vector.transport === 'p1-origin') {
      assert.deepEqual(Object.keys(vector.signed_request_object).sort(), ['body', 'meta', 'method']);
      assert.equal(jcs(vector.signed_request_object), vector.payload_utf8);
      assert.equal(vector.signed_request_object.method, vector.method);
      const {target, sender_did} = vector.signed_request_object.meta;
      assert.equal(vector.target_uri, 'anp://' + target.kind + '/' + percentEncodeDid(target.did));
      assert.equal(sender_did, identity.did);
    }
  } else if (vector.kind === 'data-integrity') {
    const identity = identities[vector.identity_fixture];
    const {jwk, publicKey} = keyInDocument(identity, vector.keyid);
    assert.equal(jcs(jwk), jcs(vector.public_key_jwk));
    assert(identity.document.assertionMethod.includes(vector.keyid));
    const parts = proofParts(vector.object);
    for (const field of ['proof_config_jcs', 'document_jcs', 'hash_data_hex']) assert.equal(vector[field], parts[field], vector.id + ' ' + field);
    assert(crypto.verify(null, parts.hashData, publicKey, unbase58(vector.object.proof.proofValue.slice(1))), vector.id + ' object signature');
    if (vector.object_type === 'P5-BUNDLE') {
      const device = identity.document.deviceManifest.devices.find(entry => entry.device_id === vector.object.owner_device_id);
      assert(device);
      assert.equal(vector.object.owner_did, identity.did);
      assert.equal(vector.object.proof.verificationMethod, device.signing_key_id);
      assert.equal(vector.object.static_key_agreement_id, device.e2ee_key_id);
      assert.equal(vector.object.one_time_prekey, undefined);
    }
    if (vector.object_type === 'P4-RECEIPT') {
      assert.equal(vector.object.group_did, identity.did);
      assert.equal(vector.object.payload_digest, contentDigest(jcs(vector.related_signed_request_object)));
      assert.equal(vector.object.operation_id, vector.related_signed_request_object.meta.operation_id);
      assert.equal(vector.object.actor_did, vector.related_signed_request_object.meta.sender_did);
      if (identity.method === 'web') assert.equal(identity.document.authentication, undefined, 'Object-only Web issuer must not require request authentication');
    }
    if (vector.object_type === 'P6-BINDING') {
      const device = identity.document.deviceManifest.devices.find(entry => entry.device_id === vector.object.device_id);
      assert(device);
      assert.equal(vector.object.agent_did, identity.did);
      assert.equal(vector.object.verification_method, device.signing_key_id);
      assert.equal(vector.object.proof.verificationMethod, device.signing_key_id);
    }
  } else {
    assert.equal(vector.kind, 'p5-aead');
    assert.equal(jcs(vector.aad), vector.aad_jcs);
    assert.equal(jcs(vector.plaintext), vector.plaintext_jcs);
    assert.equal(vector.aad.sender_did, identities[vector.sender_fixture].did);
    assert.equal(vector.aad.recipient_did, identities[vector.recipient_fixture].did);
    assert.equal(vector.aad.message_id, vector.aad.operation_id);
    assert.equal(vector.wire_body.ciphertext_b64u, vector.ciphertext_b64u);
    assert.equal(vector.origin_proof_present, false);
    assert.equal(vector.wire_body.auth, undefined);
    assert.equal(decrypt(vector), vector.plaintext_jcs, vector.id + ' AEAD');
  }
}

const negativeIds = new Set();
for (const negative of byteSet.negatives) {
  assert(!negativeIds.has(negative.id));
  negativeIds.add(negative.id);
  const vector = positives.get(negative.base_id);
  assert(vector, 'Unknown negative base: ' + negative.base_id);
  assert.equal(negative.expected_integrity, false);
  if (vector.kind === 'request-signature') {
    const publicKey = crypto.createPublicKey({key: vector.public_key_jwk, format: 'jwk'});
    const signature = Buffer.from(vector.signature_b64, 'base64');
    let base = vector.signature_base_utf8;
    if (negative.mutation === 'request-target') base = requestBase(vector, {target: negative.replacement});
    else if (negative.mutation === 'request-content') base = requestBase(vector, {payload: negative.replacement});
    else if (negative.mutation === 'signature-byte') signature[0] ^= 1;
    else throw new Error('Unknown request mutation');
    assert.equal(crypto.verify(null, Buffer.from(base), publicKey, signature), false, negative.id);
  } else if (vector.kind === 'data-integrity') {
    const object = clone(vector.object);
    if (negative.mutation === 'object-property') object[negative.property] = negative.replacement;
    else if (negative.mutation === 'proof-purpose') object.proof.proofPurpose = negative.replacement;
    else throw new Error('Unknown object mutation');
    const publicKey = crypto.createPublicKey({key: vector.public_key_jwk, format: 'jwk'});
    assert.equal(crypto.verify(null, proofParts(object).hashData, publicKey, unbase58(object.proof.proofValue.slice(1))), false, negative.id);
  } else {
    let aad = vector.aad_jcs;
    const ciphertext = Buffer.from(vector.ciphertext_b64u, 'base64url');
    if (negative.mutation === 'aad-device') {
      const value = clone(vector.aad);
      value.recipient_device_id = negative.replacement;
      aad = jcs(value);
    } else if (negative.mutation === 'ciphertext-byte') ciphertext[0] ^= 1;
    else throw new Error('Unknown AEAD mutation');
    assert.throws(() => decrypt(vector, aad, ciphertext), undefined, negative.id);
  }
}

const scenarioIds = new Set();
const categories = new Set();
function inspectReferences(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, item] of Object.entries(value)) {
    if (key.endsWith('_fixture') && typeof item === 'string') assert(identities[item], 'Unknown identity fixture: ' + item);
    if (key.endsWith('_fixtures') && Array.isArray(item)) for (const id of item) assert(identities[id], 'Unknown identity fixture: ' + id);
    if (key === 'byte_vector') assert(positives.has(item), 'Unknown byte vector: ' + item);
    inspectReferences(item);
  }
}
for (const scenario of scenarios.scenarios) {
  assert(!scenarioIds.has(scenario.id), 'Duplicate scenario ID');
  scenarioIds.add(scenario.id);
  categories.add(scenario.category);
  assert.equal(scenario.execution_status, 'design-only-not-run-against-sdk-or-product');
  assert(scenario.actions.length > 0 && scenario.expected.outcome);
  assert(scenario.normative_refs.length > 0);
  inspectReferences(scenario.input);
  for (const ref of scenario.normative_refs) {
    const filename = path.resolve(directory, ref.split('#')[0]);
    assert(filename.startsWith(root + path.sep));
    assert(fs.existsSync(filename), 'Missing scenario normative reference: ' + ref);
  }
}
for (const [from, to] of scenarios.method_pairs) {
  for (const prefix of ['BASE-DIRECT', 'BASE-GROUP', 'P5-INIT-REPLY', 'P5-MULTI-DEVICE', 'P6-ADD-WELCOME-COMMIT', 'P6-MESSAGE-REMOVE', 'P7-ORDINARY-DIRECT', 'P7-ORDINARY-GROUP', 'P7-ENCRYPTED-DIRECT', 'P7-ENCRYPTED-GROUP', 'P9-ORDINARY', 'P9-ENCRYPTED', 'FEDERATION-MIXED-SERVICE', 'P5-NO-EXTRA-ORIGIN']) {
    assert(scenarioIds.has(prefix + '-' + from + '-' + to), 'Missing method/flow cell');
  }
}
for (const required of ['authentication', 'json-carriage', 'token', 'method-evidence', 'mixed-message-flow', 'federation', 'p5', 'overlay-object', 'eligibility', 'control', 'admission', 'capability', 'attachment', 'mention', 'extension', 'wns', 'continuity', 'future-method', 'resolution-security', 'message-authentication', 'object-identity']) assert(categories.has(required));
assert.equal(manifest.counts.identity_fixtures, Object.keys(identities).length);
assert.equal(manifest.counts.positive_byte_vectors, byteSet.positives.length);
assert.equal(manifest.counts.negative_byte_vectors, byteSet.negatives.length);
assert.equal(manifest.counts.design_scenarios, scenarios.scenarios.length);
console.log(JSON.stringify({result: 'PASS', scope: 'offline-fixture-integrity-and-cryptographic-bytes', identities: Object.keys(identities).length, positive_byte_vectors: byteSet.positives.length, negative_byte_vectors: byteSet.negatives.length, design_scenarios_structure_checked: scenarios.scenarios.length, sdk_scenarios_executed: 0, product_scenarios_executed: 0}, null, 2));
