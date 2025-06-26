# Making a markdown editor

I've been writing up these blogs within neovim with no real way to preview them. I used Obsidian for a semester and it was good for what it's worth. But it should'nt be too difficult to make one of my own.
Regex was the most immediate answer, just mapping Common Markdown syntax to tags like # to h1 and so on.o

```javascript
 function renderMarkdown(text) {
    return text
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }
```

It worked great whenever I rendered the markdown in as sepserate divs, buts I wanted that sexy realtime rendering within the same editor Obsidian had. 

Markdown-it is a great markdown rendering library I decided to abstract all the parsing to.

```html   <div id="editor" class="styled-div visible" contenteditable="true" spellcheck="false"></div>
<d
iv id=
"preview" class="styled-div hidden"></div>
```
Here we can have a sort of invisible ghost layer over the actual editor itself and pop it up with the rendered markdown on a debounce triggered on input.
