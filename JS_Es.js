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
    'Relaciones personales': [
      { text: '¿Cómo estás?', audio: new Audio('como estas.mp3') },
      { text: 'Te extraño', audio: new Audio('te extraño.mp3') },
      { text: 'Lo siento', audio: new Audio('lo siento.mp3') },
      { text: 'Gracias', audio: new Audio('gracias.mp3') },
      { text: 'Te quiero', audio: new Audio('te quiero.mp3') },
    ],
    'Trabajo y estudios': [
      { text: '¿Qué hay que hacer?', audio: new Audio('que hay que hacer ahora.mp3') },
      { text: '¿A qué hora es la reunión?', audio: new Audio('a que hora es la reunion.mp3') },
      { text: 'Necesito ayuda,porfavor', audio: new Audio('necesito ayuda.mp3') },
      { text: 'Ya terminé', audio: new Audio('ya termine.mp3') },
      { text: '¿Qué sigue?', audio: new Audio('que sigue.mp3') },
    ],
    'Salud y bienestar': [
      { text: 'Me duele', audio: new Audio('me duele.mp3') },
      { text: '¿Dónde está la farmacia?', audio: new Audio('dnd esta la farmacia.mp3') },
      { text: 'Estoy cansado', audio: new Audio('estoy cansado.mp3') },
      { text: 'Tienes algo para el dolor', audio: new Audio('tienes algo para el dolor.mp3') },
      { text: 'No puedo dormir', audio: new Audio('no puedo dormir.mp3') },
    ],
    'Toma de decisiones': [
  { text: '¿Qué prefieres?', audio: new Audio('que prefieres.mp3') },
  { text: '¿Sí o no?', audio: new Audio('si o no.mp3') },
  { text: 'Vamos a intentarlo', audio: new Audio('vamos a intentarlo.mp3') },
  { text: '¿Cuál es la mejor opción?', audio: new Audio('cual es la mejor opcion.mp3') },
  { text: 'Decide tú', audio: new Audio('decide tu.mp3') },
],
'Vida cotidiana': [
  { text: '¿Qué hora es?', audio: new Audio('que hora es.mp3') },
  { text: '¿Dónde está el baño?', audio: new Audio('donde esta el baño.mp3') },
  { text: 'Tengo hambre.', audio: new Audio('tengo hambre.mp3') },
  { text: 'Vamos', audio: new Audio('vamos.mp3') },
  { text: '¿Dónde está?', audio: new Audio('donde estas o donde estan.mp3') },
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
