document.addEventListener("DOMContentLoaded", function() {
  const SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e'
  const CHARACTERISTIC_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'
  const connectButton = document.getElementById('connect')
  const warningMessage = document.getElementById('warning-message')
  const textSignBlock = document.getElementById('text-sign-block')
  const topicButtonsBlock = document.getElementById('topic-buttons-block')
  const textSign = document.getElementById('text-sign')
  const errorMessage = document.getElementById('error-message')
  const errorMessageText = document.getElementById('error-message-text')
  let device, signChar, word, words

  const topics = {
    'Personal relationships': [
      { text: 'How are you?', audio: new Audio('how are you.mp3') },
      { text: 'I miss you', audio: new Audio('i miss you.mp3') },
      { text: 'I am sorry', audio: new Audio('im sorry.mp3') },
      { text: 'Thank you', audio: new Audio('thank you.mp3') },
      { text: 'I love you', audio: new Audio('i love you.mp3') },
    ],
    'Work and studies': [
      { text: 'What should be done?', audio: new Audio('what should be done.mp3') },
      { text: 'What time is the meeting?', audio: new Audio('what time is the meeting.mp3') },
      { text: 'I need to help', audio: new Audio('i need help.mp3') },
      { text: 'I am done', audio: new Audio('im done.mp3') },
      { text: 'What comes next?', audio: new Audio('what come next.mp3') },
    ],
    'Health and Wellness': [
      { text: 'It hurts', audio: new Audio('it hurts.mp3') },
      { text: 'Where is the pharmacy?', audio: new Audio('where ist the farmacy.mp3') },
      { text: 'I am tired', audio: new Audio('i am tired.mp3') },
      { text: 'Do you have anything for the pain?', audio: new Audio('do you have anything for the pain.mp3') },
      { text: 'I can´t sleep', audio: new Audio('i cant sleep.mp3') },
    ],
    'Decision-making': [
  { text: 'What do you prefer?', audio: new Audio('what do you prefer.mp3') },
  { text: 'Yes or no?', audio: new Audio('yes or no.mp3') },
  { text: 'Let´s give it a try', audio: new Audio('lets give it a try.mp3') },
  { text: 'What is the best option?', audio: new Audio('what is the best option.mp3') },
  { text: 'You decide', audio: new Audio('you dedice.mp3') },
],
'Everyday life': [
  { text: 'What time is it?', audio: new Audio('what time is it.mp3') },
  { text: 'Where is the bathroom?', audio: new Audio('where is the batroom.mp3') },
  { text: 'I am hungry', audio: new Audio('im hungry.mp3') },
  { text: 'Let´s go', audio: new Audio('lest go.mp3') },
  { text: 'Where is he?', audio: new Audio('where is he.mp3') },
],
  }

  function getEverythingReady() {
    Object.entries(topics).map(([key, value], index) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.classList.add('btn', 'text-capitalize', 'topic-button')
      button.textContent = key

      if (index === 0) {
        button.classList.add('btn-primary')
        words = value
      } else {
        button.classList.add('btn-outline-primary')
      }

      button.addEventListener('click', function() {
        Array.from(document.getElementsByClassName('topic-button')).forEach((item) => {
          item.classList.remove('btn-primary')
          if (!item.classList.contains('btn-outline-primary')) item.classList.add('btn-outline-primary')
        })
        words = value
        this.classList.remove('btn-outline-primary')
        this.classList.add('btn-primary')
      })

      topicButtonsBlock.append(button)
    })
  }

  async function requestDevice() {
    device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: "BBC micro:bit" }],
      optionalServices: [SERVICE_UUID],
    })

    device.addEventListener('gattserverdisconnected', connectDevice)
  }

  const translate = (string) => {
    const number = Number(string)

    if (number >= -25 && number <= 35) {
      if (word !== words[0].text) words[0].audio.play()
      word = words[0].text
    } else if (number >= 35 && number <= 75) {
      if (word !== words[1].text) words[1].audio.play()
      word = words[1].text
    } else if (number >= -75 && number <= -25) {
      if (word !== words[2].text) words[2].audio.play()
      word = words[2].text
    } else if (number >= 115 && number <= 140) {
      if (word !== words[3].text) words[3].audio.play()
      word = words[3].text
    } else if (number >= 150 && number <= 180) {
      if (word !== words[4].text) words[4].audio.play()
      word = words[4].text
    }

    return word
  }

  function parseSignGlove(event) {
    let receivedData = []
    for (var i = 0; i < event.target.value.byteLength; i++) {
      receivedData[i] = event.target.value.getUint8(i)
    }
    return translate(String.fromCharCode.apply(null, receivedData))
  }

  async function connectDevice() {
    if (device.gatt.connected) return

    const server = await device.gatt.connect()
    const service = await server.getPrimaryService(SERVICE_UUID)
    signChar = await service.getCharacteristic(CHARACTERISTIC_UUID)
    signChar.addEventListener('characteristicvaluechanged', (event) => {
      textSign.textContent = parseSignGlove(event)
    })
  }

  async function startMonitoring() {
    await signChar.startNotifications()
  }

  connectButton.addEventListener('click', async () => {
    if (!navigator.bluetooth) {
      warningMessage.classList.remove('d-none')
      connectButton.classList.add('d-none')
      return
    }
    if (!device) {
      try {
        if (!errorMessage.classList.contains('d-none')) errorMessage.classList.add('d-none')

        await requestDevice()

        connectButton.innerHTML = `
          <span class="spinner-grow spinner-grow-sm" aria-hidden="true"></span>
          <span role="status">Conectando...</span>
        `
        connectButton.disabled = true

        await connectDevice()

        if (device) {
          getEverythingReady()
          connectButton.classList.add('d-none')
          textSignBlock.classList.remove('d-none')
          await startMonitoring()
        } else {
          connectButton.textContent = 'Conectar guante'
          connectButton.disabled = false
        }
      } catch (error) {
        console.log(error.message)
        connectButton.textContent = 'Conectar guante'
        connectButton.disabled = false
        errorMessageText.textContent = error.message
        errorMessage.classList.remove('d-none')
        device = undefined
      }
    }
  })
})
