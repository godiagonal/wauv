var animations = [
    {
        name: 'Sonar',
        image: 'images/transparent.png',
        background: 'dark',
        init: function() {
            return new Sonar(audioSource, {
                circleCount: 8
            });
        }
    },
    {
        name: 'Ripples',
        image: 'images/transparent.png',
        background: 'dark',
        init: function() {
            return new Ripples(audioSource, {
                circleCount: 8
            });
        }
    },
    {
        name: 'Speaker',
        image: 'images/transparent.png',
        background: '',
        init: function() {
            return new Speaker(audioSource, {
                circleCount: 8
            });
        }
    }
]