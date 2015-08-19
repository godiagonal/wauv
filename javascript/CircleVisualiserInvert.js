function CircleVisualiserInvert(audioSource, circleCount) {
    
    var self = this;
    
    var circleArr=[],
        count,
        height,
        maxValue,
		maxRadius,
		maxStrokeWidth,
		height,
		width,
		paper;
    
    // set up instance
    var init = function() {
		audioSource.setFftSize(circleCount*4);
        height = window.innerHeight;
		width = window.innerWidth;
		paper = Raphael(0, 0, width, height);
		
		//maxRadius of combined circles
		maxRadius = height < width ? height/2 : width/2;
		
		//stroke width on circles
		maxStrokeWidth = maxRadius/circleCount;
        // highest possible value of position in frequencyData
        maxValue = audioSource.getFrequencyMaxValue();
        
        initCircles();
        
    }
    
    // create elements for circle to be animated
    var initCircles = function() {
        
        // create new circles
        for (var i = 0; i < circleCount; i++ ){
			var circle = paper.circle(width/2, height/2, maxRadius - maxStrokeWidth * i);
			var color;
			switch(i){
				case 0:
					color="#633d37";
					break;
				case 1:
					color="#825049";
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
			circle.attr("fill", color);

            // add circle to array
            circleArr.push(circle);	
        }
        
    }
    
    // update canvas from audioSource data
    this.draw = function() {
        
        var data = audioSource.getFrequencyDataByHalf();
        var prevCircleRadius = 0;
        for (var i = circleArr.length-1 ; i >= 0; i--) {

            // select circle and update its radius
            var circle = circleArr[i];
            var circleRadius = prevCircleRadius + (data[7-i] / maxValue) * maxStrokeWidth;
            prevCircleRadius = circleRadius;
			circle.attr({r:circleRadius});
        }
    
    }
    
    init();
    
}