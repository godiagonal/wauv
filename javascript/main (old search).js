var animFrame,
    audioSource,
    circleCanvas,
	barCanvas,
    initiated = false,
    searchTimeout,
	resultContainer,
    activeResult,
    keywordElem,
    tempKeyword,
    searchFieldElem,
    smallTitleElem,
    notSupportedElem,
	isPlaying= false,
    searchGrid;

$(function() {
    
    // before we do anything, check if the browser is supported
    if (!isBrowserCompatible()) {
        $('#searchField').hide();
        $('#browserNotSupported').show()
        return;
    }
    
    // create a soundcloud audio source
    audioSource = new SoundCloudAudioSource(
                    'track',
                    128,
                    '871fec88c262d653f6230c6ebe6e4f7b',
                    '',
                    handleError,
                    setTrackInfo
                );
    
    // create a canvas to animate on
    circleCanvas = new CircleVisualiser(audioSource, 8);
	barCanvas = new BarVisualiser(audioSource, 64, 'bars');
    
    $('#track').on('play', playAudio);
    $('#track').on('pause', pauseAudio);
    $('#btnSearch').on('click', setAudio);
	$('#txtSearch').on('keyup', searchEvents);
    $('.overlayPage .closeButton').on('click', showControls);
    $('.modal .closeButton').on('click', hideModal);
    $('#btnShowTrackSearch').on('click', function() { showOverlayPage('#trackSearch') });
    $('#btnShowAnimationSettings').on('click', function() { showOverlayPage('#animationSettings') });
    $('#btnShowAbout').on('click', function() { showOverlayPage('#about') });
    $('#btnShare').on('click', shareTrack);
    $('#txtShare').on('focus', selectText);
    $('#btnFeedbackSubmit').on('click', sendFeedback);
	$(window).on('keyup', audioEvents);
    $(window).on('keydown', displayEvents);
    
    resultContainer = $('#resultContainer');
    keywordElem =  $('#txtSearch');
	
    // check for track info in url
    checkHash();
    
    // init tooltips
    $('.tooltip').tooltipster({
        position: 'right'
    });
    
});

// check if browser is valid, for now this is only true for chrome
var isBrowserCompatible = function() {
    
    return bowser.chrome;
    
}

/* ----------- START track search functionality ----------- */

// handle different key press events for search functionality
var searchEvents = function(e) {
    
	var keyword = $(this).val();
	var keyCode = e.which || e.keycode;
	
    // enable step through results with up/down arrows
	if (keyCode == 40 || keyCode == 38) {
		
        // check that resultContainer is not empty
		if($.trim(resultContainer.html()))
			setActiveResultFromKey(keyCode);
        
	}
	
    // handle pasted links (only if enter is pressed)
	else if (audioSource.validUrl(keyword)) {
        
		if (keyCode == 13)
			setAudio(keyword);
        
	}
    
    // do search if the input text is long enough 
	else if (keyword.length > 2) {
        
        // enter
		if (keyCode == 13) {
            
            // play active track from result if there is one selected
			if (activeResult != null)
				setAudioFromActiveResult();
            
            // do search 
			else {
                
                keywordElem.addClass('loading');
                
                clearTimeout(searchTimeout);
				search();
                
            }
			
		}
        
        // prevent non-character keys (esc, ctrl etc) from firing a search
		else if (tempKeyword != keyword) {
            
            keywordElem.addClass('loading');
			
            // wait a short while before searching to avoid millions
            // of ajax calls while the user is typing
            clearTimeout(searchTimeout);
			searchTimeout = setTimeout(search, 500);
            
            tempKeyword = keyword;
            
		}			
		
	}
    
    // input text is too short to search
	else {
        
        keywordElem.removeClass('loading');
        
        // clear results and stop current search
        clearTimeout(searchTimeout);
		resetResults();
        
        tempKeyword = '';
        
	}
    
}

// search by calling the audio source api with keyword
var search = function() {
    
    // hide title and slide search field to top
    initSearchArea();
    
    audioSource.getTracks(keywordElem.val(), showResults);
    
}

// add results of search() to the DOM
var showResults = function(tracks) {

    // reset previous results
    resultContainer.css('opacity', 0);
    resetResults();
    
    var trackCount = 0;

    // loop to make a div out of every object in the tracks array
    for (var i = 0; i < tracks.length; i++) {

        if (tracks[i].streamable) {

            // create new div element
            // add href & class attributes to the div
            // bind click event to play track
            // bind hover event to change selected element
            // append the new div to DOM
            $(document.createElement('div'))
                .attr('href', tracks[i].permalink_url)
                .addClass('searchResult')
                .append(tracks[i].title)
                .on('click', function() {
                    activeResult = $(this);
                    setAudioFromActiveResult();
                })
                .on('mouseover', setActiveResultFromHover)
                .appendTo(resultContainer);

            trackCount++;

        }

    }

    // mark first div as selected if the results aren't empty
    if (trackCount > 0)
        setActiveResultFromKey();
    
    // otherwise show a message
    else {
        
        $(document.createElement('div'))
            .addClass('notFound')
            .append('No tracks found, try another search phrase')
            .appendTo(resultContainer);
        
    }

    // show results with animation
    resultContainer.css('opacity', 1);
    
    // let the loading icon remain for a while to avoid flicker
    setTimeout(function(){
        keywordElem.removeClass('loading');
    }, 300);
    
}

