// Accessible toast/notification system
(function(){
  // Create container
  const container = document.createElement('div');
  container.id = 'app-toast-container';
  container.style.position = 'fixed';
  container.style.right = '1rem';
  container.style.top = '1rem';
  container.style.zIndex = 99999;
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '0.5rem';
  // Create a persistent, screen-reader-only live region for assistive tech
  const liveRegion = document.createElement('div');
  liveRegion.id = 'app-toast-live';
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  // Visually hide but keep in accessibility tree
  liveRegion.style.position = 'absolute';
  liveRegion.style.width = '1px';
  liveRegion.style.height = '1px';
  liveRegion.style.margin = '-1px';
  liveRegion.style.padding = '0';
  liveRegion.style.overflow = 'hidden';
  liveRegion.style.clip = 'rect(0 0 0 0)';
  liveRegion.style.whiteSpace = 'nowrap';
  liveRegion.style.border = '0';

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.body.contains(container)) document.body.appendChild(container);
    if (!document.body.contains(liveRegion)) document.body.appendChild(liveRegion);
  });
  function makeToast(msg, type='info', duration=3500) {
    const toast = document.createElement('div');
    toast.className = 'app-toast app-toast-' + type;
    toast.setAttribute('role','status');
    toast.setAttribute('aria-live','polite');
    toast.style.background = type === 'error' ? '#fff1f0' : (type === 'warning' ? '#fffbe6' : '#f0f9ff');
    toast.style.color = type === 'error' ? '#611a15' : (type === 'warning' ? '#664d03' : '#0c5460');
    toast.style.border = '1px solid rgba(0,0,0,0.08)';
    toast.style.padding = '0.5rem 0.75rem';
    toast.style.borderRadius = '6px';
    toast.style.boxShadow = '0 6px 18px rgba(0,0,0,0.06)';
    toast.style.fontFamily = 'Segoe UI, Roboto, Arial, sans-serif';
    toast.style.fontSize = '13px';
    toast.textContent = msg;
    container.appendChild(toast);
    // update the persistent live region so screen readers reliably announce
    try { liveRegion.textContent = String(msg); } catch (e) { /* ignore */ }
    setTimeout(() => {
      try { toast.style.opacity = '0'; toast.style.transform = 'translateY(-6px)'; } catch(e){}
      setTimeout(() => { try { container.removeChild(toast); } catch(e){} }, 300);
    }, duration);
  }
  window.showToast = makeToast;
  // backward-compatible notify wrapper
  window.notify = function(msg, type='info', duration) { makeToast(String(msg), type, duration || 3500); };
  // Monkey-patch alert to show toast instead (but leave original available)
  try {
    window._originalAlert = window.alert.bind(window);
    window.alert = function(msg) { makeToast(String(msg), 'info', 5000); };
  } catch(e) {}
})();
