var animFrame,
    currentAnimation,
    audioSource,
    initiated = false,
    searchTimeout,
	resultContainer,
    keywordElem,
    tempKeyword,
    searchFieldElem,
    smallTitleElem,
    notSupportedElem,
	isPlaying = false,
    searchGrid,
    styleGrid;

var animations = [
    {
        name: 'Circles',
        image: 'images/transparent.png',
        background: '',
        init: function() {
            return new CircleVisualiser(audioSource, {
                circleCount: 8
            });
        }
    },
    {
        name: 'Circles Inverted',
        image: 'images/transparent.png',
        background: '',
        init: function() {
            return new CircleVisualiser(audioSource, {
                circleCount: 8,
                invert: true
            });
        }
    }
]

$(function() {
    
    // before we do anything, check if the browser is supported
    if (!isBrowserCompatible()) {
        $('#searchField').hide();
        $('#browserNotSupported').show()
        return;
    }
    
    // create a soundcloud audio source
    audioSource = new SoundCloudAudioAnalyser('track', {
        clientId: '871fec88c262d653f6230c6ebe6e4f7b',
        redirectUri: '',
        error: handleError,
        success: setTrackInfo
    });
    
    // create grid for search results
    searchGrid = new Greed('resultContainer', null, {
        select: function(track) { setAudio(track.permalink_url); },
        objectKeys: { title: 'title', text: 'artist', image: 'image' },
        minSize: 200
    });
    
    // create grid with animation styles
    styleGrid = new Greed('animationSettingsContainer', animations, {
        select: function(animation) { setAnimation(animation); },
        objectKeys: { title: 'name', image: 'image' },
        minSize: 150
    });
    
    // init default animation class
    currentAnimation = animations[0];
    currentAnimation.instance = currentAnimation.init();
    
    $('#track').on('play', playAudio);
    $('#track').on('pause', pauseAudio);
	$('#txtSearch').on('keyup', searchEvents);
    $('.overlayPage .closeButton').on('click', showControls);
    $('.modal .closeButton').on('click', hideModal);
    $('#btnShowTrackSearch').on('click', function() { showOverlayPage('#trackSearch') });
    $('#btnShowAnimationSettings').on('click', function() { showOverlayPage('#animationSettings') });
    $('#btnShowAbout').on('click', function() { showOverlayPage('#about') });
    $('#btnShare').on('click', shareTrack);
    $('#txtShare').on('focus', selectText);
    $('#btnFeedbackSubmit').on('click', sendFeedback);
    $('#btnToggleControls').on('click', toggleControls);
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
    
    return bowser.chrome && !bowser.mobile;
    
}

/* ----------- START track search functionality ----------- */

// handle different key press events for search functionality
var searchEvents = function(e) {
    
	var keyword = $(this).val();
	var keyCode = e.which || e.keycode;
	
    // handle pasted links (only if enter is pressed)
    if (audioSource.validUrl(keyword)) {
        
		if (keyCode == 13)
			setAudio(keyword);
        
	}
    
    // do search if the input text is long enough 
	else if (keyword.length > 2) {
        
        // prevent non-character keys (esc, ctrl etc) from firing a search
        if (tempKeyword != keyword) {
            
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
		searchGrid.empty();
        resultContainer.css('opacity', 0);
        
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
    
    // show results if there are any
    if (tracks.length > 0)
        searchGrid.reload(tracks);
    
    // show error message if there are no results
    else {
        
        searchGrid.empty();
        
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

/* ----------- END track search functionality ----------- */

/* ----------- START track selection functionality ----------- */

// play track from url if artist/track is provided after # (hashtag)
var checkHash = function() {
    
    if (location.hash.length) {
        var url = 'https://soundcloud.com/' + location.hash.substr(1);
        setAudio(url);
    }
    
}

// set audio source from url
var setAudio = function(url) {
    
    audioSource.setSourceFromUrl(url);
    
}

/* ----------- END track selection functionality ----------- */

/* ----------- START track info functionality ----------- */

// update track info from audio source and play audio
var setTrackInfo = function(track) {
    
    var title = track.title;
	var username = track.user.username;
    
    document.getElementById('artistLink').innerHTML = username;
    document.getElementById('artistLink').title = track.user.username;
    document.getElementById('artistLink').href = track.user.permalink_url;
    
    document.getElementById('trackLink').innerHTML = title;
    document.getElementById('trackLink').title = track.title;
    document.getElementById('trackLink').href = track.permalink_url;
    
    if (track.image)
        document.getElementById('trackArt').style.backgroundImage = 'url(' + track.image + ')';
    else
        document.getElementById('trackArt').style.backgroundImage = 'linear-gradient(135deg, #89b0bc, #ac898d)';
    
    // update hash part of url to create a shareable link
    location.hash = '#' + track.user.permalink + '/' + track.permalink;
    
    showControls();
    playAudio();
    
}

// general method for handling errors
var handleError = function(obj) {
    
    $('#error h3').html(obj.msg);
    $('#error').show().animate({ opacity: 1 }, 500);
    
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
    
}

/* ----------- END audio controls functionality ----------- */

/* ----------- START display logic ----------- */

// handle key events for displaying different views
var displayEvents = function(e) {

    var keyCode = e.which || e.keycode;
    
    // the audio has to be initiated for these key commands to work
    if (initiated) {

        // escape to hide search area or other overlay
        if (keyCode == 27) {
            
            if ($('.modal').is(':visible'))
                hideModal();
            
            else if ($('#controls').is(':hidden'))
                showControls();

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

        // ctrl / cmd + S to toggle share modal
        else if ((e.ctrlKey || e.metaKey) && keyCode == 83) {

            if ($('#share').is(':visible'))
                hideModal();

            else
                shareTrack();

            e.preventDefault();
            return false;

        }

        // ctrl / cmd + A to toggle animation settings
        else if ((e.ctrlKey || e.metaKey) && keyCode == 68) {

            if ($('#animationSettings').is(':visible'))
                showControls();

            else
                showOverlayPage('#animationSettings');
            
            e.preventDefault();
            return false;

        }

        // ctrl / cmd + I to toggle animation settings
        else if ((e.ctrlKey || e.metaKey) && keyCode == 73) {

            if ($('#about').is(':visible'))
                showControls();

            else
                showOverlayPage('#about');
            
            e.preventDefault();
            return false;

        }
        
    }
    
    // enable hiding of modal with esc even if the player isn't initiated
    else if (keyCode == 27 && $('.modal').is(':visible'))
        hideModal();
    
}

// switch to track info view
var showControls = function() {
    
    // disable grid events
    searchGrid.keyEventsEnabled = false;
    styleGrid.keyEventsEnabled = false;
    
    // change bg and logo color depending on current animation
    $('body').removeClass();
    $('#titleSmall').removeClass('inverted');
    
    switch (currentAnimation.background)
    {
        case 'dark':
            $('#titleSmall').addClass('inverted');
            $('body').addClass('dark');
            break;
    }
    
    // since we don't know which overlay page is showing, hide all of them
    $('#about').animate({ opacity: 0 }, 500);
    $('#animationSettings').animate({ opacity: 0 }, 500);
    $('#trackSearch').animate({ opacity: 0 }, 500, function() {
        
        // one-time-only stuff
        if (!initiated) {
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
    
    // disable grid events
    searchGrid.keyEventsEnabled = false;
    styleGrid.keyEventsEnabled = false;
    
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
                searchGrid.keyEventsEnabled = true; // enable grid events
                break;
            case '#animationSettings':
                styleGrid.resize();
                styleGrid.keyEventsEnabled = true;
                break;
        }
        
        $('#titleSmall').removeClass('inverted');
        
    });
    
}

// minimize/maximize track controls
var toggleControls = function() {
    
    // hide
    if ($('#controlsWrap').css('margin-top') == '30px') {
        
        $('#controlsWrap').css('margin-top', $('#controlsWrap').innerHeight() + 30);
        $(this).text('Show controls');
        
    }
    
    // show
    else {
        
        $('#controlsWrap').css('margin-top', 30);
        $(this).text('Hide');
        
    }
    
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

// change current animation instance
var setAnimation = function(animation) {
    
    // destroy previous animation instance
    if (currentAnimation.instance) {
        currentAnimation.instance.destroy();
        currentAnimation.instance = null;
    }
    
    // and add the new one
    currentAnimation = animation;
    currentAnimation.instance = currentAnimation.init();
    
    // finally go back to playback view
    showControls();
    
}

// loop to update canvas from audio data
var renderFrame = function() {
    
    // make the function recursive
    if (isPlaying)
        animFrame = requestAnimationFrame(renderFrame);
    
    // render the currently active animation instance based on values in frequencyData
    if (currentAnimation.instance)
        currentAnimation.instance.draw();
    
}

/* ----------- END animation functionality ----------- */