// empty the result div and clear active element
var resetResults = function() {
    
	resultContainer.empty();
	activeResult = null;
    
}

// set selected class to hovered result element
var setActiveResultFromHover = function() {
    
    activeResult = $(this);
    
	$('.searchResult.selected').removeClass('selected');
	activeResult.addClass('selected');
    
}

// set selected class to next/prev/first result element
var setActiveResultFromKey = function(keyCode) {
	
    var tempActiveResult;
    
	// arrowdown
	if (keyCode == 40) {
        
        // prevent steping below last element
        if (!activeResult.is(':last-child'))
            activeResult = activeResult.removeClass('selected').next();
        
    }
    
	// arrowup
	else if (keyCode == 38) {
        
        // prevent steping above first element
        if (!activeResult.is(':first-child'))
            activeResult = activeResult.removeClass('selected').prev();
        
    }
    
    // special case to select the first div when a search has finished
	else
		activeResult = $('.searchResult').first('div');
    
	activeResult.addClass('selected');
    
}

/* ----------- END track search functionality ----------- */

/* ----------- START track selection functionality ----------- */

// play track from url if artist/track is provided after # (hashtag)
var checkHash = function() {
    
    if (location.hash.length) {
        var url = 'https://soundcloud.com/' + location.hash.substr(1);
        setAudio(url);
    }
    
}

// set audio source from active result element
var setAudioFromActiveResult = function() {
    
	var url = activeResult.attr('href');	
	setAudio(url);
    
}

// set audio source from url
var setAudio = function(url) {
    
    audioSource.setSourceFromUrl(url);
    
    // clean up
	resetResults();
	keywordElem.val('');
    
}

/* ----------- END track selection functionality ----------- */

/* ----------- START track info functionality ----------- */

var truncateString = function(string, maxStringLength){
		
	if (string.length > maxStringLength)
		string = string.substr(0, maxStringLength).concat('...');
    
	return string;
    
}

// update track info from audio source and play audio
var setTrackInfo = function() {
    
    var track = audioSource.getTrackInfo();
    
	var title = truncateString(track.title, 38);
	var username = truncateString(track.user.username, 45);
    
    document.getElementById('artistLink').innerHTML = username;
    document.getElementById('artistLink').title = track.user.username;
    document.getElementById('artistLink').href = track.user.permalink_url;
    
    document.getElementById('trackLink').innerHTML = title;
    document.getElementById('trackLink').title = track.title;
    document.getElementById('trackLink').href = track.permalink_url;
    
    document.getElementById('trackArt').style.backgroundImage = 'url(' + track.artwork_url + ')';
    
    // update hash part of url to create a shareable link
    location.hash = '#' + track.user.permalink + '/' + track.permalink;
    
    showControls();
    playAudio();
    
}

// general method for handling errors
var handleError = function(obj) {
    
    alert(obj.msg);
    
}

/* ----------- END track info functionality ----------- */

/* ----------- START audio controls functionality ----------- */

// handle key events for audio playback
var audioEvents = function(e) {

    var keyCode = e.which || e.keycode;

    // press space to play and pause
    if (keyCode == 32 && $('#controls').is(':visible')) {
        if (isPlaying)
            pauseAudio();
        else
            playAudio();
    }

}

// start playing or resume playing track
var playAudio = function(e) {
    
    if (audioSource.play()) {
		isPlaying = true;
        renderFrame();
    }
    else
        handleError({ msg: 'No track selected' });
    
}

// pause track
var pauseAudio = function() {
    
    audioSource.pause();
    isPlaying = false;
    
    // stop rendering
    if (animFrame) {
        
        // use timeout to let the animations finish
        setTimeout(function() {
            
            window.cancelAnimationFrame(animFrame);
            animFrame = undefined;
            
        }, 1000);
        
    }
    
}

/* ----------- END audio controls functionality ----------- */

/* ----------- START display logic ----------- */

