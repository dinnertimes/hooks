export type CookieInit = {
  domain?: string | null;
  expires?: DOMHighResTimeStamp | null;
  name: string;
  partitioned?: boolean;
  path?: string;
  sameSite?: CookieSameSite;
  value: string;
};

export type CookieStoreDeleteOptions = {
  domain?: string | null;
  name: string;
  partitioned?: boolean;
  path?: string;
};
