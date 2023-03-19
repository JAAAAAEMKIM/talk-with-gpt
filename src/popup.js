const STORAGE_KEY = 'OPEN_AI_API_KEY';
const LANGUAGE_KEY = 'LANGUAGE_KEY';

const documentLog = (log) => {
  const div = document.createElement('div');
  div.textContent = log;

  document.body.appendChild(div);
};

(async () => {
  chrome.action.setBadgeText({
    text: 'ON',
  });
  const storage = await chrome.storage.local.get([STORAGE_KEY, LANGUAGE_KEY]);
  let apiKey = storage[STORAGE_KEY];
  const lang = storage[LANGUAGE_KEY];

  const apiKeyInput = document.querySelector('#api_key_input');
  const startConversationButton = document.querySelector('#start_conversation');
  const saveButton = document.querySelector('#save_api_key');
  const editButton = document.querySelector('#edit_api_key');
  const languageSelect = document.querySelector('#language_select');

  const handleStartConversation = async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    chrome.scripting.insertCSS({
      files: ['public/modal.css'],
      target: { tabId: tab.id },
    });
    chrome.scripting.executeScript({
      files: ['src/onInit.js'],
      target: { tabId: tab.id },
    });
  };

  const handleClickSave = () => {
    apiKey = apiKeyInput.value;
    apiKeyInput.disabled = true;
    startConversationButton.removeAttribute('disabled');
    chrome.storage.local.set({ [STORAGE_KEY]: apiKeyInput.value });
    saveButton.style.display = 'none';
    editButton.style.display = 'initial';
  };

  const handleClickEdit = () => {
    startConversationButton.disabled = true;
    apiKeyInput.removeAttribute('disabled');
    editButton.style.display = 'none';
    saveButton.style.display = 'initial';
  };

  const handleChangeLanguage = (e) => {
    chrome.storage.local.set({ [LANGUAGE_KEY]: e.target.value });
  };

  languageSelect.addEventListener('change', handleChangeLanguage);
  saveButton.addEventListener('click', handleClickSave);
  editButton.addEventListener('click', handleClickEdit);
  startConversationButton.addEventListener('click', handleStartConversation);

  languageSelect.value = lang ?? 'en-US';

  if (!apiKey) {
    editButton.style.display = 'none';
  } else {
    apiKeyInput.value = apiKey;
    apiKeyInput.disabled = true;
    startConversationButton.removeAttribute('disabled');
    saveButton.style.display = 'none';
  }
})();
