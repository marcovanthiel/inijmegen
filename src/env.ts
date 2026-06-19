export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  PDC: R2Bucket;
  SESSION_SECRET: string;
  ANTHROPIC_API_KEY: string;
  RESEND_API_KEY?: string;
  SITE_NAME: string;
  SITE_HOST: string;
  MAIL_FROM: string;
}

export type AppContext = {
  Bindings: Env;
  Variables: {
    user?: SessionUser;
  };
};

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'editor';
}
