function SpeakerSonar(audioSource, options) {
    
    // default option values
    var _options = {
        containerId: null,
        circleCount: 8, // has to be a power of 2
        invert: false,
        scaleSpeed: 120,
        circleSpeed: 60
    }
    
    var _self = this,
        _circles,
        _scale,
        _nextScale,
        _maxValue,
		_maxRadius,
		_maxStrokeWidth,
		_height,
		_width,
		_paper,
        _bg,
        _renderScaleCount,
        _renderCircleCount,
        _avgAmplitude,
        _fadeQueue;
    
    // set up instance
    var _init = function() {
		
        _setOptions();
        
        // size is arbitrary and doesn't have to be proportional to window.
        // constant dimensions ensures that the size of the animation is in
        // proportion to the rest of the UI regardless of screen size.
        _height = 400;
		_width = 600;
		
        // create canvas
        if (_options.containerId)
            _paper = Raphael(containerId, '100%', '100%');
        else
            _paper = Raphael(0, 0, '100%', '100%');
        
        // add a bg rectangle
        // big of an uggly one to handle viewport resizing
        _bg = _paper.rect(-1500, -1500, 5000, 5000);
        _bg.attr({ 'stroke-width': 0 });
        
        // added this part for scalability when resizing
        _paper.setViewBox(0, 0, _width, _height, true);
		
		// max radius of combined circles
		_maxRadius = _height < _width ? _height / 2 : _width / 2;
		
		// max stroke width (visible area) of each circle
		_maxStrokeWidth = _maxRadius / _options.circleCount;
        
        // highest possible value of position in frequencyData
        _maxValue = audioSource.frequencyMaxValue;
        
        // this is used to time when to start transitioning to the next color scale
        _renderScaleCount = 0;
        _renderCircleCount = 0;
        
        _initCircles();
        
    }
    
    // override default options if specified by user
    var _setOptions = function() {
        
        if (!options)
            options = {};
        
        for (var key in _options) {
            if (_options.hasOwnProperty(key) && options.hasOwnProperty(key))
                _options[key] = options[key];
        }
        
    }
    
    // returns a random chroma.js color scale
    var _getRandomScale = function() {
        
        return chroma.interpolate.bezier([chroma.random().desaturate(), chroma.random().desaturate(), chroma.random().desaturate()]);
        
    }
    
    // create elements for circles to be animated
    var _initCircles = function() {
        
        _circles = [];
        
        // generate initial color scales; one starting scale and one scale to animate to
        _scale = chroma.interpolate.bezier([chroma('#ffffff'), chroma('#ffffff')]);
        _nextScale = _getRandomScale();
        _fadeQueue = [];
        
        // create circles
        for (var i = 0; i < _options.circleCount; i++ ) {
            
            // centered circle with no radius (radius is set by the draw method)
            // previous radial formula: maxRadius - maxStrokeWidth * i
			var circle = _paper.circle(_width / 2, _height / 2, 0);
            
            circle.attr({ 'stroke-width': 0, fill: '#ffffff' });

            // add circle to array
            _circles.push(circle);
            
        }
        
    }
    
    // update canvas from audioSource data
    this.draw = function() {
        
        // get frequency intervals
        var data = audioSource.getFrequencyDataBySize(_options.circleCount);
        
        var prevCircleRadius = 0;
        var totalAmplitude = 0;
        var newColor;
        
        for (var i = _circles.length-1; i >= 0; i--) {

            // relative amplitude in this frequency interval (0-100)
            var amplitude = Math.floor(prevCircleRadius + (data[i] / _maxValue));
            totalAmplitude += data[i] / _maxValue;
            
            // calculate luminance from amplitude and set constraints
            // luminance is negatively proportional to amplitude for maximum effect
            if (amplitude > 90)
                luminance = 0.10;
            else if (amplitude < 20)
                luminance = 0.8;
            else
                luminance = 1 - amplitude / 100;
            
            // create a scale between this and the next color scale
            var color = _scale(i/_options.circleCount);
            var nextColor = _nextScale(i/_options.circleCount);//i == 0 ? _scale(0) : _scale((i-1)/_options.circleCount);
            var scale = chroma.interpolate.bezier([color, nextColor]);
            
            // ease the transition between the colors (one step every time we render)
            newColor = scale(_renderScaleCount / _options.scaleSpeed).luminance(luminance);
            
            // determine radius
            if (!_options.invert)
                var circleRadius = Math.floor((prevCircleRadius + (data[i] / _maxValue) * _maxStrokeWidth) + (1 / (i + 1) * _maxStrokeWidth / 2));
            else
                var circleRadius = Math.floor((prevCircleRadius + (data[_options.circleCount-1-i] / _maxValue) * _maxStrokeWidth));
            
            prevCircleRadius = circleRadius;
            
            // update circle
            _circles[i].attr({ r: circleRadius, fill: newColor.hex() });
            
        }
        
        // update bg to same color as outermost circle
        if (!_options.invert) {
            _bg.attr('fill', newColor.luminance(0.8).hex());
        }
        else {
            _bg.attr('fill', 'transparent');
        }
        
        _avgAmplitude = totalAmplitude / _circles.length;
        
        console.log(_avgAmplitude);
        
        if (_renderCircleCount == 0 && _avgAmplitude > 0.2) {
            
            var circle = {
                opacity: _avgAmplitude,
                radius: prevCircleRadius,
                amplitude: _avgAmplitude
            };

            circle.element = _paper.circle(_circles[0].attr('cx'), _circles[0].attr('cy'), prevCircleRadius);
            circle.element.attr({ 'stroke-width': 5, stroke: newColor.darken().hex(), opacity: 1 });
            circle.element.toBack();
            _bg.toBack();
            
            _fadeQueue.push(circle);

        }
        
        for (var j = 0; j < _fadeQueue.length; j++) {
                
            _fadeQueue[j].opacity -= 0.001;
            _fadeQueue[j].radius += _fadeQueue[j].amplitude * 2;

            _fadeQueue[j].element.attr({
                opacity: _fadeQueue[j].opacity,
                r: _fadeQueue[j].radius
            });

            if (_fadeQueue[j].opacity < 0) {
                _fadeQueue[j].element.remove();
                _fadeQueue.splice(j, 1);
            }

        }

        _renderScaleCount++;
        _renderCircleCount++;
        
        // init transition to next color scale
        if (_renderScaleCount > _options.scaleSpeed) {
            _renderScaleCount = 0;
            _scale = _nextScale;
            _nextScale = _getRandomScale();
        }
        
        if (_renderCircleCount > _options.circleSpeed) {
            _renderCircleCount = 0;
        }
    
    }
    
    // remove canvas from DOM
    this.destroy = function() {
        
        _circles = [];
        _paper.remove();
        
    }
    
    _init();
    
}