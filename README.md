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
2. Two public parameterless methods; `draw()` and `destroy()`
3. The canvas or svg element that's going to be drawn on should be added to the DOM as soon as the class is instantiated

**`audioSource`** is an instance of SoundCloudAudioAnalyser that delivers audio frequency data to your animation class. Read more about SoundCloudAudioAnalyser and what data you'll have at your disposal below in the API reference.

**`options`** is an object containing properties that affect the behaviour of your animation. Keep in mind that you might want to have a private variable in you class containing default values for these options.

The **`draw()`** method will be called roughly 60 times per second and tells your animation class that it's time to render a new frame. To access the current audio frequency data from your `draw()` method use `audioSource.getFrequencyDataBySize(n)` which returns an array containing `n` number of frequency intervals with an amplitude value for each interval. **`n` has to be a power of two!** Now it's up to you to use the data and make some canvas or svg magic.

The **`destroy()`** method will be called when the user choses to display another animation class. This method has to discard DOM elements and other stuff that your class has created. Avoid memory leaks!

The rest we leave to you. You may add as many private methods as you want to keep your code nice and tidy. You can make use of included libraries such as raphael.js and chroma.js to enhance your animations, but try to keep performance in mind. If you want to include a new library please contact us before doing so.

## Include your animation class in the application
1. Place your animation class in the **javascript/animation** folder
2. Include it with a script tag in **index.html**
3. Add a new object containing info about your class to the animations array in **javascript/animation/classes.js**
4. Done! Try it out by using the animation style view (ctrl + d)

# API Reference
This is an API reference for [SoundCloudAudioAnalyser.js](javascript/SoundCloudAudioAnalyser.js) which is used to quantify frequency data of the currently played track.

**Coming shortly**

# Contact us
Got questions or feedback? You can reach us at:

* Samuel Johansson - samueljohanssonhue@gmail.com
* Lukas Peterson - lukasopeterson@gmail.com
