
//	** Socket

const express = require('express'); // running immediately
const app = require('express')(); // running immediately
const server = require('http').Server(app);
const io = require('socket.io')(server);

const port = 3000;
var socket;

server.listen(port, () =>  {
  console.log(`Server is runnign port ${port} `);
});

app.get('/', (req,res) => {
  // res.sendFile(__dirname +'/public/socket.html');
  res.sendFile(__dirname +'/public/paper.html');
});

app.use(express.static('public'));



io.on('connection', (sckt)=>{
	socket = sckt;
	console.log(' new connection ');

	io.emit('msg',' hello socket! ');

	sckt.on('disconnect',()=>{
		socket = null;
		console.log(' disconnected ');
	});

	sckt.on('msg',(data)=>{
		console.log(' msg : ', data );
		io.emit('msg', data );
	})
});

//			***		Mic
var mic = require('mic');
var fs = require('fs');
var fft = require('fft-js').fft;
var fftUtil = require('fft-js').util;
var windowing = require('fft-windowing');

var micInstance = mic({
    rate: '16000',
    channels: '1',
    debug: true,
    fileType: 'wav'
    // exitOnSilence: 6
});
var micInputStream = micInstance.getAudioStream();

var outputFileStream = fs.WriteStream('output.wav');

var buffer = [];

micInputStream.pipe(outputFileStream);

micInputStream.on('error', function(err) {
    cosole.log("Error in Input Stream: " + err);
});

micInputStream.on('startComplete', function() {
    console.log("Got SIGNAL startComplete");
    // setTimeout(function() {
    //         micInstance.stop();
    // }, 8000);
});

micInputStream.on('stopComplete', function() {
    console.log("Got SIGNAL stopComplete");
});

micInputStream.on('processExitComplete', function() {
    console.log("Got SIGNAL processExitComplete");
});

micInstance.start();

//
//
//		**			MIC DATA
//
//

micInputStream.on('data', function(data) {
    // console.log("Recieved Input Stream: " + data.length);
    buffer.push(...data);

    let bite = 4096;  // 2048 4096
    while(buffer.length>=bite){
    	let signal = buffer.slice(0,bite);
    	signal = windowing.hann(signal);	// WINDOWING!
    	fft_this(signal);
    	buffer = buffer.slice(bite);
    }

    // Eo on data
});

 //
 var background = {
 	len: 8,
 	arr : [],
 	i : 0,
 	lvl : 100
 }
 for(let l=0;l<background.len; l++){
 	background.arr.push(0);
 }

 // * data must be of length 2^n
 // for in 2048 we get 1024 : freq & mag
function fft_this(data){
	let phasors = fft(data);
    let frequencies = fftUtil.fftFreq(phasors, 16000);
    let magnitudes = fftUtil.fftMag(phasors);

    // console.log(' fft > sending io ');
    // console.log(' socket : ', socket );
    if(socket)
      socket.emit('fft', { mag: magnitudes.slice(0,1024) } );
    	//socket.emit('fft', { mag: magnitudes.slice(0,512), freq: frequencies.slice(0,512) } );

    // * find min max
    let beg = 20;
    let end = 500;
    let mean = 0;

    let max = {
    	val: magnitudes[beg],
    	i:	beg	    }
    let second = {
    	val: magnitudes[beg],
    	i: beg		    }
    // calc stats
    for(let x=beg; x<magnitudes.length-end; x++){
    	// mean
    	mean += magnitudes[x];

    	if(magnitudes[x]>max.val){
    		// repl second
    		second.val = max.val;
    		second.i = max.i;
    		second.f = max.f;
    		// new max
    		max.val = magnitudes[x];
    		max.i = x;
    		max.f = frequencies[x];
    	}
    	else if(magnitudes[x]>second.val){
    		second.val = magnitudes[x];
    		second.i = x;
    		second.f = frequencies[x];
    	}
    	// Eo for
    }

    max.val += magnitudes[max.i-1];
	max.val += magnitudes[max.i+1];

    // mean
    mean /= (magnitudes.length-end-beg);

    // SNR
    let to_mean = max.val / mean;
    let to_back = max.val / background.lvl;

    // if(to_back>300)
    // console.log( ' x:  ', max.i, //'\t f:  ', Math.floor(max.f) ,
    // 	'\t m:   ', Math.floor(max.val), '\t back:  ', Math.floor(background.lvl),
    // 	// '\t 0:  ', Math.floor(magnitudes[0]),
    // 	 '\t\t t-m:  ', Math.floor(to_mean), '\t t-b:  ', Math.floor(to_back)  );


    // calc background lvl for next
    background.arr[background.i] = mean;
    background.i++;    if(background.i>=background.len)	background.i = 0;
    background.lvl = 0;
    background.arr.forEach(function(x){    	background.lvl += x;    });
    background.lvl /= background.len;

    // Eo fft
}


// micInputStream.on('pauseComplete', function() {
//     console.log("Got SIGNAL pauseComplete");
//     setTimeout(function() {
//         micInstance.resume();
//     }, 5000);
// });

// micInputStream.on('resumeComplete', function() {
//     console.log("Got SIGNAL resumeComplete");
//     setTimeout(function() {
//         micInstance.stop();
//     }, 5000);
// });

// micInputStream.on('silence', function() {
//     console.log("Got SIGNAL silence");
// });
