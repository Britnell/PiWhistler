
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
  res.sendFile(__dirname +'/public/fft.html');
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

// create spectrum paths
let fmin = 20;
let fmax = 900;

 // * data must be of length 2^n    -   for in 2048 we get 1024 : freq & mag
 //
function fft_this(data){
	let phasors = fft(data);
    let frequencies = fftUtil.fftFreq(phasors, 16000);
    let mag = fftUtil.fftMag(phasors).slice(0,1024);
    
    // if(socket)      socket.emit('fft', { mag: mag } ); 
    	//socket.emit('fft', { mag: magnitudes.slice(0,512), freq: frequencies.slice(0,512) } );

    //  * Get peak & average
    let peak = {val: 0, i: 0};
    let total = 0;
    for(let f=fmin;f<fmax;f++){
      if(mag[f]>peak.val){
        peak.val = mag[f];
        peak.i = f;
      }
      total += mag[f];
    }
    let average = total / (fmax-fmin)

    //  **      standard deviation

    let std_dev = 0;
    for(let f=fmin;f<fmax;f++){
        let d = (mag[f]-average);
        std_dev += d*d;
    }
    std_dev = Math.sqrt( (fmax-fmin) );
    
    let whistle = false;
    let peak2 = {val:fmin+1, i:fmin};

    //  **  Ratio Above stddev
    let ratio = {
        above: 0,
        below: 0
    }
    let lim = average + std_dev;
    for(let f=fmin;f<fmax;f++){
        if(mag[f]>lim)
            ratio.above += mag[f];
        else
            ratio.below += mag[f];
    }
    

    //  **  IF -  first peak in target-band

    if( peak.val>30000 && peak.i>90 && peak.i<240 )
    {
      

      // * 2nd peak
      for(let f=fmin;f<fmax;f++){
        if( f<peak.i-1 || f>peak.i+1 )
        if(mag[f]>peak2.val){
          peak2.val = mag[f];
          peak2.i = f;
        }
      }

      // * Sort
      if(peak2.i<peak.i) {
        let sw = peak;          peak = peak2;          peak2 = sw;
      }

      // Peak harmony
      let prop = peak2.i / peak.i;
      prop = prop - Math.round(prop);

      // console.log( ' peak : ',peak.val,'\t\tprop :  ', prop );

      //   **   check harmonies
      if( Math.abs(prop)<0.025 )
      {

        whistles(peak.i);
        whistle = true;

        // // 2nd peak indicates harmony
        // let harmony = 0;
        // harmony += mag[peak.i-1];  harmony += mag[peak.i]; harmony += mag[peak.i+1];
        // for(let f=2;f<=4; f++){
        //   let h = f*peak.i;
        //   harmony += mag[h-1];  harmony += mag[h];  harmony += mag[h+1];
        // }
        // harmony = Math.floor(harmony);   
        // // console.log(' STD dev ratio : ', (ratio.above / ratio.below), '\t\t harmony to above  ', Math.floor(harmony / (ratio.above / ratio.below))  );
        // let snr = harmony/total;
        // if(harmony>200000 && snr > 0.1){
        //   whistles(peak.i);
        //   whistle = true;
        // }

        //  * Eo prop
      }



      // Eo if peak
    }    

    if(!triggered)
    if(new Date()-last_t>800){
      let steps = [];
      let last = 0;
      let crums = 0;

      if(sequence.length>1){
        for(let i=1; i<sequence.length; i++){

            // sneak > step from last

            let st = sequence[i]-sequence[i-1];
            if( (st>0 && last>0) || (st<0 && last<0) )              st += last;

            if(Math.abs(st)>1){
                steps.push(st);
                last = 0;
            }
            else{
                last = st;
            }

            // Eo for
        }
        
        let wh = '';
        if(steps.length==1){
            if(steps[0]>4){
                wh = 'a';
                ledStrip.sync();
            }
            else if(steps[0]<-4){
                wh = 'b';
                ledStrip.off();
            }
        }
        else if(steps.length>=2){
            if(steps[0]>0 && steps[1]>0){
                wh = 'c';
                ledStrip.all(50,0,0);      ledStrip.sync();
            }
            else if(steps[0]>0 && steps[1]<0){
                wh = 'd';
                ledStrip.all(50,20,0);      ledStrip.sync();
            }
            else if(steps[0]<0 && steps[1]<0){
                wh = 'e';
                ledStrip.all(0,0,50);          ledStrip.sync();
            }
            else if(steps[0]<0 && steps[1]>0){
                ledStrip.all(50,0,20);          ledStrip.sync();
            }
        }
        // console.log(' Whistle steps : ', steps, '\t ', wh  );

      }
      // ledStrip.clear();
      // ledStrip.sync();
      whistle_len = 0;
        
      triggered = true;
    }
    
    // Eo fft
}


var last_t = new Date();
var last_whi = 0;
var sequence = [];
var triggered = true;

function whistles(f){
    let t = new Date();

    // 9 < b < 24  in .5
    let b = get_band(f);

    if(t-last_t < 800){
      // still whistle
      if(b!=last_whi){
        // console.log(' w : ', get_band(f),'\t/', f);
        // whistle_LED(b);
        sequence.push(b);
      }
    }
    else{
      // console.log(' whistle begin', ' w : ', get_band(f),'\t/', f);
      // whistle_LED(b);
      sequence = [b];
      triggered = false;
    }

    last_whi = b;
    last_t = t;
    // Eo func
}

function get_band(f){
    return Math.round(f/5)/2;
}



//  *** LEDS

const dotstar = require('dotstar');
const SPI = require('pi-spi');

spi = SPI.initialize('/dev/spidev0.0');
const LEN = 146;

const ledStrip = new dotstar.Dotstar(spi, {
  length: LEN
});

let whistle_len = 0;

function whistle_LED(band){
    whistle_len++;

    // band 9 to 24
    // leds 0 to 146
    let l = Math.round(linear(band,5,24,0,143));

    let r = 255 - whistle_len*50;
    let b = (whistle_len-1) * 50;
    if(r<0) r=0;        if(b>255)   b=255;
    console.log(band, ' col ',r ,b  );
    ledStrip.set(l-2, r,0,b, 0.3 );
    ledStrip.set(l-1, r,0,b, 0.3 );
    ledStrip.set(l+0, r,0,b, 0.3 );
    ledStrip.set(l+1, r,0,b, 0.3 );
    ledStrip.set(l+2, r,0,b, 0.3 );
    ledStrip.sync();
}


function linear( x, min, max, omin, omax){
    let p = (x-min)/(max-min);
    return omin + (omax-omin) * p;
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
