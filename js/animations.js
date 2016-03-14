var animations = [
    {
        name: 'Space',
        slug: 'space',
        image: 'images/animation/space.png',
        creator: 'by Janne',
        background: 'dark',
        init: function() {
            return new space(audioSource, {});
        }
    },
    {
        name: 'Speaker',
        slug: 'speaker',
        image: 'images/animation/speaker.png',
        creator: 'by Samuel and Lukas',
        background: '',
        init: function() {
            return new Speaker(audioSource, {
                circleCount: 8
            });
        }
    },
    {
        name: 'Sonar',
        slug: 'sonar',
        image: 'images/animation/sonar.png',
        creator: 'by Samuel',
        background: 'dark',
        init: function() {
            return new Sonar(audioSource, {
                circleCount: 8
            });
        }
    },
	{
        name: 'Hyperspace',
        slug: 'hyperspace',
        image: 'images/animation/hyperspace.png',
        creator: 'by Samuel',
        background: '',
        init: function() {
            return new Hyperspace(audioSource);
        }
    }
]
