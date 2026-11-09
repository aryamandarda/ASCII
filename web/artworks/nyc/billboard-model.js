// Quadrilaterals are measured in the supplied 1280 x 854 photograph.
// TL, TR, BR, BL are ordered in each billboard's own perspective.
(function(root){
const boards=[
['Upper left screen',[[0,0],[51,0],[145,95],[0,250]],'drift'],
['Left edge screen',[[0,254],[53,279],[3,343],[0,342]],'sweep'],
['Detroit banner',[[108,173],[181,167],[280,282],[276,325]],'sweep'],
['Motown',[[102,214],[278,350],[235,451],[18,352]],'drift'],
['Chrysler',[[0,393],[257,482],[220,605],[0,581]],'drift'],
['Avenue Q',[[286,372],[324,394],[311,438],[273,417]],'sweep'],
['Left theater blade',[[345,343],[369,366],[346,463],[319,448]],'sweep'],
['Pippin',[[278,452],[321,471],[294,559],[242,554]],'drift'],
['Color circles display',[[329,474],[377,495],[356,586],[299,572]],'drift'],
['Distant blue display',[[390,532],[424,537],[414,601],[377,595]],'sweep'],
['Roxy marquee',[[247,576],[279,580],[269,600],[237,598]],'sweep'],
['Left round tower sign',[[374,441],[399,441],[396,460],[369,459]],'sweep'],
['Left tower ribbon',[[414,444],[444,460],[444,481],[412,463]],'sweep'],
['Center insurance sign',[[617,238],[656,238],[657,267],[614,267]],'sweep'],
['Center red screen',[[617,281],[660,280],[660,318],[615,319]],'drift'],
['Center upper ticker',[[613,270],[660,270],[660,278],[612,278]],'sweep'],
['Center cyan screen',[[610,341],[662,341],[664,414],[606,414]],'drift'],
['Center Coca-Cola',[[605,424],[666,424],[674,515],[601,515]],'drift'],
['Center lower screen',[[600,520],[674,520],[676,543],[598,543]],'sweep'],
['Center base screen',[[599,550],[674,550],[674,577],[595,577]],'drift'],
['Barclays',[[767,334],[837,330],[838,344],[766,352]],'sweep'],
['Right distant show sign',[[757,417],[794,414],[796,441],[756,444]],'sweep'],
['Right blue white show',[[871,355],[906,322],[948,430],[906,456]],'sweep'],
['The cow goes wild',[[909,302],[945,266],[996,403],[952,432]],'sweep'],
['Phantom of the Opera',[[953,258],[1008,202],[1074,361],[1003,400]],'drift'],
['Wicked',[[1014,201],[1066,151],[1126,324],[1080,355]],'sweep'],
['Right edge giant screen',[[1130,263],[1279,154],[1279,396],[1218,421]],'drift'],
['Nice Work',[[1072,358],[1135,324],[1219,521],[1132,550]],'drift'],
['Annie',[[1000,411],[1071,375],[1126,549],[1051,567]],'sweep'],
['Palace blade',[[979,418],[999,409],[1050,566],[1029,573]],'sweep'],
['Yellow theater sign',[[950,453],[973,437],[1023,577],[992,586]],'sweep'],
['Right lower cyan',[[1196,543],[1279,522],[1279,596],[1215,603]],'drift'],
['Center left red sign',[[497,532],[521,538],[521,554],[495,548]],'sweep'],
['Left small green panel',[[546,517],[558,517],[558,539],[543,538]],'sweep'],
['Right small portrait',[[775,557],[799,550],[806,598],[778,605]],'sweep'],
['Right ticker',[[1035,568],[1170,547],[1177,565],[1041,583]],'sweep']
];
function homography(p){const [[x0,y0],[x1,y1],[x2,y2],[x3,y3]]=p;let dx1=x1-x2,dx2=x3-x2,dx3=x0-x1+x2-x3,dy1=y1-y2,dy2=y3-y2,dy3=y0-y1+y2-y3,den=dx1*dy2-dx2*dy1;let g=Math.abs(den)<1e-8?0:(dx3*dy2-dx2*dy3)/den,h=Math.abs(den)<1e-8?0:(dx1*dy3-dx3*dy1)/den;return [x1-x0+g*x1,x3-x0+h*x3,x0,y1-y0+g*y1,y3-y0+h*y3,y0,g,h,1]}
function inverse(m){let[a,b,c,d,e,f,g,h,i]=m;return [e*i-f*h,c*h-b*i,b*f-c*e,f*g-d*i,a*i-c*g,c*d-a*f,d*h-e*g,b*g-a*h,a*e-b*d]}
function map(m,x,y){const w=m[6]*x+m[7]*y+m[8];return [(m[0]*x+m[1]*y+m[2])/w,(m[3]*x+m[4]*y+m[5])/w]}
function inside(p,x,y){let sign=0;for(let i=0;i<4;i++){const a=p[i],b=p[(i+1)%4],c=(b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]);if(Math.abs(c)<1e-8)continue;if(sign&&Math.sign(c)!==sign)return false;sign=Math.sign(c)}return true}
root.BillboardModel={boards,homography,inverse,map,inside};if(typeof module!=='undefined')module.exports=root.BillboardModel;
})(typeof window==='undefined'?globalThis:window);
