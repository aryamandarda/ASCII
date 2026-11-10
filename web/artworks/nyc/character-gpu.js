(function(root){
  // Keep the scene and glyph atlas on the GPU. No per-frame pixel readback or
  // JavaScript glyph expansion is needed on this path; Canvas 2D remains the fallback.
  const vertex=`attribute vec2 position;
    void main(){gl_Position=vec4(position,0.0,1.0);}`;
  const fragment=`precision highp float;
    uniform sampler2D scene, coverage, glyphs, peopleGlyphs;
    uniform vec2 grid, outputSize, glyphSize, atlasSize;
    float threshold(vec2 cell){
      vec2 p=mod(cell,4.0);
      if(p.y<1.0)return p.x<1.0?0.0:p.x<2.0?8.0:p.x<3.0?2.0:10.0;
      if(p.y<2.0)return p.x<1.0?12.0:p.x<2.0?4.0:p.x<3.0?14.0:6.0;
      if(p.y<3.0)return p.x<1.0?3.0:p.x<2.0?11.0:p.x<3.0?1.0:9.0;
      return p.x<1.0?15.0:p.x<2.0?7.0:p.x<3.0?13.0:5.0;
    }
    void main(){
      vec2 pixel=vec2(gl_FragCoord.x,outputSize.y-gl_FragCoord.y);
      vec2 cell=floor(pixel/glyphSize),uv=(cell+0.5)/grid;
      vec3 rgb=floor(texture2D(scene,uv).rgb*255.0+0.5);
      vec3 q=clamp(floor(rgb*7.0/255.0+(threshold(cell)+0.5)/16.0),0.0,7.0);
      float color=q.r*64.0+q.g*8.0+q.b;
      // Integer luminance keeps the CPU and GPU bins identical, including
      // the CPU's upper bin for white. All intermediate integers fit highp.
      float l=dot(rgb,vec3(2126.0,7152.0,722.0));
      float glyph=l<1266901.0? (l<532667.0? (l<223959.0?0.0:1.0):(l<884239.0?2.0:3.0)):
        (l<2103085.0?(l<1674481.0?4.0:5.0):6.0);
      vec2 ink=(vec2(color,glyph)*glyphSize+mod(pixel,glyphSize))/atlasSize;
      gl_FragColor=texture2D(coverage,uv).a>180.0/255.0?texture2D(peopleGlyphs,ink):texture2D(glyphs,ink);
    }`;

  function create(){
    if(typeof document==='undefined')return null;
    const canvas=document.createElement('canvas');
    let gl;
    try{gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,premultipliedAlpha:false,preserveDrawingBuffer:false});}catch{return null}
    if(!gl)return null;
    let program,buffer,textures,uniforms,atlases,available=false;
    function shader(type,source){
      const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
      if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);throw new Error('Character shader compilation failed')}
      return s;
    }
    function upload(unit,source){
      gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,textures[unit]);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
    }
    function init(){
      const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);
      program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Character shader linking failed');
      gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
      const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
      uniforms=Object.fromEntries(['grid','outputSize','glyphSize','atlasSize'].map(name=>[name,gl.getUniformLocation(program,name)]));
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL,gl.NONE);gl.disable(gl.DITHER);
      textures=['scene','coverage','glyphs','peopleGlyphs'].map((name,i)=>{
        const texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,texture);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
        gl.uniform1i(gl.getUniformLocation(program,name),i);return texture;
      });
      if(atlases){upload(2,atlases[0]);upload(3,atlases[1])}
      available=true;
    }
    try{init()}catch{return null}
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();available=false});
    canvas.addEventListener('webglcontextrestored',()=>{try{init()}catch{available=false}});
    return{
      setAtlases(scene,people){atlases=[scene,people];if(available){upload(2,scene);upload(3,people)}},
      render(scene,coverage,columns,rows,width,height){
        if(!available||gl.isContextLost()||!atlases)return null;
        try{
          if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;gl.viewport(0,0,width,height)}
          gl.uniform2f(uniforms.grid,columns,rows);gl.uniform2f(uniforms.outputSize,width,height);
          gl.uniform2f(uniforms.glyphSize,width/columns,height/rows);gl.uniform2f(uniforms.atlasSize,atlases[0].width,atlases[0].height);
          upload(0,scene);upload(1,coverage);gl.drawArrays(gl.TRIANGLES,0,6);return canvas;
        }catch{available=false;return null}
      }
    };
  }
  root.CharacterGPU={create};
})(typeof window==='undefined'?globalThis:window);
