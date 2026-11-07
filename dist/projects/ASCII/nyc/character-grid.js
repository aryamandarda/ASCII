(function(root){
  // A uniform RGB cube preserves blue, yellow and neutral hues. No channel-wise
  // brightness clipping or nearest-neighbour jumps into unrelated colors.
  const palette=[];for(let r=0;r<8;r++)for(let g=0;g<8;g++)for(let b=0;b<8;b++)palette.push([r,g,b].map(v=>Math.round(v*255/7)));
  const ramp=' .:-+*#@',bayer=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
  function cell(r,g,b,x=0,y=0){
    const threshold=(bayer[(y&3)*4+(x&3)]+.5)/16;
    const q=v=>Math.max(0,Math.min(7,Math.floor(v*7/255+threshold)));
    return{color:q(r)*64+q(g)*8+q(b),glyph:Math.min(7,Math.floor(((.2126*r+.7152*g+.0722*b)/255)**.8*7))};
  }
  function size(columns){return{columns,rows:Math.round(columns*854/1280*.6)}}
  // Use the contained artwork size in CSS pixels, not the monitor resolution.
  // Preserve the phone's 390 columns; add detail as the artwork grows on desktop.
  function columnsForView(width,height){
    const displayed=Math.min(Math.max(0,width),Math.max(0,height)*1280/854);
    return Math.max(390,Math.min(960,Math.round(displayed/2/10)*10));
  }
  root.CharacterGrid={palette,ramp,cell,size,columnsForView};if(typeof module!=='undefined')module.exports=root.CharacterGrid;
})(typeof window==='undefined'?globalThis:window);
