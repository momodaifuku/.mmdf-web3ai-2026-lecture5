// Copy-to-clipboard for prompt blocks
async function copyPrompt(btn) {
  const block = btn.closest('.prompt-block');
  const text = block.querySelector('pre').innerText;
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    // Fallback for older browsers / file://
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (_) {}
    document.body.removeChild(ta);
  }
  const original = btn.innerHTML;
  btn.innerHTML = '✓ Copied!';
  btn.classList.add('copied');
  showToast('プロンプトをコピーしました。Claude Code に貼り付けてください。');
  setTimeout(() => {
    btn.innerHTML = original;
    btn.classList.remove('copied');
  }, 2400);
}

function showToast(msg) {
  let t = document.getElementById('global-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'global-toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => t.classList.remove('show'), 3200);
}

// Auto-attach to all copy buttons on page load
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => copyPrompt(btn));
  });
});
