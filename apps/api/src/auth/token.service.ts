import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// jose is ESM-only. With module=NodeNext this dynamic import() survives the
// CommonJS build untranspiled, which is the supported way to load ESM from CJS.
type Jose = typeof import('jose');

export type TokenClaims = { sub: string; email: string | null };

const AUDIENCE = 'authenticated';

/**
 * Verifies access tokens, and signs the demo sign-in's.
 *
 * - ES256/RS256: tokens from Supabase Auth, checked against the project's
 *   public keys at `${SUPABASE_URL}/auth/v1/.well-known/jwks.json`.
 * - HS256: tokens this API signed itself with AUTH_JWT_SECRET, for the demo
 *   sign-in. With the secret unset they are refused outright.
 */
@Injectable()
export class TokenService {
  private josePromise?: Promise<Jose>;
  private jwks?: ReturnType<Jose['createRemoteJWKSet']>;

  constructor(private readonly config: ConfigService) {}

  private jose(): Promise<Jose> {
    this.josePromise ??= import('jose');
    return this.josePromise;
  }

  private secret(): Uint8Array | null {
    const secret = this.config.get<string>('AUTH_JWT_SECRET');
    return secret ? new TextEncoder().encode(secret) : null;
  }

  /** Throws when the token is malformed, expired, or not signed by a key we trust. */
  async verify(token: string): Promise<TokenClaims> {
    const jose = await this.jose();
    const { alg } = jose.decodeProtectedHeader(token);

    let payload: Awaited<ReturnType<Jose['jwtVerify']>>['payload'];
    if (alg === 'HS256') {
      const secret = this.secret();
      if (!secret) throw new Error('HS256 tokens are not accepted: AUTH_JWT_SECRET is not set');
      ({ payload } = await jose.jwtVerify(token, secret, { algorithms: ['HS256'], audience: AUDIENCE }));
    } else {
      const issuer = `${this.config.getOrThrow<string>('SUPABASE_URL')}/auth/v1`;
      this.jwks ??= jose.createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
      ({ payload } = await jose.jwtVerify(token, this.jwks, { issuer, audience: AUDIENCE }));
    }

    // A valid signature is not enough: a token with no subject would become
    // `{ id: undefined }` in a query, and Prisma drops undefined filters.
    if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
      throw new Error('Token has no subject');
    }
    return { sub: payload.sub, email: typeof payload.email === 'string' ? payload.email : null };
  }

  async sign(user: { id: string; email: string }): Promise<string> {
    const secret = this.secret();
    if (!secret) throw new Error('AUTH_JWT_SECRET is not set');
    const jose = await this.jose();
    return new jose.SignJWT({ email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(user.id)
      .setAudience(AUDIENCE)
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret);
  }
}
