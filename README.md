# wauv - web audio visualiser
Audio visualisation project using the Web Audio and SoundCloud API. Visit the site at [wauv.it](http://wauv.it).

# Contribute
If you're a developer and feel like making your own visualisations we welcome you to fork the project and give it a go! All contributions are appreciated.

1. Fork the project
2. Create an animation class
3. Include your animation class in the application
4. Create a pull request

## Create an animation class
Please use [Speaker.js](javascript/animation/Speaker.js) as a reference and guideline for constructing your own animation classes.

Your animation class should focus solely on one task; rendering graphics based on audio data. How you want to visualise the music is up to you! The audio is streamed from SoundCloud and turned into quantitative data through an audio analyser class; [SoundCloudAudioAnalyser.js](javascript/SoundCloudAudioAnalyser.js), API reference below.

Currently the following libraries are included and at your disposal:
* three.js (3D rendering)
* raphael.js (simplified svg rendering)
* chroma.js (easy handling of colors and color scales)

If you want to add another library please let us know.

### Requirements
The following requirements have to be met for your animation class to work correctly:

1. A constructor that takes two (or possibly one) arguments; `audioSource` and `options` (not required but recommended)
2. Two public parameterless methods; `draw` and `destroy`
3. The canvas or svg element that's going to be drawn on should be added to the DOM as soon as the class is instantiated

**`audioSource`** is an instance of SoundCloudAudioAnalyser that delivers audio frequency data to your animation class. Read more about SoundCloudAudioAnalyser and what data you'll have at your disposal below in the API reference.

**`options`** is an object containing properties that affect the behaviour of your animation. Keep in mind that you might want to have a private variable in you class containing default values for these options.

The **`draw`** method will be called roughly 60 times per second and tells your animation class that it's time to render a new frame. To access the current audio frequency data from your `draw()` method use `audioSource.getFrequencyDataBySize(n)` which returns an array containing `n` number of frequency intervals with an amplitude value for each interval. **`n` has to be a power of two!** Now it's up to you to use the data and make some canvas or svg magic.

The **`destroy`** method will be called when the user choses to display another animation class. This method has to discard DOM elements and other stuff that your class has created. Avoid memory leaks!

To summarize:
```javascript
function MyAnimation(audioSource, options) {
  
  // Everything in your animation class goes here
  
  var _init = function() {
    // Create canvas or svg and add to the DOM
    // Setup options with default values and do other initiation stuff
  }
  
  this.draw = function() {
    // Do animation stuff
  }
  
  this.destroy = function() {
    // Do clean-up stuff
  }
  
  _init();
  
}

```

The rest we leave to you. You may add as many private methods as you want to keep your code nice and tidy. You can make use of included libraries such as raphael.js and chroma.js to enhance your animations, but try to keep performance in mind. If you want to include a new library please contact us before doing so.

## Include your animation class in the application
1. Place your animation class in the **javascript/animation** folder
2. Include it with a script tag in **index.html**
3. Add a new object containing info about your class to the animations array in **javascript/animation/classes.js**
4. Done! Try it out by using the animation style view (ctrl + d)

# API Reference
This is an API reference for [SoundCloudAudioAnalyser.js](javascript/SoundCloudAudioAnalyser.js) which is used to quantify frequency data of the currently played track.

## getFrequencyData()
Returns array with quantified frequency data that can be used for animating. Every item in the array corresponds to an interval of frequencies (e.g. 20-100 Hz) and has a value between 0 and 255 (may vary, see `frequencyMaxValue`) which represents the avarage amplitude in that interval.
```javascript
var data = this.getFrequencyData();

for (var i = 0; i < data.length; i++) {
  // This will give you an amplitude value between 0 and 255
  console.log(data[i]);
}
```

## getFrequencyDataBySize(size)
Same as `getFrequencyData()` but with custom size. The size has to be a power of two for now.
```javascript
// This array will contain 8 items with amplitude values
var data = audioSource.getFrequencyDataBySize(8);
```

## frequencyMaxValue
**Read only.** The highest possible value of item in frequency data. This is normally 255, but may be changed in the future to provide more accurate amplitude readings.
```javascript
var maxValue = audioSource.frequencyMaxValue;
var data = audioSource.getFrequencyDataBySize(8);

for (var i = 0; i < data.length; i++) {
    // This will give you a amplitude value between 0 and 1 which you can use in your animations
    var amplitude = data[i] / maxValue;
    console.log(amplitude);
}
```

## smoothingTimeConstant
The degree of smoothing over time that should be applied to values returned by `getFrequencyData()` and `getFrequencyDataBySize(size)`. The value may range from 0 to 1 and the default value is 0.95. Higher values means smoother transitions between low and high amplitude values, vice-versa.
```javascript
audioSource.smoothingTimeConstant = 0.95;
```

## fftSize
The FFT size to use when analysing audio, see https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/fftSize. The value has to be a power of two and at least 32. Default is 128.
```javascript
audioSource.fftSize = 128;
```

## frequencyBinCount
**Read only.** The number of items in the array returned by `getFrequencyData()` and `getFrequencyDataBySize(size)`. This is always fftSize divided by two.
```javascript
var count = audioSource.frequencyBinCount;
```

## currentTrack
Object containing info about the currently playing track. See https://developers.soundcloud.com/docs/api/reference#tracks.
```javascript
var track = audioSource.currentTrack;

console.log('Now playing ' + track.title + ' by ' + track.user.username);
```


# Contact us
Got questions or feedback? You can reach us at:

* Samuel Johansson - samueljohanssonhue@gmail.com
* Lukas Peterson - lukasopeterson@gmail.com
