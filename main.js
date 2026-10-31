document.querySelector('.burger')?.addEventListener('click', () => {
  document.querySelector('.nav')?.classList.toggle('open');
});
document.querySelectorAll('.nav a').forEach(a => a.addEventListener('click', () => {
  document.querySelector('.nav')?.classList.remove('open');
}));
document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === tab));
  document.querySelectorAll('.price-panel').forEach(p => p.hidden = p.id !== tab.dataset.target);
}));
