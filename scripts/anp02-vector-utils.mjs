// Copyright (c) 2024 ANP Open Source Community. Apache-2.0.
// Offline fixture utilities; not a resolver, authenticator, or messaging SDK.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

export const sha256 = value => crypto.createHash('sha256').update(value).digest();
export const b64u = value => Buffer.from(value).toString('base64url');
export const clone = value => JSON.parse(JSON.stringify(value));

function validUnicode(value) {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(++i);
      assert(next >= 0xdc00 && next <= 0xdfff, 'Unpaired high surrogate');
    } else {
      assert(code < 0xdc00 || code > 0xdfff, 'Unpaired low surrogate');
    }
  }
}

// RFC 8785 uses ECMAScript number serialization and UTF-16 property ordering.
// Inputs here are parsed JSON; duplicate-member rejection belongs to the parser.
export function jcs(value) {
  if (value === null || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') {
    assert(Number.isFinite(value), 'Non-finite JSON number');
    return JSON.stringify(value);
  }
  if (typeof value === 'string') {
    validUnicode(value);
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return '[' + value.map(jcs).join(',') + ']';
  assert(value && typeof value === 'object', 'Not JSON data');
  return '{' + Object.keys(value).sort().map(key => {
    validUnicode(key);
    return JSON.stringify(key) + ':' + jcs(value[key]);
  }).join(',') + '}';
}

const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
export function base58(bytes) {
  const input = Buffer.from(bytes);
  let value = input.length ? BigInt('0x' + input.toString('hex')) : 0n;
  let output = '';
  while (value) {
    output = alphabet[Number(value % 58n)] + output;
    value /= 58n;
  }
  for (const byte of input) {
    if (byte !== 0) break;
    output = '1' + output;
  }
  return output;
}

export function unbase58(value) {
  let number = 0n;
  for (const char of value) {
    const digit = alphabet.indexOf(char);
    assert(digit >= 0, 'Invalid base58');
    number = number * 58n + BigInt(digit);
  }
  let hex = number ? number.toString(16) : '';
  if (hex.length % 2) hex = '0' + hex;
  const prefix = value.match(/^1*/)[0].length;
  return Buffer.concat([Buffer.alloc(prefix), Buffer.from(hex, 'hex')]);
}

export function keyFromSeed(seed, curve = 'Ed25519') {
  const prefix = curve === 'Ed25519' ? '302e020100300506032b657004220420' : '302e020100300506032b656e04220420';
  const privateKey = crypto.createPrivateKey({key: Buffer.concat([Buffer.from(prefix, 'hex'), seed]), format: 'der', type: 'pkcs8'});
  const publicKey = crypto.createPublicKey(privateKey);
  const jwk = publicKey.export({format: 'jwk'});
  const raw = Buffer.from(jwk.x, 'base64url');
  const codec = curve === 'Ed25519' ? [0xed, 0x01] : [0xec, 0x01];
  return {privateKey, publicKey, jwk, raw, multibase: 'z' + base58(Buffer.concat([Buffer.from(codec), raw]))};
}

// All seeds are publicly reproducible test values and MUST NOT be used in production.
export const fixtureKey = (label, curve = 'Ed25519') => keyFromSeed(sha256('ANP02-PUBLIC-TEST-ONLY:' + label), curve);

export function proofParts(document) {
  const unsecured = clone(document);
  const proof = unsecured.proof;
  assert(proof, 'Missing proof');
  delete unsecured.proof;
  const options = clone(proof);
  delete options.proofValue;
  if (unsecured['@context'] !== undefined) options['@context'] = unsecured['@context'];
  const proof_config_jcs = jcs(options);
  const document_jcs = jcs(unsecured);
  const hashData = Buffer.concat([sha256(proof_config_jcs), sha256(document_jcs)]);
  return {proof_config_jcs, document_jcs, hash_data_hex: hashData.toString('hex'), hashData};
}

export function withProof(document, kid, key, created = '2026-09-07T08:00:00Z') {
  const result = clone(document);
  result.proof = {type: 'DataIntegrityProof', cryptosuite: 'eddsa-jcs-2022', created, verificationMethod: kid, proofPurpose: 'assertionMethod'};
  const {hashData} = proofParts(result);
  result.proof.proofValue = 'z' + base58(crypto.sign(null, hashData, key.privateKey));
  return result;
}

export function contentDigest(bytes) {
  return 'sha-256=:' + sha256(bytes).toString('base64') + ':';
}

export function signatureBase(components, values, params) {
  return components.map(name => JSON.stringify(name) + ': ' + values[name]).join('\n') + '\n"@signature-params": ' + params;
}

export function signatureFields(kid, key, method, target, bytes, nonce = 'fixture-nonce') {
  const components = ['@method', '@target-uri'];
  const values = {'@method': method, '@target-uri': target};
  if (bytes !== null) {
    components.push('content-digest');
    values['content-digest'] = contentDigest(bytes);
  }
  const params = '(' + components.map(name => JSON.stringify(name)).join(' ') + ');created=1788768000;expires=1788768060' + (nonce === null ? '' : ';nonce=' + JSON.stringify(nonce)) + ';keyid=' + JSON.stringify(kid);
  const base = signatureBase(components, values, params);
  const signature = crypto.sign(null, Buffer.from(base), key.privateKey);
  return {components, signature_params: params, signature_base_utf8: base, content_digest: values['content-digest'] ?? null, signature_input: 'sig1=' + params, signature: 'sig1=:' + signature.toString('base64') + ':', signature_b64: signature.toString('base64')};
}

export function percentEncodeDid(did) {
  return [...Buffer.from(did)].map(byte => /[A-Za-z0-9._~-]/.test(String.fromCharCode(byte)) ? String.fromCharCode(byte) : '%' + byte.toString(16).toUpperCase().padStart(2, '0')).join('');
}
