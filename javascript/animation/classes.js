var animations = [
    {
        name: 'Sonar',
        slug: 'sonar',
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
        slug: 'ripples',
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
        slug: 'speaker',
        image: 'images/transparent.png',
        background: '',
        init: function() {
            return new Speaker(audioSource, {
                circleCount: 8
            });
        }
    }
]