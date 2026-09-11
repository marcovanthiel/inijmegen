// Cloudflare Email Sending-binding (send_email in wrangler.toml). Structureel
// getypeerd zodat het compileert zonder de gegenereerde workerd-types; de
// send()-signatuur volgt de Email Sending-dienst (env.EMAIL.send({...})).
export interface EmailSendBinding {
  send(message: {
    to: string | string[];
    from: string | { email: string; name?: string };
    replyTo?: string;
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    html?: string;
    text?: string;
  }): Promise<{ messageId: string }>;
}

export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  PDC: R2Bucket;
  SESSION_SECRET: string;
  EMAIL?: EmailSendBinding;
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
