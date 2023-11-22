import { AuthClient, CredentialProvider, ExpiresIn, TopicRole, GenerateDisposableToken, CacheRole } from '@gomomento/sdk';
import type { NextApiRequest, NextApiResponse } from 'next';

let authClient: AuthClient;
interface TokenResponse {
  token: string;
  exp: number;
}

interface ErrorResponse {
  message: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<TokenResponse | ErrorResponse>) {
  try {
    await initializeMomento();
    let tokenScope;
    const referenceNumber = req.query.referenceNumber as string;
    if (referenceNumber) {
      tokenScope = {
        permissions: [
          {
            role: TopicRole.SubscribeOnly,
            cache: process.env.NEXT_PUBLIC_CACHE_NAME!,
            topic: referenceNumber
          }
        ]
      };
    } else {
      tokenScope = {
        permissions: [
          {
            role: CacheRole.ReadOnly,
            cache: process.env.NEXT_PUBLIC_CACHE_NAME!
          }
        ]
      };
    }

    const token = await authClient.generateDisposableToken(tokenScope, ExpiresIn.hours(1));
    if (token instanceof GenerateDisposableToken.Success) {
      const vendedToken: TokenResponse = {
        token: token.authToken,
        exp: token.expiresAt.epoch()
      };

      res.status(200).json(vendedToken);
    } else {
      throw new Error('Unable to create auth token');
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

const initializeMomento = async () => {
  if (authClient) {
    return;
  }

  authClient = new AuthClient({
    credentialProvider: CredentialProvider.fromEnvironmentVariable({ environmentVariableName: 'MOMENTO_AUTH' }),
  });
};
