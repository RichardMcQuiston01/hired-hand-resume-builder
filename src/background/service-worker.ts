chrome.runtime.onInstalled.addListener(() => {
  console.info('Hired Hand: Resume Builder installed.');
});

// Open the side panel when the user clicks the toolbar icon, instead of a
// small popup — the resume builder needs more room than a popup allows.
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error: unknown) => {
    console.error('Failed to set side panel behavior.', error);
  });
