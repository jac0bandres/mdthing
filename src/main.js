const md = window.markdownit({
    html: false,
    linkify: true,
    breaks: true,
    highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return '<pre class="hljs"><code>' +
                    hljs.highlight(str, { language: lang }).value +
                    '</code></pre>';
            } catch (_) {}
        }
        return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
    }
});

const editor = document.getElementById('editor');
const preview = document.getElementById('preview');

let typingTimer;
const TYPING_DELAY = 2000;
let rawTextBuffer = '';
let mdBuffer = '';
const imageMap = new Map();

function renderMarkdown(text) {
    const preprocessedText = preprocessMarkdown(text);
    return md.render(preprocessedText);
}

function updatePreview() {
    preview.classList.remove('hidden');
    preview.classList.add('visible');

    editor.classList.remove('visible');
    editor.classList.add('hidden');

    preview.innerHTML = mdBuffer;
}

function preprocessMarkdown(text) {
    // Replace image placeholders with actual image URLs
    return text.replace(/image=\[([^\]]*)\]/g, (_, alt) => {
        if (imageMap.has(alt)) {
            return `![${alt}](${imageMap.get(alt)})`;
        }
        return ""
    });
}

function placeCaretAtEnd(el) {
    el.focus();
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(el);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
}

editor.addEventListener('keydown', () => {
    preview.classList.remove('visible');
    preview.classList.add('hidden');

    editor.classList.remove('hidden');
    editor.classList.add('visible');

    rawTextBuffer = editor.innerText;
    mdBuffer = renderMarkdown(rawTextBuffer);
    clearTimeout(typingTimer);
    typingTimer = setTimeout(updatePreview, TYPING_DELAY);
});

preview.addEventListener('click', () => {
    editor.classList.remove('hidden');
    editor.classList.add('visible');

    preview.classList.remove('visible');
    preview.classList.add('hidden');
    placeCaretAtEnd(editor);
});

function addImage(alt, url) {
    if (!imageMap.has(alt)) {
        imageMap.set(alt, url);
        insertTextAtCursor(`image=[${alt}]`);
    }
}

function removeImage(alt) {
    if (imageMap.has(alt)) {
        const placeholder = `image=[${alt}]`;
        const sel = window.getSelection();
        const range = sel.getRangeAt(0);
        const textNode = document.createTextNode(editor.innerText);
        range.deleteContents();
        const newText = textNode.textContent.replace(placeholder, '');
        editor.innerText = newText;
        placeCaretAtEnd(editor);
    }
}

function insertTextAtCursor(markdown) {
    const sel = window.getSelection();
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const textNode = document.createTextNode(markdown);
    range.insertNode(textNode);

    // Move cursor to end of inserted node
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    sel.removeAllRanges();
    sel.addRange(range);
}

async function uploadImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result); // base64 data URL
        reader.readAsDataURL(file);
    });
}

const exportButton = document.getElementById('export-md');

function exportMarkdown() {
    const fullMarkdown = preprocessMarkdown(rawTextBuffer);
    const blob = new Blob([fullMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'note.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

exportButton.addEventListener('click', exportMarkdown);

const uploadInput = document.getElementById('upload-md');

uploadInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    const text = event.target.result;

    // Fill editor and update buffer
    rawTextBuffer = text;
    editor.innerText = rawTextBuffer;
    mdBuffer = renderMarkdown(rawTextBuffer);
    preview.innerHTML = mdBuffer;

    // Optional: swap to editor view immediately
    preview.classList.add('hidden');
    preview.classList.remove('visible');
    editor.classList.remove('hidden');
    editor.classList.add('visible');
  };

  reader.readAsText(file);
});
editor.addEventListener('dragover', (e) => {
    e.preventDefault();
    editor.style.border = '2px dashed #888'; // visual cue
});

editor.addEventListener('dragleave', () => {
    editor.style.border = '1px solid #444';
});

editor.addEventListener('drop', async (e) => {
    e.preventDefault();
    editor.style.border = '1px solid #444';
    const files = e.dataTransfer.files;

    for (let file of files) {
        if (file.type.startsWith('image/')) {
            const imageUrl = await uploadImage(file); // simulate or real upload
            imageMap.set(file.name, imageUrl);
            insertTextAtCursor(`image=[${file.name}]`);
        }
    }
});
