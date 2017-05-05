# What Input?

__A global utility for tracking the current input method (mouse, keyboard or touch).__

## What Input is now v5

Now with more information and less opinion!

What Input adds data attributes to the `<html>` tag based on the type of input being used. It also exposes a simple API that can be used for scripting interactions.

### Changes from v4

* __Added:__ A new `data-whatelement` attribute exposes any currently focused DOM element (i.e. `data-whatelement="a"` or `data-whatelement="input[type=text]"`).
* __Added:__ A new `data-whatclasses` attribute exposes any currently focused element's classes as a comma-separated list (i.e. `data-whatclasses="class1,class2"`).
* __Added:__ A new API option to provide a custom array of keycodes that will be ignored (i.e. `whatInput.ignoreKeys([1, 2, 3])`) Default is `16` _shift_, `17` _control_, `18` _alt_, `91` _Windows key / left Apple cmd_, `93` _Windows menu / right Apple cmd_.
* __Changed:__ Typing in form fields is no longer filtered out. The `data-whatinput` attribute immediately reflects the current input. The `data-whatintent` attribute now takes on that role by remembering mouse input prior to typing in or clicking on a form field.
* __Removed:__ `whatInput.types()` API option.
* __Fixed:__ Using mouse modifier keys (`shift`, `control`, `alt`, `cmd`) no longer toggles back to keyboard.

### Changes from v3

* `mousemove` and `pointermove` events no longer affect the `data-whatinput` attribute.
* A new `data-whatintent` attribute now works like v3. This change is intended to separate direct interaction from potential.
* Key logging and the corresponding `whatInput.keys()` API option has been removed because it felt creepy and wasn't very useful.
* Event binding and attributes are now added to the `<html>` tag to eliminate the need to test for `DOMContentLoaded`.
* The `whatInput.set()` API option has been removed.
* A new set of `whatinput-types-[type]` classes are now added as inputs are detected. New classes are added but existing ones remain, creating the same output as what the `whatInput.types()` returns.

## Demo

Check out the demo to see What Input in action.

http://ten1seven.github.io/what-input

## How it works

What Input uses event bubbling on the `<html>` tag to watch for mouse, keyboard and touch events (via `mousedown`, `keydown` and `touchstart`). It then sets or updates a `data-whatinput` attribute.

Where present, Pointer Events are supported, but note that `pen` inputs are remapped to `touch`.

What Input also exposes a tiny API that allows the developer to ask for the current input.

_What Input does not make assumptions about the input environment before the page is directly interacted with._ However, the `mousemove` and `pointermove` events are used to set a `data-whatintent="mouse"` attribute to indicate that a mouse is being used _indirectly_.

### Interacting with Forms

Since interacting with a form requires use of the keyboard, What Input uses the `data-whatintent` attribute to display a "buffered" version of input events while form `<input>`s and `<textarea>`s are being interacted with, preserving the last detected input type.

## Installing

Download the file directly...

or install via Yarn...

```shell
yarn add what-input
```

or NPM...

```shell
npm install what-input
```

or Bower...

```shell
bower install what-input
```

## Usage

Include the script directly in your project.

```html
<script src="assets/scripts/what-input.js"></script>
```

Or require with a script loader.

```javascript
import 'what-input'

// or

import whatInput from 'what-input'

// or

require('what-input')

// or

var whatInput = require('what-input')

// or

requirejs.config({
  paths: {
    whatInput: 'path/to/what-input'
  }
})

require(['whatInput'], function() {})
```

What Input will start doing its thing while you do yours.

### Basic Styling

```css
/*
 * only suppress the focus ring once what-input has successfully started
 */

/* suppress focus ring on buttons when clicked */
[data-whatinput="mouse"] {
  button {
    outline: none;
  }
}

/* suppress focus ring on form controls for mouse users */
[data-whatintent="mouse"] {
  input,
  select,
  textarea {
    outline: none;
  }
}
```
**Note:** If you remove outlines with `outline: none;`, be sure to provide clear visual `:focus` styles so the user can see which element they are on at any time for greater accessibility. Visit [W3C's WCAG 2.0 2.4.7 Guideline](https://www.w3.org/TR/UNDERSTANDING-WCAG20/navigation-mechanisms-focus-visible.html) to learn more.

### Scripting

#### Current Input

Ask What Input what the current input method is. This works best if asked after the events What Input is bound to (`mousedown`, `keydown` and `touchstart`).

```javascript
whatInput.ask() // returns `mouse`, `keyboard` or `touch`

myButton.addEventListener('click', () => {
  if (whatInput.ask() === 'mouse') {
    // do mousy things
  } else if (whatInput.ask() === 'keyboard') {
    // do keyboard things
  }
})
```

If it's necessary to know if `mousemove` is being used, use the `'intent'` option. For example:

```javascript

/*
 * nothing has happened but the mouse has moved
 */

whatInput.ask() // returns `initial` because the page has not been directly interacted with
whatInput.ask('intent') // returns `mouse` because mouse movement was detected

/*
 * the keyboard has been used, then the mouse was moved
 */

whatInput.ask() // returns `keyboard` because the keyboard was the last direct page interaction
whatInput.ask('intent') // returns `mouse` because mouse movement was the most recent action detected
```

Set a custom array of keycodes that will be ignored when pressed.

```javascript
whatInput.ignoreKeys([1, 2, 3])
```

## Compatibility

What Input works in all modern browsers. For compatibility with IE8, polyfills are required for:

* addEventListener
* IndexOf

Add your own, or grab the bundle included here.

```html
<!--[if lte IE 8]>
  <script src="lte-IE8.js"></script>
<![endif]-->
```

## Acknowledgments

Special thanks to [Viget](http://viget.com/) for their encouragement and commitment to open source projects. Visit [code.viget.com](http://code.viget.com/) to see more projects from [Viget](http://viget.com).

Thanks to [mAAdhaTTah](https://github.com/mAAdhaTTah) for the initial conversion to Webpack.

What Input is written and maintained by [@ten1seven](https://github.com/ten1seven).

## License

What Input is freely available under the [MIT License](http://opensource.org/licenses/MIT).
