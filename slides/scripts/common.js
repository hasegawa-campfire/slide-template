const suffixPreview = `
<!DOCTYPE html>
<meta charset="utf-8">
<title></title>

<style>
body {
  font-family: sans-serif;
  color: #4d4a4a;
  font-size: 25px;
  line-height: 1.4;
  cursor: default;
  margin: 0;
}

*, ::before, ::after {
  box-sizing: border-box;
}

button, input, select, textarea {
  font-family: inherit;
  font-size: 100%;
}
</style>

<script>
const $ = (sel, el = document) => el.querySelector(sel)
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel))
</script>
`

function $(sel, el = document) {
  return el.querySelector(sel)
}

function $$(sel, el = document) {
  return Array.from(el.querySelectorAll(sel))
}

function flatIndent(text) {
  text = text.split(/[\r\n]/).map(s => s.trim() ? s : '').join('\n').replace(/^\n+|\n+$/g, '')
  const indent = text.match(/^ */)[0].length
  return text.replace(new RegExp(`^ {0,${indent}}`, 'gm'), '')
}

for (const $temp of document.querySelectorAll('template.playground')) {
  $temp.insertAdjacentHTML('afterend', `
    <div class="playground">
      <iframe class="preview"></iframe>
      <div class="tab">HTML</div>
      <div class="tab">CSS</div>
      <div class="tab">JavaScript</div>
      <code contenteditable spellcheck="false"></code>
      <code contenteditable spellcheck="false"></code>
      <code contenteditable spellcheck="false"></code>
    </div>
  `)

  const $playground = $temp.nextElementSibling
  const $preview = $('.preview', $playground)
  const $tabs = $$('.tab', $playground)
  const $codes = $$('code', $playground)

  function init() {
    const node = $temp.cloneNode(true)
    $codes[1].textContent = $$('style', node.content).map(el => (el.remove(), flatIndent(el.innerHTML))).join('')
    $codes[2].textContent = $$('script', node.content).map(el => (el.remove(), flatIndent(el.innerHTML))).join('')
    $codes[0].textContent = flatIndent(node.innerHTML)
    $preview.style.width = '';
    updatePreview()
    $codes[0].scrollTop = 0
    $codes[1].scrollTop = 0
    $codes[2].scrollTop = 0
    $preview.contentWindow.document.scrollingElement.scrollTop = 0
    selectTab(Math.max(0, ['html', 'css', 'script'].indexOf($temp.dataset.tab)))
  }

  function selectTab(index) {
    for (let i  = 0; i < 3; i++) {
      $tabs[i].classList.toggle('active', i === index)
      $codes[i].classList.toggle('active', i === index)
    }
  }

  function updatePreview() {
    URL.revokeObjectURL($preview.src)
    const html = `
      ${suffixPreview}
      <style>${$codes[1].textContent}</style>
      ${$codes[0].textContent}
      <script>${$codes[2].textContent}</script>
    `
    $preview.src = URL.createObjectURL(new Blob([fixedUrl(html)], { type: 'text/html' }))
  }

  function fixedUrl(html) {
    const node = document.createElement('template')
    node.innerHTML = html
    for (const el of node.content.querySelectorAll('img')) {
      const src = el.getAttribute('src')
      if (src && !/^(https?:)?\/\//.test(src)) {
        el.src = new URL(src, location).href
      }
    }
    return node.innerHTML
  }

  let debounceId
  for (const el of $codes) {
    el.addEventListener('input', () => {
      clearTimeout(debounceId)
      debounceId = setTimeout(updatePreview, 500)
    })
  }
  $tabs.forEach((el, i) => el.addEventListener('click', () => selectTab(i)))
  $temp.remove()
  addEventListener('slide-init', init)
  init()
}
