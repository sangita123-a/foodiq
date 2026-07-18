const ALLOWED = new Set(['google', 'microsoft', 'apple']);

const ssoEnabled = () =>
  String(process.env.SSO_ENABLED || '').toLowerCase() === 'true';

const clientIdFor = (provider) => {
  const key = `SSO_${String(provider).toUpperCase()}_CLIENT_ID`;
  return process.env[key] || null;
};

const startSso = (provider) => {
  const p = String(provider || '').toLowerCase();
  if (!ALLOWED.has(p)) {
    return { ok: false, status: 400, message: 'Unsupported provider' };
  }
  if (!ssoEnabled()) {
    return {
      ok: false,
      status: 501,
      message: 'SSO disabled. Set SSO_ENABLED=true and provider client IDs.',
      code: 'SSO_DISABLED',
    };
  }
  const clientId = clientIdFor(p);
  if (!clientId) {
    return {
      ok: false,
      status: 501,
      message: `Missing SSO_${p.toUpperCase()}_CLIENT_ID`,
      code: 'SSO_NOT_CONFIGURED',
    };
  }
  const redirectUri = process.env.SSO_REDIRECT_URI || 'http://localhost:4000/api/v4/sso/callback';
  return {
    ok: true,
    data: {
      provider: p,
      authorize_url: `https://example.com/oauth/${p}/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=foodiq`,
      note: 'Foundation stub — wire real IdP authorize URLs in 4.2',
    },
  };
};

const handleCallback = async (provider, _body = {}) => {
  const started = startSso(provider);
  if (!started.ok) return started;
  return {
    ok: true,
    data: {
      provider: String(provider).toLowerCase(),
      linked: false,
      token: null,
      note: 'Foundation stub — no live IdP token exchange yet',
    },
  };
};

module.exports = { ssoEnabled, startSso, handleCallback, ALLOWED };
