function Sonar(audioSource, options) {
    
    var _options = {
        containerId: null,
        circleCount: 8
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
        _renderCircleCount,
        _renderScaleCount,
        _circleSpeed,
        _scaleSpeed,
        _avgAmplitude;
    
    var _init = function() {
		
        _setOptions();

        _height = 400;
		_width = 800;
		
        // create canvas
        _paper = Raphael(0, 0, '100%', '100%');
        
        // added this part for scalability when resizing
        _paper.setViewBox(0, 0, _width, _height, true);
		
		_maxRadius = _width / _options.circleCount / 2;
        _maxValue = audioSource.frequencyMaxValue;
        _renderCircleCount = 0;
        _renderScaleCount = 0;
        
        _initCircles();
        
    }
    
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
        
        return chroma.interpolate.bezier([chroma.random().desaturate(), chroma.random().desaturate()]);
        
    }
    
    // create elements for circles to be animated
    var _initCircles = function() {
        
        _scale = _getRandomScale();
        _nextScale = _getRandomScale();
        
        _circles = [];
        leftyCount = 1;
        rightyCount = 1;
        
        // create circles
        for (var i = 0; i < _options.circleCount - 2; i++ ) {
            
            var circle = {};
            
            var x = _width / 2;
            
            if (leftyCount <= rightyCount) {
                
                circle.position = 'left';
                
                if (i > 1)
                    x -= leftyCount * _maxRadius * 2;
                else
                    x -= leftyCount * _maxRadius * 1.3;
                
                leftyCount++;
                
            }
            else {
                
                circle.position = 'right';
                
                if (i > 1)
                    x += rightyCount * _maxRadius * 2;
                else
                    x += rightyCount * _maxRadius * 1.3;
                
                rightyCount++;
                
            }
            
			circle.element = _paper.circle(x, _height / 2, 0);
            circle.element.attr({ 'stroke-width': 0, fill: '#e85f5f', opacity: 0.5 });

            circle.fadeQueue = [];
            
            _circles.push(circle);
            
        }
        
    }
    
    this.draw = function() {
        
        // get frequency intervals
        var data = audioSource.getFrequencyDataBySize(_options.circleCount);
        
        var totalAmplitude = 0;
        
        for (var i = 0; i < _circles.length; i++) {

            var amplitude = data[i] / _maxValue;
            totalAmplitude += amplitude;
            
            var color = _scale(i / _circles.length);
            var nextColor = _nextScale(i / _circles.length);
            var scale = chroma.interpolate.bezier([color, nextColor]);
            var newColor = scale(_renderScaleCount / _scaleSpeed).luminance(1 - amplitude);
            
            var radius = Math.floor(amplitude * _maxRadius);

            _circles[i].element.attr({ r: radius, opacity: amplitude + 0.1, fill: newColor.hex() });
            
            if (_renderCircleCount == 0 && amplitude > 0.4) {
                
                var circle = {
                    opacity: amplitude,
                    radius: radius,
                    amplitude: amplitude
                };
                
                circle.element = _paper.circle(_circles[i].element.attr('cx'), _circles[i].element.attr('cy'), radius);
                circle.element.attr({ 'stroke-width': 2, stroke: newColor.hex(), opacity: amplitude - 0.1 });
                circle.element.toBack();
                
                _circles[i].fadeQueue.push(circle);
                
            }
            
            for (var j = 0; j < _circles[i].fadeQueue.length; j++) {
                
                _circles[i].fadeQueue[j].opacity -= 0.0018;
                _circles[i].fadeQueue[j].radius += _circles[i].fadeQueue[j].amplitude;
                
                _circles[i].fadeQueue[j].element.attr({
                    opacity: _circles[i].fadeQueue[j].opacity,
                    r: _circles[i].fadeQueue[j].radius
                });
                
                if (_circles[i].fadeQueue[j].opacity < 0) {
                    _circles[i].fadeQueue[j].element.remove();
                    _circles[i].fadeQueue.splice(j, 1);
                }
                
            }
            
        }
        
        _avgAmplitude = totalAmplitude / _circles.length;
        _circleSpeed = 60 * _avgAmplitude;
        _scaleSpeed = 240;
          
        if (_circleSpeed < 30)
            _circleSpeed = 30;
        
        _renderCircleCount++;
        _renderScaleCount++;
        
        if (_renderCircleCount > _circleSpeed) {
            _renderCircleCount = 0;
        }
        
        if (_renderScaleCount > _scaleSpeed) {
            _renderScaleCount = 0;
            _scale = _nextScale;
            _nextScale = _getRandomScale();
        }
    
    }
    
    // remove canvas from DOM
    this.destroy = function() {
        
        _paper.remove();
        
    }
    
    _init();
    
}