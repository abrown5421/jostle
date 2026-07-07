export async function triggerEngagementDeploy(): Promise<void> {
  const hookUrl = process.env['RENDER_DEPLOY_HOOK_URL'];

  if (!hookUrl) {
    console.info('[DeployHook] RENDER_DEPLOY_HOOK_URL not set — skipping trigger (local dev)');
    return;
  }

  const response = await fetch(hookUrl, { method: 'POST' });

  if (!response.ok) {
    console.error(`[DeployHook] Render deploy trigger failed: ${response.status}`);
  } else {
    console.info('[DeployHook] Render deploy triggered successfully');
  }
}