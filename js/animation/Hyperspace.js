function Hyperspace(audioSource, options) {
    
    var _options = {
        containerId: null,
        squareCount: 16,
        squareSpeed: 1,
        colorSpeed: 120
    }
    
    var _self = this,
        _squares,
        _colorScale,
        _nextColorScale,
        _maxValue,
		_height,
		_width,
		_paper,
        _renderColorCount,
        _renderSquareCount,
        _squareIndex;
    
    var _init = function() {
		
        _setOptions();

        _height = 400;
		_width = 800;
		
        _paper = Raphael(0, 0, '100%', '100%');
        _paper.setViewBox(0, 0, _width, _height, true);
        
        _maxValue = audioSource.frequencyMaxValue;
        _renderColorCount = 0;
        _renderSquareCount = 0;
        _squareIndex = 0;
        
        _colorScale = _getRandomColorScale();
        _nextColorScale = _getRandomColorScale();
        
        _squares = [];
        
    }
    
    var _setOptions = function() {
        
        if (!options)
            options = {};
        
        for (var key in _options) {
            if (_options.hasOwnProperty(key) && options.hasOwnProperty(key))
                _options[key] = options[key];
        }
        
    }
    
    var _getRandomColorScale = function() {
        
        return chroma.interpolate.bezier([chroma.random().desaturate(), chroma.random().desaturate()]);
        
    }
    
    this.draw = function() {
        
        var data = audioSource.getFrequencyDataBySize(_options.squareCount);
        
        var totalAmplitude = 0;
        
        for (var i = 0; i < data.length; i++) {
            totalAmplitude += data[i] / _maxValue;
        }
        
        var avgAmplitude = totalAmplitude / data.length;
        var squareSpeed = _options.squareSpeed / avgAmplitude * 2;
        
        if (_renderSquareCount > squareSpeed) {
            _renderSquareCount = 0;
        }
        
        if (_renderColorCount > _options.colorSpeed) {
            _renderColorCount = 0;
            _colorScale = _nextColorScale;
            _nextColorScale = _getRandomColorScale();
        }
        
        // add new elements
        if (_renderSquareCount == 0) {
            
            // skip zero values
            while (data[_squareIndex] == 0 && _squareIndex < _options.squareCount - 1) {
                _squareIndex++;
            }
            
            var amplitude = data[_squareIndex] / _maxValue;

            var color = _colorScale(_squareIndex / _options.squareCount);
            var nextColor = _nextColorScale(_squareIndex / _options.squareCount);
            var scale = chroma.interpolate.bezier([color, nextColor]);
            var newColor = scale(_renderColorCount / _options.colorSpeed);

            var square = {
                opacity: amplitude,
                width: 0,
                amplitude: amplitude,
                rotation: Math.floor(_squareIndex * 90 / _options.squareCount * 2)
            };

            square.element = _paper.rect(_width / 2, _height / 2, square.width, square.width);
            square.element.attr({
                'stroke-width': 1,
                stroke: newColor.hex(),
                opacity: square.opacity
            });
            square.element.transform('r' + square.rotation);

            _squares.push(square);
            
            _squareIndex++;
            
            if (_squareIndex >= _options.squareCount)
                _squareIndex = 0;
            
        }
        
        // update currently existing elements
        for (var i = 0; i < _squares.length; i++) {

            _squares[i].opacity -= 0.002;
            _squares[i].width += _squares[i].amplitude * 2;

            _squares[i].element.attr({
                opacity: _squares[i].opacity,
                width: _squares[i].width,
                height: _squares[i].width,
                x: _width / 2 - _squares[i].width / 2,
                y: _height / 2 - _squares[i].width / 2,
            });

            if (_squares[i].opacity < 0) {
                _squares[i].element.remove();
                _squares.splice(i, 1);
            }

        }
        
        _renderSquareCount++;
        _renderColorCount++;
    
    }
    
    this.destroy = function() {
        
        _squares = [];
        _paper.remove();
        
    }
    
    _init();
    
}