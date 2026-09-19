import { ulid } from "ulid";

export function generateAID(): string {
  return `aid_${ulid()}`;
}

export function generateNamespaceId(): string {
  return `ns_${ulid()}`;
}

export function generateEndpointId(): string {
  return `ep_${ulid()}`;
}

export function generateCardId(): string {
  return `card_${ulid()}`;
}

export function generateKeyId(): string {
  return `key_${ulid()}`;
}
