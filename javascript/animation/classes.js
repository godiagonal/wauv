var animations = [
    {
        name: 'Sonar',
        slug: 'sonar',
        image: 'images/animation/sonar.png',
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
        image: 'images/animation/ripples.png',
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
        image: 'images/animation/speaker.png',
        background: '',
        init: function() {
            return new Speaker(audioSource, {
                circleCount: 8
            });
        }
    },
    {
        name: 'space',
        slug: 'space',
        image: '',
        background: '#eeeeee',
        init: function() {
            return new space(audioSource, {});
        }
    }
]
