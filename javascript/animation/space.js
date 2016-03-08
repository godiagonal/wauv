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
                amount: 100,
                material: {
                    color: 0xffffff,
                    wireframe: true
                },
                maxSize: 12,
                minSize: 1,
                maxPlanets: 9,
                minPlanets: 1
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
            0xED303C,
            0x7FC7AF,
            0x5D4157,
            0xCAD7B2,
            0x82543B
        ]

        // Data & utility
        , stream
        , ii, jj, kk
        , x, y, z
        , rx, ry, rz
        , history, h, hl
        , velocity, v
        , amplificationFactor, amp, ampHistory = [], averageAmp
        , amountOfPlanets, orbitingPlanets = [], planet, planetColor, planetMaterial
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

            geometry = new THREE.TetrahedronGeometry( _options.tetrahedron.size * (ii*0.4+1) );
            mesh     = new THREE.Mesh( geometry, tetrahedronMaterial );
            _scene.add(mesh);
            tetrahedron.push(mesh);

        }

        // make solar system
        for( ii = 0 ; ii < _options.solarSystem.amount ; ii++ ) {

            size = rnd( _options.solarSystem.minSize, _options.solarSystem.maxSize );
            x    = rnd( -window.innerWidth, window.innerWidth );
            y    = rnd( -window.innerHeight, window.innerHeight );
            z    = rnd( 0, _options.camera.position.z );

            barycenter      = new THREE.Object3D();
            geometry        = new THREE.OctahedronGeometry( size );
            mesh            = new THREE.Mesh( geometry, starMaterial );
            orbitingPlanets = [];

            barycenter.position.x = x;
            barycenter.position.y = y;
            barycenter.position.z = z;

            barycenter.add( mesh );
            _scene.add( barycenter );

            solarSystem = {
                mesh: mesh,
                barycenter: barycenter,
                planets: []
            };

            amountOfPlanets = rnd( _options.solarSystem.minPlanets, _options.solarSystem.maxPlanets );

            // make planet
            for( jj = 0 ; jj < amountOfPlanets ; jj++ ) {
                planetColor     = planetColors[ rnd(0,4) ];
                planetMaterial  = new THREE.MeshBasicMaterial( { wireframe: true, color: planetColor } );
                geometry        = new THREE.OctahedronGeometry( (0.02 * rnd(1,10)) * size ); // Planets 2-20% size of star
                mesh            = new THREE.Mesh( geometry, planetMaterial );
                pivot           = new THREE.Object3D();


                pivot.position.x = x;
                pivot.position.y = y;
                pivot.position.z = z;

                barycenter.add( pivot );
                pivot.add( mesh );
                orbitingPlanets.push( mesh );

            }

            solarSystem.barycenter = barycenter;
            solarSystem.planets = orbitingPlanets;
            solarSystems.push( solarSystem );

        }

        _renderer.setSize( window.innerWidth, window.innerHeight );
        _renderer.setClearColor( _options.spaceColor, 1 );
        document.body.appendChild( _renderer.domElement );
        startTime = Date.now();

    };

    this.draw = function() {

        stream      = audioSource.getFrequencyDataBySize( 8 );
        tetrahedron = tetrahedron.reverse();
        timeElapsed = -(0 + startTime - Date.now());

        // Adds the sum of stream[0]->stream[stream.length-1] to ampHistory
        ampHistory.push(stream.reduce(function(pv, cv) { return pv + cv; }, 0));

        /**
         * Use history to get a smooth transition between velocities, to move
         * quicker/slower depending on what's going on in the song.
         */
        h = ampHistory;
        hl = ampHistory.length - 1;
        averageAmp = ( h[hl] + h[hl-5] + h[hl-10] ) / 6;
        velocity = averageAmp > 200 ? Math.pow((0.055 * averageAmp),2) : 200;

        // Animate our tetrahedron.
        for( ii = 0 ; ii < tetrahedron.length ; ii++ ) {
            tetrahedron[ ii ].rotateX( 0.003 );
            tetrahedron[ ii ].rotateY( 0.004 );
            tetrahedron[ ii ].rotateZ( 0.004 );
            //tetrahedron[ ii ].rotateZ( 0.0035 * -(stream[ ii ] * 0.01) );
            tetrahedron[ ii ].scale.x = 1 + stream[ ii ] * 0.01;
            tetrahedron[ ii ].scale.y = 1 + stream[ ii ] * 0.015;
            tetrahedron[ ii ].scale.z = 1 + stream[ ii ] * 0.0175;
        }

        // Animate solar systems.
        for( ii = 0 ; ii < solarSystems.length ; ii++ ) {

            barycenter = solarSystems[ ii ].barycenter;
            planets    = solarSystems[ ii ].planets;
            star       = solarSystems[ ii ].mesh;
            rx         = 0.03 * stream[ 1 ];
            ry         = 0.02 * stream[ 1 ];
            rz         = 0.004;
            z          = 0.02 * velocity;

            barycenter.rotateZ( rz );
            //star.rotateX( rx );
            //star.rotateY( ry );
            barycenter.position.z += z;

            // Reboot solar system if out of screen.
            if( barycenter.position.z > _camera.position.z ) {
                barycenter.position.x = rnd(-window.innerWidth,window.innerWidth);
                barycenter.position.y = rnd(-window.innerHeight,window.innerHeight);
                barycenter.position.z = 0;
            }
        }

        _renderer.render( _scene, _camera );

    };

    this.destroy = function() {
        _scene = null;
        _camera = null;
    };

    _init();

}