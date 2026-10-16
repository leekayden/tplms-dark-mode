const KEY = 'enabled';
const api = typeof browser !== 'undefined' ? browser : chrome;
const checkbox = document.getElementById('toggle');

api.storage.local.get({ [KEY]: true }).then((res) => {
  checkbox.checked = res[KEY] !== false;
});

checkbox.addEventListener('change', () => {
  api.storage.local.set({ [KEY]: checkbox.checked });
});
