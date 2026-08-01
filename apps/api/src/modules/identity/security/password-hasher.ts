import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

export type PasswordHasher = {
  hash(password: string): Promise<string>;
  verify(password: string, storedHash: string): Promise<boolean>;
};

export class ScryptPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;

    return `scrypt:${salt}:${derived.toString("hex")}`;
  }

  async verify(password: string, storedHash: string): Promise<boolean> {
    const [algorithm, salt, hash] = storedHash.split(":");

    if (algorithm !== "scrypt" || salt === undefined || hash === undefined) {
      return false;
    }

    const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
    const stored = Buffer.from(hash, "hex");

    return stored.length === derived.length && timingSafeEqual(stored, derived);
  }
}
