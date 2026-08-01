import { ScryptPasswordHasher } from "./password-hasher.js";

describe("ScryptPasswordHasher", () => {
  it("hashes and verifies without storing plaintext", async () => {
    const hasher = new ScryptPasswordHasher();
    const hash = await hasher.hash("correct horse battery staple");

    expect(hash).toMatch(/^scrypt:/);
    expect(hash).not.toContain("correct horse battery staple");
    await expect(hasher.verify("correct horse battery staple", hash)).resolves.toBe(true);
    await expect(hasher.verify("wrong password", hash)).resolves.toBe(false);
  });
});
