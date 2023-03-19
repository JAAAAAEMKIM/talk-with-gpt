(async () => {
  const STORAGE_KEY = 'OPEN_AI_API_KEY';
  const LANGUAGE_KEY = 'LANGUAGE_KEY';

  const refs = {
    conversation: [],
    speechRecognition: undefined,
    apiKey: undefined,
    lang: undefined,
    elements: {
      askButton: undefined,
      langInfo: undefined,
      langInfoLabel: undefined,
      langInfoContent: undefined,
      conversationList: undefined,
      toolbar: undefined,
      closeButton: undefined,
      modal: undefined,
      bg: undefined,
    },
  };

  const createCustomElement = (type, options, children) => {
    const el = document.createElement(type);
    Object.entries(options).map(([k, v]) => {
      el[k] = v;
    });

    if (children?.length > 0) {
      children.map((child) => el.appendChild(child));
    }

    return el;
  };

  const initStorage = async () => {
    const storage = await chrome.storage.local.get([STORAGE_KEY, LANGUAGE_KEY]);
    refs.apiKey = storage[STORAGE_KEY];
    refs.lang = storage[LANGUAGE_KEY] ?? 'en-US';
  };

  const initSpeechRecognition = () => {
    const rec = new webkitSpeechRecognition();
    rec.lang = refs.lang;
    rec.onresult = handleSpeechResult;

    refs.speechRecognition = rec;
  };

  const readAnswer = (ans) => {
    const speech = new SpeechSynthesisUtterance(ans);
    speech.lang = refs.lang;
    speechSynthesis.speak(speech);
  };

  const postSpeech = async (content) => {
    refs.conversation.push({ role: 'user', content });
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: refs.conversation,
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refs.apiKey}`,
      },
    });

    const result = await res.json();
    if (result.error) {
      alert(result.error.message);
      throw new Error(result.error.message)
    } else {
      refs.conversation.push(result.choices[0].message);
      return result;
    }
  };

  const addListItem = (content, className) => {
    const li = document.createElement('li');
    li.textContent = content;
    li.className = className;

    refs.elements.conversationList?.appendChild(li);
  };

  const handleSpeechStart = () => {
    refs.speechRecognition.start();
    refs.elements.askButton.textContent = 'Speaking...';
    refs.elements.askButton.disabled = true;
  };

  const handleSpeechResult = async (e) => {
    addListItem(`Q: ${e.results[0][0].transcript}`, 'question_item');
    refs.elements.askButton.textContent = 'Wating Response...';
    const { choices } = await postSpeech(e.results[0][0].transcript);

    const answer = choices[0].message.content;
    readAnswer(answer);
    addListItem(`A: ${answer}`, 'answer_item');

    refs.elements.askButton.removeAttribute('disabled');
    refs.elements.askButton.textContent = 'Click to speak';
  };

  const handleClose = () => {
    refs.elements.bg.remove();
  };

  const render = () => {
    refs.elements.askButton = createCustomElement('button', {
      onclick: handleSpeechStart,
      textContent: 'Click to speak',
    });

    refs.elements.langInfo = createCustomElement(
      'div',
      { className: 'lang_info' },
      [
        createCustomElement('span', { textContent: 'lang: ' }),
        createCustomElement('code', { textContent: refs.lang }),
      ]
    );

    refs.elements.toolbar = createCustomElement(
      'div',
      { className: 'toolbar' },
      [refs.elements.askButton, refs.elements.langInfo]
    );

    refs.elements.conversationList = createCustomElement('ul', {
      className: 'conversation_list',
    });

    refs.elements.closeButton = createCustomElement('i', {
      onclick: handleClose,
      textContent: 'close',
      className: 'close-button',
    });

    refs.elements.modal = createCustomElement('div', { id: 'talk-gpt-modal' }, [
      refs.elements.conversationList,
      refs.elements.toolbar,
      refs.elements.closeButton,
    ]);

    refs.elements.bg = createCustomElement('div', { id: 'talk-gpt-modal-bg' }, [
      refs.elements.modal,
    ]);

    document.body.appendChild(refs.elements.bg);
  };

  try {
    await initStorage();
    initSpeechRecognition();
    render();
  } catch (e) {
    console.error(e);
  }
})();
