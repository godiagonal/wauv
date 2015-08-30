function Bars(audioSource, barCount, containerElementId) {
    
    var self = this;
    
    var barsElem,
        barsArr,
        width,
        barWidth,
        height,
        maxValue;
    
    // set up instance
    var init = function() {
        
        barsElem = document.getElementById(containerElementId);

        // total width of all bars
        width = barsElem.clientWidth;

        // calculated width of each bar
        barWidth = (width/barCount) >> 0;

        // maximum height of bars
        height = barsElem.clientHeight;

        // highest possible value of position in frequencyData
        maxValue = audioSource.getFrequencyMaxValue();
        
        initBars();
        
    }
    
    // create elements for bars to be animated
    // also removes previous bars if they exist
    var initBars = function() {
        
        // empty array for holding bar elements
        barsArr = [];
        
        // empty container element (in case it contains child nodes)
        while (barsElem.firstChild) {
            barsElem.removeChild(barsElem.firstChild);
        }
        
        // create new bars
        for (var i = 0; i < barCount; i++ ){

            // create and style bar element
            var bar = document.createElement('div');
            bar.classList.add('bar');
            bar.style.width = barWidth + 'px';
            bar.style.left = (barWidth * i) + 'px';

            // add bar element to page and array
            barsArr.push(bar);
            barsElem.appendChild(bar);

        }
        
    }
    
    // update canvas from audioSource data
    this.draw = function() {
        
        var data = audioSource.getFrequencyDataBySize(barCount);
        
        for (var i = 0; i < barsArr.length; i++) {

            // select bar and update its height
            var bar = barsArr[i];
            bar.style.height = ( ( data[i] / maxValue ) * height + 'px');

            // just to show that there are "zero values" in the frequencyData
            if (data[i] == 0)
                bar.style.height = '2px';

        }
    
    }
    
    init();
    
}