// handle key events for displaying different views
var displayEvents = function(e) {

    // the audio has to be initiated for these key commands to work
    if (initiated) {
    
        var keyCode = e.which || e.keycode;

        // escape to hide search area or other overlay
        if (keyCode == 27) {

            if ($('#controls').is(':hidden'))
                showControls();

            else if ($('.modal').is(':visible'))
                hideModal();

        }

        // ctrl / cmd + F to toggle track search
        else if ((e.ctrlKey || e.metaKey) && keyCode == 70) {

            if ($('#trackSearch').is(':visible'))
                showControls();

            else
                showOverlayPage('#trackSearch');
            
            e.preventDefault();
            return false;

        }

        // ctrl / cmd + s to toggle share modal
        else if ((e.ctrlKey || e.metaKey) && keyCode == 83) {

            if ($('#share').is(':visible'))
                hideModal();

            else
                shareTrack();

            e.preventDefault();
            return false;

        }
        
    }
    
}

// switch to track info view
var showControls = function() {
    
    $('#titleSmall').addClass('inverted');
    
    // since we don't know which overlay page is showing, hide all of them
    $('#about').animate({ opacity: 0 }, 500);
    $('#animationSettings').animate({ opacity: 0 }, 500);
    $('#trackSearch').animate({ opacity: 0 }, 500, function() {
        
        // one-time-only stuff
        if (!initiated) {
            $('body').css({ backgroundColor: '#313131' });
            $('#btnHideTrackSearch').show();
            keywordElem.addClass('hasCloseButton');
            initSearchArea();
            initiated = true;
        }
        
        $('#animationSettings').hide();
        $('#trackSearch').hide();
        $('#about').hide();
        
        // then show audio controls
        $('#controls').show().animate({ opacity: 1 }, 500);
        
    });
    
}

// init the search area
var initSearchArea = function() {
    
    // slide search field to top
    $('#searchField').css('top', 0);
    
    // hide title
    $('#title:visible').hide();
    
    // show small title
    $('#titleSmall').css({ opacity: 1 });
    
}

// general function for switching to overlay page view
var showOverlayPage = function(pageId) {
    
    // hide modals if they're visible
    hideModal();
    
    // start by hiding the audio controls
    $('#controls').animate({ opacity: 0 }, 500, function() {
        
        // hide everything just to be sure we don't get multiple overlays at the same time
        $('#controls').hide();
        $('#about').hide();
        $('#trackSearch').hide();
        $('#animationSettings').hide();
        
        // the show overlay depending on page id
        $(pageId).show().animate({ opacity: 1 }, 500);
        
        // special rules for some pages
        switch (pageId) { 
            case '#trackSearch':
                $('#txtSearch').focus();
                break;
        }
        
        $('#titleSmall').removeClass('inverted');
        
    });
    
}

// show modal window with shareable link
var shareTrack = function() {
    
    // make sure no other overlays are showing
    showControls();
    
    $('#share').show().animate({ opacity: 1 }, 500);
    
    $('#txtShare').val(window.location.href).focus();
    
}

// general function for hiding all modals
var hideModal = function() {
    
    $('.modal').animate({ opacity: 0 }, 500, function() {
        $(this).hide();
    })
    
}

// select all text in text field
var selectText = function(e) {
    
    $(e.target).select();
    
}

// send feedback mail
var sendFeedback = function() {
    
    var valid = true;
    var subject = $('#txtFeedbackSubject');
    var message = $('#txtFeedbackMessage');
    var email = $('#txtFeedbackEmail');
    
    if (!subject.val()) {
        subject.addClass('error');
        valid = false;
    }
    else
        subject.removeClass('error');
    
    if (!message.val()) {
        message.addClass('error');
        valid = false;
    }
    else
        message.removeClass('error');
    
    if (valid) {
    
        $.ajax({
            type: 'POST',
            url: 'https://mandrillapp.com/api/1.0/messages/send.json',
            data: {
                'key': 'E2QNv2qWhLLI081Ft3ZzsQ',
                'message': {
                    'from_email': email.val() ? email.val() : 'dummy@wauv.it',
                    'to': [
                        {
                            'email': 'samueljohanssonhue@gmail.com',
                            'type': 'to'
                        },
                        {
                            'email': 'lukasopeterson@gmail.com',
                            'type': 'to'
                        }
                    ],
                    'autotext': 'true',
                    'subject': subject.val(),
                    'html': message.val()
                }
            }
        }).done(function(response) {
            
            // show success message
            $('#feedbackForm').animate({ opacity: 0 }, 200, function() {
                
                $(this).hide();
                $('#feedbackFormSuccess').show();
                
            });
            
        });
        
    }
    
}

/* ----------- END display logic ----------- */

/* ----------- START animation functionality ----------- */

// loop to update canvas from audio data
var renderFrame = function() {
    
    // make the function recursive
    animFrame = requestAnimationFrame(renderFrame);
    
    // render bars based on values in frequencyData
    circleCanvas.draw();
	barCanvas.draw();
    
}

/* ----------- END animation functionality ----------- */