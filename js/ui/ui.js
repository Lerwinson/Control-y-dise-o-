// Toasts, modals, confirm dialogs
import { icon } from './icons.js';
import { t } from '../i18n.js';

export function toast(msg, kind = 'ok') {
  const root = document.getElementById('toast-root');
  const el = document.createElement('div');
  const color = kind === 'err' ? '#ff3b3b' : kind === 'info' ? '#ff8a3a' : '#28d17c';
  el.className = 'glass neon-border rounded-xl px-4 py-3 text-sm flex items-center gap-3 fade-in';
  el.style.minWidth = '220px';
  el.innerHTML = `<span style="color:${color}">${icon(kind === 'err' ? 'x' : 'check', 18)}</span><span>${msg}</span>`;
  root.appendChild(el);
  setTimeout(() => { el.style.transition = 'opacity .4s, transform .4s'; el.style.opacity = '0'; el.style.transform = 'translateX(20px)'; }, 2600);
  setTimeout(() => el.remove(), 3100);
}

export function openModal(title, bodyHTML, opts = {}) {
  const root = document.getElementById('modal-root');
  root.classList.remove('hidden'); root.classList.add('flex');
  root.innerHTML = `
    <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" data-close></div>
    <div class="glass neon-border rounded-2xl w-full ${opts.wide ? 'max-w-3xl' : 'max-w-lg'} relative fade-in max-h-[88vh] overflow-y-auto custom-scroll">
      <div class="flex items-center justify-between px-5 py-4 border-b border-red-900/40 sticky top-0 bg-black/40 backdrop-blur z-10">
        <h3 class="font-display font-bold text-lg grad-text">${title}</h3>
        <button class="text-red-300 hover:text-white" data-close>${icon('x', 22)}</button>
      </div>
      <div class="p-5" id="modal-body">${bodyHTML}</div>
    </div>`;
  root.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', closeModal));
  return root.querySelector('#modal-body');
}
export function closeModal() {
  const root = document.getElementById('modal-root');
  root.classList.add('hidden'); root.classList.remove('flex'); root.innerHTML = '';
}

export function confirmDialog(message, onYes) {
  const body = openModal(t('confirm_delete'), `
    <p class="text-sm text-zinc-300 mb-5">${message}</p>
    <div class="flex justify-end gap-2">
      <button class="btn btn-ghost" data-no>${t('cancel')}</button>
      <button class="btn btn-primary" data-yes>${t('delete')}</button>
    </div>`);
  body.querySelector('[data-no]').addEventListener('click', closeModal);
  body.querySelector('[data-yes]').addEventListener('click', () => { closeModal(); onYes && onYes(); });
}

// section header helper
export function pageHeader(title, subtitle, actionsHTML = '') {
  return `<div class="flex flex-wrap items-end justify-between gap-3 mb-6">
    <div>
      <h1 class="font-display font-extrabold text-2xl md:text-3xl grad-text neon-text">${title}</h1>
      ${subtitle ? `<p class="text-sm text-red-200/70 mt-1">${subtitle}</p>` : ''}
    </div>
    <div class="flex items-center gap-2 flex-wrap">${actionsHTML}</div>
  </div>`;
}
