function CircleVisualiser(audioSource, options) {
    
    var _options = {
        containerId: null,
        circleCount: 8 // has to be a power of 2
    }
    
    var _self = this,
        _circleArr,
        _maxValue,
		_maxRadius,
		_maxStrokeWidth,
		_height,
		_width,
		_paper;
    
    // set up instance
    var init = function() {
		
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
        
        // added this part for scalability when resizing
        _paper.setViewBox(0, 0, _width, _height, true);
		
		// max radius of combined circles
		_maxRadius = _height < _width ? _height / 2 : _width / 2;
		
		// max stroke width (visible area) of each circle
		_maxStrokeWidth = _maxRadius / _options.circleCount;
        
        // highest possible value of position in frequencyData
        _maxValue = audioSource.frequencyMaxValue;
        
        initCircles();
        
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
    
    // create elements for circles to be animated
    var initCircles = function() {
        
        _circleArr = [];
        
        var scale = chroma.scale('RdBu').out('hex');
        
        // create new circles
        for (var i = 0; i < _options.circleCount; i++ ) {
            
            // centered circle with no radius (radius is set by the draw method)
            // previous radial formula: maxRadius - maxStrokeWidth * i
			var circle = _paper.circle(_width / 2, _height / 2, 0);
            
            var color;// = scale(1 / _options.circleCount * i);
			switch (i) {
				case 0:
					color="#633d37";
					break;
				case 1:
					color="#744b45";
					break;
				case 2:
					color="#4e595c";
					break;
				case 3:
					color="#717771";
					break;
				case 4:
					color="#939284";
					break;
				case 5:
					color="#adac9d";
					break;
				case 6:
					color="#e4e2d8";
					break;
				case 7:
					color="#f1efe4";
					break;
			}
            
			circle.attr('fill', color);
            circle.attr({'stroke-width': 0});

            // add circle to array
            _circleArr.push(circle);
            
        }
        
    }
    
    // update canvas from audioSource data
    this.draw = function() {
        
        var data = audioSource.getFrequencyDataBySize(_options.circleCount);
        
        var prevCircleRadius = 0;
        
        for (var i = _circleArr.length-1; i >= 0; i--) {

            // select circle and update its radius
            var circle = _circleArr[i];
            var circleRadius = Math.floor(prevCircleRadius + (data[i] / _maxValue) * _maxStrokeWidth);
            
            prevCircleRadius = circleRadius;
            
            circle.attr({r:circleRadius});
            
        }
    
    }
    
    init();
    
}