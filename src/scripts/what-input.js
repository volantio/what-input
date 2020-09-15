module.exports = (() => {
  /*
   * variables
   */

  // cache document.documentElement
  const docElem = document.documentElement

  // Prefix for all attributes added to `docElem`
  let attributePrefix

  // currently focused dom element
  let currentElement = null

  // last used input type
  let currentInput = 'initial'

  // last used input intent
  let currentIntent = currentInput

  // UNIX timestamp of current event
  let currentTimestamp = Date.now()

  // form input types
  const formInputs = ['button', 'input', 'select', 'textarea']

  // empty array for holding callback functions
  const functionList = []

  // list of modifier keys commonly used with the mouse and
  // can be safely ignored to prevent false keyboard detection
  let ignoreMap = [
    16, // shift
    17, // control
    18, // alt
    91, // Windows key / left Apple cmd
    93 // Windows menu / right Apple cmd
  ]

  let specificMap = []

  // mapping of events to input types
  const inputMap = {
    keydown: 'keyboard',
    keyup: 'keyboard',
    mousedown: 'mouse',
    mousemove: 'mouse',
    MSPointerDown: 'pointer',
    MSPointerMove: 'pointer',
    pointerdown: 'pointer',
    pointermove: 'pointer',
    touchstart: 'touch',
    touchend: 'touch'
  }

  // boolean: true if the page is being scrolled
  let isScrolling = false

  // store current mouse position
  const mousePos = {
    x: null,
    y: null
  }

  // map of IE 10 pointer events
  const pointerMap = {
    2: 'touch',
    3: 'touch', // treat pen like touch
    4: 'mouse'
  }

  // check support for passive event listeners
  let supportsPassive = false

  try {
    const opts = Object.defineProperty({}, 'passive', {
      get: () => {
        supportsPassive = true
      }
    })

    window.addEventListener('test', null, opts)
  } catch (e) {
    // fail silently
  }

  /*
   * set up
   */

  const setUp = (options = {}) => {
    attributePrefix = options.attributePrefix ?? 'data-'

    // add correct mouse wheel event mapping to `inputMap`
    inputMap[detectWheel()] = 'mouse'

    addListeners()
  }

  const tearDown = () => {
    removeListeners()
  }

  /*
   * events
   */

  const addListeners = () => {
    // `pointermove`, `MSPointerMove`, `mousemove` and mouse wheel event binding
    // can only demonstrate potential, but not actual, interaction
    // and are treated separately
    const options = supportsPassive ? { passive: true } : false

    // pointer events (mouse, pen, touch)
    if (window.PointerEvent) {
      window.addEventListener('pointerdown', setInput)
      window.addEventListener('pointermove', setIntent)
    } else if (window.MSPointerEvent) {
      window.addEventListener('MSPointerDown', setInput)
      window.addEventListener('MSPointerMove', setIntent)
    } else {
      // mouse events
      window.addEventListener('mousedown', setInput)
      window.addEventListener('mousemove', setIntent)

      // touch events
      if ('ontouchstart' in window) {
        window.addEventListener('touchstart', setInput, options)
        window.addEventListener('touchend', setInput)
      }
    }

    // mouse wheel
    window.addEventListener(detectWheel(), setIntent, options)

    // keyboard events
    window.addEventListener('keydown', setInput)
    window.addEventListener('keyup', setInput)

    // focus events
    window.addEventListener('focusin', setElement)
    window.addEventListener('focusout', clearElement)
  }

  const removeListeners = () => {
    // pointer events (mouse, pen, touch)
    if (window.PointerEvent) {
      window.removeEventListener('pointerdown', setInput)
      window.removeEventListener('pointermove', setIntent)
    } else if (window.MSPointerEvent) {
      window.removeEventListener('MSPointerDown', setInput)
      window.removeEventListener('MSPointerMove', setIntent)
    } else {
      // mouse events
      window.removeEventListener('mousedown', setInput)
      window.removeEventListener('mousemove', setIntent)

      // touch events
      if ('ontouchstart' in window) {
        window.removeEventListener('touchstart', setInput)
        window.removeEventListener('touchend', setInput)
      }
    }

    // mouse wheel
    window.removeEventListener(detectWheel(), setIntent)

    // keyboard events
    window.removeEventListener('keydown', setInput)
    window.removeEventListener('keyup', setInput)

    // focus events
    window.removeEventListener('focusin', setElement)
    window.removeEventListener('focusout', clearElement)
  }

  // checks conditions before updating new input
  const setInput = event => {
    const eventKey = event.which
    let value = inputMap[event.type]

    if (value === 'pointer') {
      value = pointerType(event)
    }

    const ignoreMatch =
      !specificMap.length && ignoreMap.indexOf(eventKey) === -1

    const specificMatch =
      specificMap.length && specificMap.indexOf(eventKey) !== -1

    let shouldUpdate =
      (value === 'keyboard' && eventKey && (ignoreMatch || specificMatch)) ||
      value === 'mouse' ||
      value === 'touch'

    // prevent touch detection from being overridden by event execution order
    if (validateTouch(value)) {
      shouldUpdate = false
    }

    if (shouldUpdate && currentInput !== value) {
      currentInput = value

      doUpdate('input')
    }

    if (shouldUpdate && currentIntent !== value) {
      // preserve intent for keyboard interaction with form fields
      const activeElem = document.activeElement
      const notFormInput =
        activeElem &&
        activeElem.nodeName &&
        (formInputs.indexOf(activeElem.nodeName.toLowerCase()) === -1 ||
          (activeElem.nodeName.toLowerCase() === 'button' &&
            !activeElem.closest('form')))

      if (notFormInput) {
        currentIntent = value

        doUpdate('intent')
      }
    }
  }

  // updates the doc and `inputTypes` array with new input
  const doUpdate = which => {
    docElem.setAttribute(
      attributePrefix + 'what' + which,
      which === 'input' ? currentInput : currentIntent
    )

    fireFunctions(which)
  }

  // updates input intent for `mousemove` and `pointermove`
  const setIntent = event => {
    let value = inputMap[event.type]

    if (value === 'pointer') {
      value = pointerType(event)
    }

    // test to see if `mousemove` happened relative to the screen to detect scrolling versus mousemove
    detectScrolling(event)

    // only execute if scrolling isn't happening
    if (
      ((!isScrolling && !validateTouch(value)) ||
        ((isScrolling && event.type === 'wheel') ||
          event.type === 'mousewheel' ||
          event.type === 'DOMMouseScroll')) &&
      currentIntent !== value
    ) {
      currentIntent = value

      doUpdate('intent')
    }
  }

  const setElement = event => {
    if (!event.target.nodeName) {
      // If nodeName is undefined, clear the element
      // This can happen if click inside an <svg> element.
      clearElement()
      return
    }

    currentElement = event.target.nodeName.toLowerCase()
    docElem.setAttribute(attributePrefix + 'whatelement', currentElement)

    if (event.target.classList && event.target.classList.length) {
      docElem.setAttribute(
        attributePrefix + 'whatclasses',
        event.target.classList.toString().replace(' ', ',')
      )
    }
  }

  const clearElement = () => {
    currentElement = null

    docElem.removeAttribute(attributePrefix + 'whatelement')
    docElem.removeAttribute(attributePrefix + 'whatclasses')
  }

  /*
   * utilities
   */

  const pointerType = event => {
    if (typeof event.pointerType === 'number') {
      return pointerMap[event.pointerType]
    } else {
      // treat pen like touch
      return event.pointerType === 'pen' ? 'touch' : event.pointerType
    }
  }

  // prevent touch detection from being overridden by event execution order
  const validateTouch = value => {
    const timestamp = Date.now()

    const touchIsValid =
      value === 'mouse' &&
      currentInput === 'touch' &&
      timestamp - currentTimestamp < 200

    currentTimestamp = timestamp

    return touchIsValid
  }

  // detect version of mouse wheel event to use
  // via https://developer.mozilla.org/en-US/docs/Web/API/Element/wheel_event
  const detectWheel = () => {
    let wheelType = null

    // Modern browsers support "wheel"
    if ('onwheel' in document.createElement('div')) {
      wheelType = 'wheel'
    } else {
      // Webkit and IE support at least "mousewheel"
      // or assume that remaining browsers are older Firefox
      wheelType =
        document.onmousewheel !== undefined ? 'mousewheel' : 'DOMMouseScroll'
    }

    return wheelType
  }

  // runs callback functions
  const fireFunctions = type => {
    for (let i = 0, len = functionList.length; i < len; i++) {
      if (functionList[i].type === type) {
        functionList[i].fn.call(
          this,
          type === 'input' ? currentInput : currentIntent
        )
      }
    }
  }

  // finds matching element in an object
  const objPos = match => {
    for (let i = 0, len = functionList.length; i < len; i++) {
      if (functionList[i].fn === match) {
        return i
      }
    }
  }

  const detectScrolling = event => {
    if (mousePos.x !== event.screenX || mousePos.y !== event.screenY) {
      isScrolling = false

      mousePos.x = event.screenX
      mousePos.y = event.screenY
    } else {
      isScrolling = true
    }
  }

  /*
   * api
   */

  return {
    // returns string: the current input type
    // opt: 'intent'|'input'
    // 'input' (default): returns the same value as the `data-whatinput` attribute
    // 'intent': includes `data-whatintent` value if it's different than `data-whatinput`
    ask: opt => {
      return opt === 'intent' ? currentIntent : currentInput
    },

    // returns string: the currently focused element or null
    element: () => {
      return currentElement
    },

    // overwrites ignored keys with provided array
    ignoreKeys: arr => {
      ignoreMap = arr
    },

    setUp,

    // overwrites specific char keys to update on
    specificKeys: arr => {
      specificMap = arr
    },

    tearDown,

    // attach functions to input and intent "events"
    // funct: function to fire on change
    // eventType: 'input'|'intent'
    registerOnChange: (fn, eventType) => {
      functionList.push({
        fn: fn,
        type: eventType || 'input'
      })
    },

    unRegisterOnChange: fn => {
      const position = objPos(fn)

      if (position || position === 0) {
        functionList.splice(position, 1)
      }
    }
  }
})()
