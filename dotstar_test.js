// import * as dotstar from './dotstar';
const dotstar = require('dotstar');
const SPI = require('pi-spi');

spi = SPI.initialize('/dev/spidev0.0');
const LEN = 146;

const ledStrip = new dotstar.Dotstar(spi, {
  length: LEN
});

ledStrip.all(50, 0, 0, 0.5 );
ledStrip.sync();

ledStrip.off();

// for(let x=0; x<LEN;x++){
// 	for(let l=0;l<LEN;l++){
// 		if(x==l){
// 			ledStrip.set(l, 100,0,0,  0.5);
// 		}
// 		else{
// 			ledStrip.set(l, 0,0,0,  0.5);
// 		}
// 	}
// 	ledStrip.sync();
// }


