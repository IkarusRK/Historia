const themeToggle = document.getElementById('themeToggle');
const body = document.body;
function setTheme(theme) {
    body.setAttribute('data-theme', theme);
    themeToggle.textContent = theme === 'dark' ? 'Modo Claro' : 'Modo Escuro';
}
const saved = localStorage.getItem('akira_theme') || 'light';
setTheme(saved);
themeToggle.addEventListener('click', () => {
    const cur = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setTheme(cur);
    localStorage.setItem('akira_theme', cur);
});

const progress = document.getElementById('progress');
const story = document.getElementById('story');
function updateProgress() {
    const rect = story.getBoundingClientRect();
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = window.scrollY;
    const pct = total ? Math.round((scrolled / total) * 100) : 0;
    progress.value = pct;
}
window.addEventListener('scroll', updateProgress);
window.addEventListener('resize', updateProgress);
updateProgress();

document.getElementById('topBtn').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

const listenBtn = document.getElementById('listenBtn');
let speaking = false;
listenBtn.addEventListener('click', () => {
    if (speaking) { speechSynthesis.cancel(); speaking = false; listenBtn.textContent = '▶ Ouvir'; return }
    const text = story.innerText;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95; utter.lang = 'pt-BR';
    utter.onend = () => { speaking = false; listenBtn.textContent = '▶ Ouvir' };
    speechSynthesis.speak(utter); speaking = true; listenBtn.textContent = '■ Parar';
});

window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 't') themeToggle.click();
});
