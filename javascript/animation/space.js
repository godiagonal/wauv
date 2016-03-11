"use strict";

function space( audioSource, options ) {

    var _options = {
            speed: 120,
            spaceColor: 0x1F282D,

            // http://threejs.org/docs/#Reference/Cameras/PerspectiveCamera
            camera: {
                position: {
                  z: 2000
                },
                fov: 75,
                aspect: window.innerWidth / window.innerHeight,
                near: 1,
                far: 3000
            },

            // http://threejs.org/docs/#Reference/Extras.Geometries/TetrahedronGeometry
            tetrahedron: {
                amount: 8,
                size: 30,
                material: {
                    color: 0xff0000,
                    wireframe: true
                }
            },

            // http://threejs.org/docs/#Reference/Extras.Geometries/OctahedronGeometry
            solarSystem: {
                amount: 200,
                material: {
                    color: 0xffffff,
                    wireframe: true
                },
                maxSize: 7,
                minSize: 1,
                maxPlanets: 9,
                minPlanets: 1
            },

            space: {
                outerBoundsX: 4 * window.innerWidth,
                outerBoundsY: 3 * window.innerHeight
            }
        }

        // Objects
        , tetrahedron  = []
        , solarSystems = []
        , planets      = []

        // 3D
        , _scene
        , _renderer
        , _camera
        , geometry
        , mesh

        // Random number between min and max, floored, max exclusive.
        , rnd = function(min, max) {
            return Math.floor(Math.random() * (max - min) + min);
        }

        // Override default options if specified by user.
        , _setOptions = function() {

            if(!options) options = {};

            for (var key in _options) {
                if (_options.hasOwnProperty(key) && options.hasOwnProperty(key))
                    _options[key] = options[key];
            }

        }

        // Hexadecimal colors for the planets.
        , planetColors = [
            0x95C272,
            0x7FC7AF,
            0x5D4157,
            0xCAD7B2,
            0x031634
        ]

        // Data & utility
        , stream
        , ii, jj, kk
        , x, y, z
        , xShift = 0, yShift = 0
        , mouseX, mouseY
        , rx, ry, rz
        , history, h, hl
        , velocity
        , ampHistory = [], averageAmp
        , amountOfPlanets, orbitingPlanets = [], planetColor, planetMaterial
        , solarSystem, star, barycenter, size
        , pivot
        , startTime
        , timeElapsed
        ;

    var _init = function() {

        _setOptions();

        var tetrahedronMaterial = new THREE.MeshNormalMaterial( _options.tetrahedron.material )
            , starMaterial      = new THREE.MeshBasicMaterial( _options.solarSystem.material )
            ;

        // make basic
        _scene    = new THREE.Scene();
        _renderer = new THREE.WebGLRenderer({ alpha: true });
        _camera   = new THREE.PerspectiveCamera(
            _options.camera.fov,
            _options.camera.aspect,
            _options.camera.near,
            _options.camera.far
        );
        _camera.position.z = _options.camera.position.z;

        // make tetrahedron
        for( ii = 0 ; ii < _options.tetrahedron.amount ; ii++ ) {

            geometry = new THREE.TetrahedronGeometry( _options.tetrahedron.size * (ii+1) );
            mesh     = new THREE.Mesh( geometry, tetrahedronMaterial );
            _scene.add(mesh);
            tetrahedron.push(mesh);

        }

        // make solar system
        for( ii = 0 ; ii < _options.solarSystem.amount ; ii++ ) {

            size = rnd( _options.solarSystem.minSize, _options.solarSystem.maxSize );
            x    = rnd( -_options.space.outerBoundsX, _options.space.outerBoundsX );
            y    = rnd( -_options.space.outerBoundsY, _options.space.outerBoundsY );
            z    = rnd( 0, _options.camera.position.z );

            barycenter      = new THREE.Object3D();
            geometry        = new THREE.OctahedronGeometry( size );
            mesh            = new THREE.Mesh( geometry, starMaterial );
            orbitingPlanets = [];
            amountOfPlanets = rnd( _options.solarSystem.minPlanets, _options.solarSystem.maxPlanets );
            solarSystem     = {
                mesh: mesh,
                barycenter: null,
                planets: []
            };

            // Add mesh to pivot.
            barycenter.add( mesh );

            // make planet
            for( jj = 0 ; jj < amountOfPlanets ; jj++ ) {

                planetColor     = planetColors[ rnd(0,4) ];
                planetMaterial  = new THREE.MeshBasicMaterial( { wireframe: true, color: planetColor } );
                geometry        = new THREE.OctahedronGeometry( (0.02 * rnd(1,10)) * size ); // Planets 2-20% size of star
                mesh            = new THREE.Mesh( geometry, planetMaterial );
                pivot           = new THREE.Object3D();

                pivot.position.x += rnd(-25,25);
                pivot.position.z += rnd(-25,25);

                barycenter.add( pivot );
                pivot.add( mesh );
                orbitingPlanets.push( mesh );

            }

            barycenter.position.x = x;
            barycenter.position.y = y;
            barycenter.position.z = z;


            solarSystem.barycenter = barycenter;
            solarSystem.planets = orbitingPlanets;
            solarSystems.push( solarSystem );
            _scene.add( barycenter );

        }

        _renderer.setSize( window.innerWidth, window.innerHeight );
        _renderer.setClearColor( _options.spaceColor, 1 );
        tetrahedron = tetrahedron.reverse();
        document.body.appendChild( _renderer.domElement );
        startTime = Date.now();

    };

    this.draw = function(e) {

        stream = audioSource.getFrequencyDataBySize( 8 );

        // Adds the sum of stream[0]->stream[stream.length-1] to ampHistory
        ampHistory.push(stream.reduce(function(pv, cv) { return pv + cv; }, 0));

        /**
         * Use history to get a smooth transition between velocities, to move
         * quicker/slower depending on what's going on in the song.
         */
        h = ampHistory;
        hl = ampHistory.length - 1;
        averageAmp = ( h[hl] + h[hl-5] + h[hl-10] ) / 6;
        velocity = Math.pow( averageAmp * 0.12, 1.7 ) * 0.01;

        // Animate our tetrahedron.
        for( ii = 0 ; ii < tetrahedron.length ; ii++ ) {
            tetrahedron[ ii ].rotateX( 0.004 );
            tetrahedron[ ii ].rotateY( 0.003 );
            tetrahedron[ ii ].rotateZ( 0.0025 );
            tetrahedron[ ii ].scale.x = 1 + stream[ ii ] * 0.01;
            tetrahedron[ ii ].scale.y = 1 + stream[ ii ] * 0.015;
            tetrahedron[ ii ].scale.z = 1 + stream[ ii ] * 0.0175;
        }

        // Animate solar systems.
        for( ii = 0 ; ii < solarSystems.length ; ii++ ) {

            barycenter = solarSystems[ ii ].barycenter;
            planets    = solarSystems[ ii ].planets;
            star       = solarSystems[ ii ].mesh;
            rz         = 0.008;
            z          = velocity > 0.2 ? velocity : 0.2;

            barycenter.rotateY( rz );
            barycenter.position.z += z;
            barycenter.position.x -= xShift;
            barycenter.position.y += yShift;

            // Reboot solar system if out of screen.
            if( barycenter.position.z > _camera.position.z ) {
                barycenter.position.x = rnd( -_options.space.outerBoundsX, _options.space.outerBoundsX );
                barycenter.position.y = rnd( -_options.space.outerBoundsY, _options.space.outerBoundsY );
                barycenter.position.z = 0;
            }
        }

        _renderer.render( _scene, _camera );

    };

    this.destroy = function() {
        _scene = null;
        _camera = null;
    };

    document.onmousemove = function(e){
        mouseX = e.clientX - window.innerWidth / 2;
        mouseY = e.clientY - window.innerHeight / 2;
        xShift = mouseX / 400;
        yShift = mouseY / 300;
    };

    _init();

}