var Sound = require('node-arecord');
 
var sound = new Sound({
 debug: true,    // Show stdout
 destination_folder: '/tmp',
 filename: './test1.wav',
 alsa_format: 'dat',
 alsa_device: 'plughw:1,0'
});
 
sound.record();
 
setTimeout(function () {
    sound.stop(); // stop after ten seconds
}, 1000);
 
// you can also listen for various callbacks:
sound.on('complete', function () {
    console.log('Done with recording!');
});

