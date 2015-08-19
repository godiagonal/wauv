// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ Greed.js 1.0 - JavaScript Responsive Grid Rendering Library        │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Author: Samuel Johansson (http://godiagonal.com)                   │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

function Greed(containerId, data, options) {

    var _options = {
        hideIncompleteRow: false,
        trackActive: true,
        trackAnimation: true,
        minSize: 150,
        move: null,
        select: null,
        click: null,
        enter: null,
        objectKeys: {
            image: 'img',
            title: 'title',
            text: 'text'
        }
    }
    
    var _self = this,
        _keyEventsEnabled = true,
        _data,
        _container,
        _fullRowCount,
        _colCount,
        _lastRowColCount,
        _squareSize,
        _squareSizePx,
        _activeId,
        _resizeTimeout,
        _initiated;
    
    var _init = function() {
        
        _container = document.getElementById(containerId);
        _container.classList.add('greed');
        
        _data = data ? data : [];
        
        _setOptions();
        
        _buildGrid();
        
        window.addEventListener('keydown', _keyDown);
        window.addEventListener('keyup', _keyUp);
        window.addEventListener('resize', _resize);
        
        _initiated = true; // prevents the use of hideIncompleteRow when adding objects
        
    }
    
    var _setOptions = function() {
        
        if (!options)
            options = {};
        
        for (var key in _options) {
            
            if (_options.hasOwnProperty(key) && options.hasOwnProperty(key))
                _options[key] = options[key];
            
        }
        
    }
    
    var _buildGrid = function() {
        
        // empty container
        while (_container.firstChild)
            _container.removeChild(_container.firstChild);
        
        // update size based values
        _colCount = 0; // trigger re-calculation of colCount, size etc
        _setDimensions();
        
        // remove "overflowing" squares on last row if hideIncompleteRow is true
        if (_options.hideIncompleteRow && !_initiated && _data.length > _lastRowColCount && _lastRowColCount > 0) {
            
            _data.splice(_data.length - _lastRowColCount, _lastRowColCount);
            _colCount = 0; // trigger re-calculation
            _setDimensions();
            
        }
        
        _squareSizePx = null; // trigger re-calculation of height
        
        for (var i = 0; i < _data.length; i++)
            _addElemFromData(i);
        
        if (_data.length)
            _setActive(1);
        
    }
    
    var _addElemFromData = function(index) {
        
        var elem = _getTemplateElem();

        elem.id = 'greedSquare' + (index + 1);
        elem.setAttribute('greedId', index + 1);
        elem.style.width = _squareSize + '%';

        if (_data[index].hasOwnProperty(_options.objectKeys.image) && _data[index][_options.objectKeys.image])
            elem.getElementsByClassName('greedSquareBg')[0].style.backgroundImage = 'url(' + _data[index][_options.objectKeys.image] + ')';

        if (_data[index].hasOwnProperty(_options.objectKeys.title)) {
            elem.getElementsByClassName('greedSquareTitle')[0].innerHTML = _data[index][_options.objectKeys.title];
            elem.getElementsByClassName('greedSquareTitle')[0].title = _data[index][_options.objectKeys.title];
        }

        if (_data[index].hasOwnProperty(_options.objectKeys.text))
            elem.getElementsByClassName('greedSquareText')[0].innerHTML = _data[index][_options.objectKeys.text];

        elem.addEventListener('click', _click);

        _data[index].greedElem = elem;
        _data[index].greedId = index + 1;
        _container.appendChild(elem);

        // calc height in px to match width. this has to be done after the element is
        // placed in its container since the width is relative to the container width
        if (!_squareSizePx)
            _squareSizePx = Math.floor(elem.clientWidth);

        elem.style.height = _squareSizePx + 'px';
        
    }
    
    var _getTemplateElem = function() {
        
        var elem = document.createElement('div');
            elem.classList.add('greedSquare');
        
        var bgElem = document.createElement('div');
            bgElem.classList.add('greedSquareBg');
        
        var wrapElem = document.createElement('div');
            wrapElem.classList.add('greedSquareWrap');
        
        var title = document.createElement('div');
            title.classList.add('greedSquareTitle');
        
        var text = document.createElement('div');
            text.classList.add('greedSquareText');
        
        elem.appendChild(bgElem);
        elem.appendChild(wrapElem);
        wrapElem.appendChild(title);
        wrapElem.appendChild(text);
        
        return elem.cloneNode(true);
        
    }
    
    // set column count, row count and calculate size of squares according to container width
    var _setDimensions = function() {
        
        var totalWidth = Math.floor(_container.clientWidth);
        
        var newColCount = Math.floor(totalWidth / _options.minSize);
            newColCount = newColCount == 0 ? 1 : newColCount;
        
        if (newColCount != _colCount) {
            
            _colCount = newColCount;
            _fullRowCount = Math.floor(_data.length / _colCount);
            _lastRowColCount = _data.length % _colCount;
            _squareSize = 100 / _colCount;
            
            /*console.log('rows: ' + _fullRowCount);
            console.log('cols: ' + _colCount);
            console.log('last cols: ' + _lastRowColCount);
            console.log('size: ' + _squareSize);*/
            
        }
        
    }
    
    var _resize = function() {
        
        if (_resizeTimeout)
            clearTimeout(_resizeTimeout);
        
        // timeout because we don't want this to fire a million times on resize
        _resizeTimeout = setTimeout(_doResize, 50);
        
    }
    
    var _doResize = function() {
        
        if (_data.length) {

            prevSquareSize = _squareSize.valueOf();

            _setDimensions();

            // only set new width percentage if it has actually changed
            if (prevSquareSize != _squareSize) {

                // calc height in px to match new width
                _data[0].greedElem.style.width = _squareSize + '%';
                _squareSizePx = Math.floor(_data[0].greedElem.clientWidth);

                // update all elems
                for (var i = 0; i < _data.length; i++) {

                    _data[i].greedElem.style.width = _squareSize + '%';
                    _data[i].greedElem.style.height = _squareSizePx + 'px';

                }

            }

            // always update height to match width
            else {

                // calc height in px based on width
                _squareSizePx = Math.floor(_data[0].greedElem.clientWidth);

                // update all elems
                for (var i = 0; i < _data.length; i++)
                    _data[i].greedElem.style.height = _squareSizePx + 'px';

            }
            
        }
        
    }
        
    var _setActive = function(id) {
        
        var elems = _container.getElementsByClassName('activeSelection');
        
        for (var i = 0; i < elems.length; i++)
            elems[i].classList.remove('activeSelection');
        
        _activeId = id;
        _data[id - 1].greedElem.classList.add('activeSelection');
        
    }
    
    var _getActive = function() {
        
        return _data[_activeId - 1];
        
    }
    
    var _trackActive = function() {
        
        if (_data.length) {
            
            var overflow,
                scrollElem = _container;
            
            // find out if there's a wrapper element that has overflow scrolling
            // bubbles up until a scroll element is found or end of document is reached
            while (scrollElem) {
                
                overflow = window.getComputedStyle(scrollElem).getPropertyValue('overflow');
                
                // overflow scrolling element found
                if (overflow != 'visible')
                    break;
                
                scrollElem = scrollElem.parentElement;
                
            }
            
            var minMargin = 50,
                newScrollPosX, newScrollPosY,
                elemPosY, elemPosX,
                viewStartY, viewEndY,
                viewStartX, viewEndX;
            
            // no overflow scrolling, use window as reference
            if (!scrollElem) {
                
                elemPosY = _getElemOffset(_getActive().greedElem).top;
                elemPosX = _getElemOffset(_getActive().greedElem).left;

                viewStartY = (window.pageYOffset || document.documentElement.scrollTop)  - (document.documentElement.clientTop || 0);
                viewEndY = viewStartY + window.innerHeight;

                viewStartX = (window.pageXOffset || document.documentElement.scrollLeft)  - (document.documentElement.clientLeft || 0);
                viewEndX = viewStartX + window.innerWidth;
                
                newScrollPosY = viewStartY;
                newScrollPosX = viewStartX;
                
                // below viewport
                if (elemPosY + _squareSizePx + minMargin > viewEndY)
                    newScrollPosY = elemPosY + _squareSizePx + minMargin - window.innerHeight;

                // above viewport
                else if (elemPosY - minMargin < viewStartY)
                    newScrollPosY = elemPosY - minMargin;

                // right of viewport
                if (elemPosX + _squareSizePx + minMargin > viewEndX)
                    newScrollPosX = elemPosX + _squareSizePx + minMargin - window.innerWidth;

                // left of viewport
                else if (elemPosX - minMargin < viewStartX)
                    newScrollPosX = elemPosX - minMargin;

                // scroll to new position if necessary
                if (_options.trackAnimation)
                    _scrollTo(document.body, { top: newScrollPosY, left: newScrollPosX }, 200);
                
                else
                    window.scrollTo(newScrollPosX, newScrollPosY);

            }
            
            // overflow scrolling
            // "overflow: hidden" is not handled at all since we can't focus on
            // something that's not visible at all
            else if (overflow != 'hidden') {
                
                elemPosY = _getElemRelativeOffset(_getActive().greedElem).top;
                elemPosX = _getElemRelativeOffset(_getActive().greedElem).left;

                viewStartY = scrollElem.scrollTop;
                viewEndY = viewStartY + scrollElem.clientHeight;

                viewStartX = scrollElem.scrollLeft;
                viewEndX = viewStartX + scrollElem.clientWidth;
                
                newScrollPosY = viewStartY;
                newScrollPosX = viewStartX;
                
                // below viewport
                if (elemPosY + _squareSizePx + minMargin > viewEndY)
                    newScrollPosY = elemPosY + _squareSizePx + minMargin - scrollElem.clientHeight;

                // above viewport
                else if (elemPosY - minMargin < viewStartY)
                    newScrollPosY = elemPosY - minMargin;

                // right of viewport
                if (elemPosX + _squareSizePx + minMargin > viewEndX)
                    newScrollPosX = elemPosX + _squareSizePx + minMargin - scrollElem.clientWidth;

                // left of viewport
                else if (elemPosX - minMargin < viewStartX)
                    newScrollPosX = elemPosX - minMargin;

                if (_options.trackAnimation)
                    _scrollTo(scrollElem, { top: newScrollPosY, left: newScrollPosX }, 200);
                
                else {
                    scrollElem.scrollTop = newScrollPosY;
                    scrollElem.scrollLeft = newScrollPosX;
                }
                
            }
            
        }
        
    }

    var _getElemOffset = function(elem) {
        
        var top = 0,
            left = 0;
        
        while (elem) {
            
            top = top + parseInt(elem.offsetTop);
            left = left + parseInt(elem.offsetLeft);
            
            elem = elem.offsetParent;
            
        }
        
        return { top: top, left: left };

    }
    
    var _getElemRelativeOffset = function(elem) {
        
        var childPos = { top: parseInt(elem.offsetTop), left: parseInt(elem.offsetLeft) };
        var parentPos = { top: parseInt(elem.parentElement.offsetTop), left: parseInt(elem.parentElement.offsetLeft) };
        
        var positioning = window.getComputedStyle(elem.parentElement).getPropertyValue('position'),
            childOffset;
        
        // relative and absolute positioning starts offset count from parent element
        if (positioning == 'relative' || positioning == 'absolute') {
            
            childOffset = childPos;
            
        }
        
        // other positioning start offset from top of document
        else {
            
            childOffset = {
                top: childPos.top - parentPos.top,
                left: childPos.left - parentPos.left
            }
            
        }
        
        return childOffset;

    }
    
    var _scrollTo = function(elem, to, duration) {
        
        var startY = elem.scrollTop,
            startX = elem.scrollLeft,
            changeY = to.top - startY,
            changeX = to.left - startX,
            currentTime = 0,
            increment = 20;

        var animateScroll = function() {
            
            currentTime += increment;
            
            var valY = Math.easeInOutQuad(currentTime, startY, changeY, duration);
            var valX = Math.easeInOutQuad(currentTime, startX, changeX, duration);
            
            elem.scrollTop = valY;
            elem.scrollLeft = valX;
            
            if (currentTime < duration)
                setTimeout(animateScroll, increment);
            
        }
        
        animateScroll();
        
    }
    
    var _click = function(e) {
        
        var id = parseInt(e.target.getAttribute('greedId'));
        
        if (!id)
            id = parseInt(e.target.parentElement.getAttribute('greedId'));
        
        if (id) {
            
            var prevId = _activeId;
            
            _setActive(id);
            
            e.preventDefault();
            
            // make sure the new active element is inside the users viewport
            if (_options.trackActive)
                _trackActive();
            
            // trigger "click" event
            if (_options.click)
                _options.click(_getActive());
            
            // trigger "move" event
            if (_options.move && prevId != id)
                _options.move(_getActive());
            
            // trigger "select" event
            if (_options.select)
                _options.select(_getActive());
            
        }
        
    }
    
    var _keyUp = function(e) {
        
        if (_data.length && _keyEventsEnabled) {

            var keyCode = e.which || e.keycode;

            switch (keyCode) {

                case 13: // enter
                    
                    e.preventDefault();
                    
                    // trigger "enter" event
                    if (_options.enter)
                        _options.enter(_getActive());

                    // trigger "select" event
                    if (_options.select)
                        _options.select(_getActive());
                    
                    break;

            }
            
        }
        
    }
    
    var _keyDown = function(e) {
        
        if (_data.length && _keyEventsEnabled) {
        
            var keyCode = e.which || e.keycode,
                moved = true;

            switch (keyCode) {

                case 38: // up
                    _moveUp();
                    break;

                case 40: // down
                    _moveDown();
                    break;

                case 37: // left
                    _moveLeft();
                    break;

                case 39: // right
                    _moveRight();
                    break;

                default:
                    moved = false;
                    break;

            }
            
            if (moved) {
                
                e.preventDefault();
                
                // make sure the new active element is inside the users viewport
                if (_options.trackActive)
                    _trackActive();
                
                // trigger "move" event if specified
                if (_options.move)
                    _options.move(_getActive());

            }

        }
        
    }
    
    var _moveRight = function() {
        
        var id;
        
        // no previously active elem, default to 1
        if (!_activeId)
            id = 1;
        
        // reached right end of full row
        else if (_activeId % _colCount == 0)
            id = _activeId - _colCount + 1;
        
        // reached right end of last (shorter) row
        else if (_activeId == _data.length)
            id = _activeId - _lastRowColCount + 1;
        
        else
            id = _activeId + 1;
        
        _setActive(id);
        
    }
    
    var _moveLeft = function() {
        
        var id;
        
        // no previously active elem, default to 1
        if (!_activeId)
            id = 1;
        
        // reached left end of full row
        else if ((_activeId - 1) % _colCount == 0) {
            
            id = _activeId + _colCount - 1;
            
            // rightmost square (on last row) doesn't exist
            if (id > _data.length)
                id = _data.length;
            
        }
        
        else
            id = _activeId - 1;
        
        _setActive(id);
        
    }
    
    var _moveDown = function() {
        
        var id;
        
        // no previously active elem, default to 1
        if (!_activeId)
            id = 1;
        
        // reached last (short) row
        else if (_activeId > _data.length - _lastRowColCount)
            id = _activeId - _fullRowCount * _colCount;
        
        // reached last full row
        else if (_activeId + _colCount > _data.length)
            id = _activeId - ((_fullRowCount - 1) * _colCount);
        
        else
            id = _activeId + _colCount;
        
        _setActive(id);
        
    }
    
    var _moveUp = function() {
        
        var id;
        
        // no previously active elem, default to 1
        if (!_activeId)
            id = 1;
        
        // reached first row
        else if (_activeId <= _colCount) {
            
            id = _activeId + _fullRowCount * _colCount;
            
            // square on last row doesn't exist
            if (id > _data.length)
                id = id - _colCount;
            
        }
        
        else
            id = _activeId - _colCount;
        
        _setActive(id);
        
    }

    /*** PUBLIC METHODS ***/
    
    this.reload = function(newData) {
        
        if (newData)
            _data = newData;
        
        _initiated = false; // trigger the use of hideIncompleteRow again
        
        _buildGrid();
        
    }
    
    this.empty = function() {
        
        this.reload([]);
        
    }
    
    this.add = function(obj) {
    
        _data.push(obj);
        
        _colCount = 0; // trigger re-calculation of grid
        _setDimensions();
        
        _addElemFromData(_data.length - 1);
        
        // mark as active if it's the first one
        if (_data.length == 1)
            _setActive(1);
    
    }
    
    this.remove = function(id) {
        
        id = parseInt(id);
        
        // remove the object in question
        for (var i = 0; i < _data.length; i++) {
            
            if (i == id - 1)
                _data.splice(i, 1);
            
        }
        
        // we have to rebuild the whole grid since the index numbering is now offset
        _buildGrid();
        
    }
    
    this.select = function(id) {
        
        id = parseInt(id);
        
        if (id <= _data.length) {
            
            _setActive(id);

            if (_options.trackActive)
                _trackActive();

            // trigger "move"
            if (_options.move)
                _options.move(_getActive());

            // trigger "select"
            if (_options.select)
                _options.select(_getActive());
        
        }
        
    }
    
    this.moveTo = function(id) {
        
        id = parseInt(id);
        
        if (id <= _data.length) {
        
            _setActive(id);

            if (_options.trackActive)
                _trackActive();

            // trigger "move"
            if (_options.move)
                _options.move(_getActive());
            
        }
        
    }
    
    this.__defineGetter__('active', function() {
        
        return _getActive();
        
    });
    
    this.__defineGetter__('data', function() {
        
        return _data;
        
    });
    
    this.__defineGetter__('count', function() {
        
        return _data.length;
        
    });
    
    this.__defineGetter__('keyEventsEnabled', function() {
        
        return _keyEventsEnabled;
        
    });
    
    this.__defineSetter__('keyEventsEnabled', function(val) {
        
        if (val)
            _keyEventsEnabled = true;
        else
            _keyEventsEnabled = false;
        
    });
    
    _init();
    
}

//t = current time
//b = start value
//c = change in value
//d = duration
Math.easeInOutQuad = function(t, b, c, d) {
    t /= d/2;
    if (t < 1) return c/2*t*t + b;
    t--;
    return -c/2 * (t*(t-2) - 1) + b;
}
