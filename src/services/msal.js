// Real Azure AD OIDC integration (MSAL Node, auth-code flow). Instantiation
// is lazy so a missing AD_CLIENT_ID doesn't crash the whole server while
// AUTH_MODE=mock is in use (proposal Wk3 wires this up for real).
const { ConfidentialClientApplication } = require('@azure/msal-node');

let msalApp;
function getMsalApp() {
  if (!msalApp) {
    msalApp = new ConfidentialClientApplication({
      auth: {
        clientId: process.env.AD_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${process.env.AD_TENANT_ID}`,
        clientSecret: process.env.AD_CLIENT_SECRET,
      },
    });
  }
  return msalApp;
}

// Maps AD security-group membership to an internal role (proposal §5/§6).
function mapGroupsToRole(groupIds) {
  const adminGroup = process.env.AD_ADMIN_GROUP_ID;
  const staffGroup = process.env.AD_STAFF_GROUP_ID;
  if (adminGroup && groupIds.includes(adminGroup)) return 'ADMIN';
  if (staffGroup && groupIds.includes(staffGroup)) return 'STAFF';
  return 'STUDENT';
}

module.exports = { getMsalApp, mapGroupsToRole };
