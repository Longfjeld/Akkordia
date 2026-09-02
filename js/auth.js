import { APP_CONFIG } from "./config.js";

let client;

function requireMsal() {
  if (!window.msal?.PublicClientApplication) {
    throw new Error("MSAL-biblioteket er ikke lastet. Kontroller vendor/msal-browser.min.js.");
  }
}

export async function initializeAuth() {
  requireMsal();

  client = new window.msal.PublicClientApplication({
    auth: {
      clientId: APP_CONFIG.clientId,
      authority: APP_CONFIG.authority,
      redirectUri: APP_CONFIG.redirectUri,
      postLogoutRedirectUri: APP_CONFIG.redirectUri
    },
    cache: {
      cacheLocation: "localStorage"
    }
  });

  if (typeof client.initialize === "function") await client.initialize();

  const redirectResult = await client.handleRedirectPromise();
  if (redirectResult?.account) client.setActiveAccount(redirectResult.account);

  if (!client.getActiveAccount()) {
    const accounts = client.getAllAccounts();
    if (accounts.length === 1) client.setActiveAccount(accounts[0]);
  }

  return getAccount();
}

export function getAccount() {
  return client?.getActiveAccount() ?? null;
}

export async function signIn() {
  await client.loginRedirect({
    scopes: APP_CONFIG.scopes,
    prompt: "select_account"
  });
}

export async function signOut() {
  const account = getAccount();
  if (!account) return;
  await client.logoutRedirect({ account });
}

export async function getAccessToken() {
  const account = getAccount();
  if (!account) throw new Error("Du må logge inn med Microsoft først.");

  try {
    const result = await client.acquireTokenSilent({
      account,
      scopes: APP_CONFIG.scopes
    });
    return result.accessToken;
  } catch (error) {
    if (error instanceof window.msal.InteractionRequiredAuthError) {
      await client.acquireTokenRedirect({
        account,
        scopes: APP_CONFIG.scopes
      });
      return null;
    }
    throw error;
  }
}
