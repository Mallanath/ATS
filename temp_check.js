const fs=require('fs');
const lines=fs.readFileSync('index.html','utf8').split('\n');
for(let i=3015;i<3022;i++){
  const line=lines[i];
  if(line&&(line.includes('drawer')||line.includes('sel')||line.includes('stop-rowdrawer'))){
    console.log((i+1)+': '+line.trim().slice(0,300));
  }
}
