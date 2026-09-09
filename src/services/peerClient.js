// Calls the partner's enrollment-verification endpoint to confirm a
// student's department before a discount is applied (proposal §9.2).
// Fail-closed: any missing config, error, or timeout means "not verified" —
// never "verified" — so a broken partner API can only cost a discount, not
// grant one it shouldn't.
async function verifyDepartmentEnrollment({ studentId, department }) {
  const baseUrl = process.env.PEER_PARTNER_BASE_URL;
  const apiKey = process.env.PEER_KEY_IN;

  if (!baseUrl || !apiKey) {
    // No partner wired up yet — local mock always approves so checkout can be
    // built and tested before a partner team is confirmed (proposal §13).
    return process.env.PEER_MOCK === 'true';
  }

  try {
    const url = `${baseUrl}/api/peer/enrollment?studentId=${encodeURIComponent(studentId)}&department=${encodeURIComponent(department || '')}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(url, {
      headers: { 'x-api-key': apiKey },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) return false;
    const json = await response.json();
    return Boolean(json.enrolled);
  } catch (error) {
    console.error('Peer enrollment check failed (failing closed):', error.message);
    return false;
  }
}

module.exports = { verifyDepartmentEnrollment };
