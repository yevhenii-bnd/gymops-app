export type JwtClaims = Record<string, string | number | boolean | string[] | null>;

export type JwtSigner = {
  sign(claims: JwtClaims): Promise<string>;
};

export type JwtVerifier = {
  verify(token: string): Promise<JwtClaims>;
};
