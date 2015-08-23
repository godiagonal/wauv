function SoundCloudAudioAnalyser(audioElementId, options) {
    
    // default option values
    var _options = {
        fftSize: 128, // powers of 2, minumum is 32
        smoothingTimeConstant: 0.95, // range 0-1
        clientId: '',
        redirectUri: '',
        error: null,
        success: null
    }
    
    var _self = this,
        _ctx,
		_audioContext = window.AudioContext || window.webkitAudioContext,
        _audio,
        _audioSrc,
        _analyser,
        _frequencyData,
        _frequencyDataBySize,
        _frequencyMaxValue,
        _isReady = false,
        _currentTrack;
	
    // set up instance
    var _init = function() {
        
        // try to override default options
        _setOptions();
        
        // create audio context and link audio element
        _ctx = new _audioContext();
        _audio = document.getElementById(audioElementId);
        _audio.crossOrigin = 'anonymous'; // fix for chrome v42, 2015-04-21
        _audioSrc = _ctx.createMediaElementSource(_audio);

        // create analyser and link to audio source
        _analyser = _ctx.createAnalyser();
        _audioSrc.connect(_analyser);

        // connect analyser to sound ouput (no sound without this)
        _analyser.connect(_ctx.destination);

        // configure the analysers fftSize (sample rate)
        // value has to be a power of 2, default is 2048
        if (_options.fftSize % 32 == 0)
            _analyser.fftSize = _options.fftSize;
        
        // smooth values for animation, has to be a value between 0 and 1
        if (_options.smoothingTimeConstant > 0 && _options.smoothingTimeConstant < 1)
            _analyser.smoothingTimeConstant = _options.smoothingTimeConstant;

        // create the array to contain the data from the analyser with approriate size
        // frequencyBinCount tells you how many values you'll receive from the analyser
        // frequencyBinCount = fftSize / 2
        _frequencyData = new Uint8Array(_analyser.frequencyBinCount);
        
        // highest possible value of item in frequencyData
        // this is always 255 and should not be changed
        _frequencyMaxValue = 255;
        
        // connect to soundcloud
        SC.initialize({
            client_id: _options.clientId,
            redirect_uri: _options.redirectUri
        });
        
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
    
    // "unloads" the track (makes it unplayable)
    // also fires errorCallback to show errors in the interface
    var _handleError = function(msg, stop) {
        
        if (stop) {
            _audio.setAttribute('src', '');
            _isReady = false;
        }

        if (_options.error)
            _options.error({ msg: msg });
        
    }
    
    /*** PUBLIC METHODS ***/
    
    // sets the audio source from a track url by the following steps:
    // 1. fire an ajax request to soundcloud api and get back the track info
    // 2. call _setSourceFromUrlCallback to handle the response and extract track id
    // 3. _setSourceFromUrlCallback then sends track id to setSourceFromId
    // setSourceFromUrl -> setSourceFromUrlCallback -> setSourceFromId
    this.setSourceFromUrl = function(trackUrl) {
		
        var oReq = new XMLHttpRequest();
            oReq.onload = _setSourceFromUrlCallback;
            oReq.open('get', 'https://api.soundcloud.com/resolve.json?url=' + trackUrl + '&client_id=' + _options.clientId, true);
            oReq.send();
        
    }
    
    // callback for handling the response from soundcloud api
    // sends back an error if no track was found
    var _setSourceFromUrlCallback = function() {
        
        var track = JSON.parse(this.responseText);
        
        // track not found
        if (track.errors || !track.id)
            _handleError('Track not found', true);
            
        else
            _self.setSourceFromId(track.id);
        
    }
        
    // sets the audio source from a soundcloud track id
    // fires successCallback if the track is loaded
    // otherwise errorCallback is fired
    this.setSourceFromId = function(trackId) {
        
        SC.get('/tracks/' + trackId, function(track) {
            
            //console.log(event.srcElement.getAllResponseHeaders());
            
            // track not found
            if (track.errors)
                _handleError('Track not found', true);
            
            // stream not allowed on this track
            else if (!track.streamable)
                _handleError ('This track is not streamable due to uploader restrictions', true);
            
            else {
                
                _audio.setAttribute('src', track.uri + '/stream?client_id=' + _options.clientId);
                _isReady = true;
                
                // get artist pic if no artwork is defined
                // make sure we don't get the "default avatar", it's uggly
                track.image = track.artwork_url ? track.artwork_url : track.user.avatar_url;
                track.image = track.image.indexOf('default_avatar') == -1 ? track.image : null;

                _currentTrack = track;

                if (_options.success)
                    _options.success(_currentTrack);
                
            }
            
        });
        
    }
    
    // search by calling the soundcloud api with keyword
    // send results to callback function
    this.getTracks = function(keyword, callback) {
        
        SC.get('/tracks', { q: keyword, limit: 40 }, function(tracks) {
            
            // if we got nothing (null) the request failed
            if (tracks) {
            
                // we need to do some modifications to the array before we send it
                // back for rendering
                for (var i = 0; i < tracks.length; i++) {

                    // remove non-streamable tracks
                    if (!tracks[i].streamable) {
                        tracks.splice(i, 1); // remove it
                        i--; // step back to ensure we don't skip an index
                    }

                    else {

                        // get artist pic if no artwork is defined
                        // make sure we don't get the "default avatar", it's uggly
                        // modify url to point to a higher resolution image
                        tracks[i].image = tracks[i].artwork_url ? tracks[i].artwork_url : tracks[i].user.avatar_url;
                        tracks[i].image = tracks[i].image.indexOf('default_avatar') == -1 ? tracks[i].image : null ;
                        tracks[i].image = tracks[i].image ? tracks[i].image.replace('large', 't300x300') : null;

                        // copy artist name to first "layer" in the object
                        // because Greed.js can't handle nested properties
                        tracks[i].artist = tracks[i].user.username;

                    }

                }

                // now we're ready to send the tracks to the callback function
                callback(tracks);
            }
            
            else
                _handleError('Unable to access the SoundCloud service, please try again later', false);
            
        });
            
    }
    
    // play track
    this.play = function() {
        if (_isReady) {
            _audio.play();
            return true;
        }
        else
            return false;
    }
    
    // pause track
    this.pause = function() {
        _audio.pause();
    }
    
    // validate a soundcloud url
    this.validUrl = function(text) {

        var httpsAddress = 'https://soundcloud.com/',
            httpAddress = 'http://soundcloud.com/',
            isUrl = false;

        if (text.substr(0,22) == httpAddress || text.substr(0,23) == httpsAddress)
            isUrl = true;

        return isUrl;

    }
    
    // returns array with frequency data that can be used for animations
    this.getFrequencyData = function() {
        
        // refresh values
        _analyser.getByteFrequencyData(_frequencyData);
        
        return _frequencyData;
        
    }
    
    // same as getFrequencyData but with optional size
    this.getFrequencyDataBySize = function(size) {
        
        // update the frequency data to current values
        _analyser.getByteFrequencyData(_frequencyData);
        
        // array for avaraged values to be sent back
        _frequencyDataBySize = [];
        
        // what to divide by to get the desired size
        var divisor = _analyser.frequencyBinCount / size;
        
        // make avarage values of the original values so that it fits the desired size
        for (var i = 0; i < _analyser.frequencyBinCount; i += divisor) {
            
            var avg = 0;
            
            for (var x = i; x < i + divisor; x++)
                avg += _frequencyData[x];
                
            avg = avg / divisor;
            
            _frequencyDataBySize.push(avg);
            
        }
        
        return _frequencyDataBySize;
        
    }
    
    /*** PUBLIC PROPERTIES ***/
    
    // fftSize
    
    this.__defineGetter__('fftSize', function() {
        return _analyser.fftSize;
    });
    
    this.__defineSetter__('fftSize', function(val) {
        if (val % 32 == 0) {
            _analyser.fftSize = val;
            _frequencyData = new Uint8Array(_analyser.frequencyBinCount);
        }
    });
    
    // smoothingTimeConstant
    
    this.__defineGetter__('smoothingTimeConstant', function() {
        return _analyser.smoothingTimeConstant;
    });
    
    this.__defineSetter__('smoothingTimeConstant', function(val) {
        if (val > 0 && val < 1)
            _analyser.smoothingTimeConstant = val;
    });
    
    // frequencyMaxValue
    
    this.__defineGetter__('frequencyMaxValue', function() {
        return _frequencyMaxValue;
    });
    
    // frequencyBinCount
    
    this.__defineGetter__('frequencyBinCount', function() {
        return _analyser.frequencyBinCount;
    });
    
    // currentTrack
    
    this.__defineGetter__('currentTrack', function() {
        return _currentTrack;
    });
    
    _init();
    
}