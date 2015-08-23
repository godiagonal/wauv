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
        background: 'dark',
        init: function() {
            return new CircleVisualiser(audioSource, {
                circleCount: 8,
                invert: true
            });
        }
    }
]