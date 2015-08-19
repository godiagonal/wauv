var testData = [],
    testData2,
    grid;

for (var i = 0; i < 20; i++) {
    testData.push({
        id: i+1,
        title: 'Seekae - Test & Recognise (Flume Re-work) ' + (i + 1),
        text: 'Artistnamnet här ' + i,
        img: 'https://i1.sndcdn.com/artworks-000075275743-as2evb-t300x300.jpg'
    });
}

testData2 = testData.slice(10);

window.onload = function() {
    
    grid = new Greed('grid', testData, {
        
        move: function(obj) {
            //console.log('moved: ' + obj.id);
        },
        select: function(obj) {
            console.log('selected: ' + obj.greedId);
            grid.remove(obj.greedId);
        },
        keys: {
            title: 'title',
            text: 'text',
            image: 'img'
        },
        minSize: 200,
        cutOverflow: false,
        trackActive: true,
        trackAnimation: true
        
    });
    
    /*setTimeout(function(){
        grid.reload(testData);
    }, 1000);*/
    
    grid.keyEventsEnabled = true;
    
    setTimeout(function(){
        grid.add({
            id: 99,
            title: 'ADD',
            text: 'shit'
        });
    }, 1500);
    
    /*setTimeout(function(){
        grid.select(62);
    }, 2000);*/
    
}