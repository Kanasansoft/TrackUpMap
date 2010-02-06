var width;
var height;
var lastTrackTime=0;
var TRACK_INTERVAL=10000;
var map=undefined;
var defaultMapType="ROADMAP";
var presentMarker=undefined;
var trackMarkers=[];
var overlay=undefined;
var trackCoords=undefined;
var trackPolyline=undefined;
var presentIcon="images/present.png";
var presentIconWidth=12;
var presentIconHeight=12;
var presentMarkerImage;
var trackIcon="images/track.png";
var trackIconWidth=8;
var trackIconHeight=8;
var trackMarkerImage;
var centerOnIcon="images/center_on.png";
var centerOffIcon="images/center_off.png";
var northUpOnIcon="images/northup_on.png";
var northUpOffIcon="images/northup_off.png";
var trackUpOnIcon="images/trackup_on.png";
var trackUpOffIcon="images/trackup_off.png";
var touchStartX;
var touchStartY;
var touchEndX;
var touchEndY;
var gestureFlag=false;
var gestureBaseScale;
var gestureScale;
var gestureRotation;
var autoCenterFlag;
var autoDirectionType;
var degree=30;
var AUTO_DIRECTION_TYPE={"none":"none","NORTH":"north","TRACK":"track"};

function forin(obj){
	var keys=[];
	for(var key in obj){
		keys.push(key);
	}
	alert(keys.join(" "));
	console.log(keys.join(" "));
}

function $(id){
	return document.getElementById(id);
}

function setAutoCenterFlag(flag){
	autoCenterFlag=flag;
	refreshButton();
}

function getAutoCenterFlag(){
	return autoCenterFlag;
}

function setAutoDirection(type){
	autoDirectionType=type;
	refreshButton();
}

function updateOrientation(){
	switch(window.orientation){
	case 0:
	default:
		width=320;
		height=416;
		break;
	case 90:
	case -90:
		width=480;
		height=268;
		break;
	}
	$("main").style.width=width+"px";
	$("main").style.height=height+"px";
	$("touch").style.width=width+"px";
	$("touch").style.height=height+"px";
	rotateMap();
	setTimeout(window.scrollTo,1000,0,0);
}

function rotateMap(){
	switch(autoDirectionType){
	case AUTO_DIRECTION_TYPE.NORTH:
		$("map").style.webkitTransform="rotate(0deg)";
		$("map").style.width=width+"px";
		$("map").style.height=height+"px";
		$("map").style.marginLeft="0px";
		$("map").style.marginTop="0px";
		$("map").style.marginRight="0px";
		$("map").style.marginBottom="0px";
		$("compassHandImage").style.webkitTransform="rotate(0deg)";
		degree=0;
		break;
	case AUTO_DIRECTION_TYPE.TRACK:
		var preLatLng=presentMarker.getPosition();
		var curLatLng=presentMarker.getPosition();
		for(var i=0;i<trackPolyline.getPath().getLength();i++){
			if(!curLatLng.equals(trackPolyline.getPath().getAt(i))){
				preLatLng=trackPolyline.getPath().getAt(i);
				break;
			}
		}
		if(curLatLng.equals(preLatLng)){
			degree=0;
		}else{
			var prePoint=overlay.getProjection().fromLatLngToDivPixel(preLatLng);
			var curPoint=overlay.getProjection().fromLatLngToDivPixel(curLatLng);
			var radian=Math.atan2(curPoint.y-prePoint.y,curPoint.x-prePoint.x);
			degree=360*(-Math.PI/2-radian)/(Math.PI*2);
		}
	case AUTO_DIRECTION_TYPE.NONE:
		var rotateRadian=-Math.PI*2*degree/360;
		var cornerRadian1=Math.atan2(height,width);
		var cornerRadian2=Math.atan2(height,-width);
		var radian1=rotateRadian+cornerRadian1;
		var radian2=rotateRadian+cornerRadian2;
		var distance=Math.sqrt(Math.pow(width,2)+Math.pow(height,2));
		var scaleX=Math.max(
			Math.abs(Math.cos(radian1)),
			Math.abs(Math.cos(radian2))
		);
		var scaleY=Math.max(
			Math.abs(Math.sin(radian1)),
			Math.abs(Math.sin(radian2))
		);
		var rotateX=Math.ceil(scaleX*distance);
		var rotateY=Math.ceil(scaleY*distance);
		$("map").style.webkitTransform="rotate("+degree+"deg)";
		$("map").style.width=rotateX+"px";
		$("map").style.height=rotateY+"px";
		$("map").style.marginLeft=Math.round((width-rotateX)/2)+"px";
		$("map").style.marginTop=Math.round((height-rotateY)/2)+"px";
		$("map").style.marginRight=Math.round((width-rotateX)/2)+"px";
		$("map").style.marginBottom=Math.round((height-rotateY)/2)+"px";
		$("compassHandImage").style.webkitTransform="rotate("+degree+"deg)";
		break;
	}
	google.maps.event.trigger(map,"resize");
}

function changeStartDisplayPosition(e){
//	e.preventDefault();
//	e.stopPropagation();
	var touches=e.touches;
	if(touches.length>=2){gestureFlag=true;}
	if(touches.length!=1){return;}
	touchStartX=touches[0].clientX;
	touchStartY=touches[0].clientY;
	touchEndX=touches[0].clientX;
	touchEndY=touches[0].clientY;
}

function changeDisplayPosition(e){
	e.preventDefault();
//	e.stopPropagation();
	var touches=e.touches;
	if(gestureFlag){return;}
	if(touches.length!=1){return;}
	touchEndX=touches[0].clientX;
	touchEndY=touches[0].clientY;
}

function changeEndDisplayPosition(e){
	e.preventDefault();
	e.stopPropagation();
	var touches=e.touches;
	if(touches.length!=0){return;}
	gestureFlag=false;
	if(!getAutoCenterFlag()){
		var touchMoveX=touchStartX-touchEndX;
		var touchMoveY=touchStartY-touchEndY;
		var radian=-Math.PI*2*degree/360;
		var moveX=Math.cos(radian)*touchMoveX-Math.sin(radian)*touchMoveY;
		var moveY=Math.cos(radian)*touchMoveY+Math.sin(radian)*touchMoveX;
		map.panBy(moveX,moveY);
	}
}

function gestureStart(e){
	gestureBaseScale=map.getZoom();
	gestureScale=e.scale;
	gestureRotation=e.rotation;
}

function gestureChange(e){
	if(autoDirectionType==AUTO_DIRECTION_TYPE.NONE){
		degree+=e.rotation-gestureRotation;
	}
	gestureRotation=e.rotation;
	rotateMap();
}

function gestureEnd(e){
	map.setZoom(Math.round(Math.log(e.scale)/Math.log(2))+gestureBaseScale);
	rotateMap();
	if(getAutoCenterFlag()){
		map.setCenter(presentMarker.getPosition());
	}
}

function changePresentPosition(pos){
	if(pos.timestamp-lastTrackTime<TRACK_INTERVAL){
		return;
	}
	lastTrackTime=pos.timestamp;
	var latlng=new google.maps.LatLng(pos.coords.latitude,pos.coords.longitude);
//	var latlng=new google.maps.LatLng(pos.coords.latitude+Math.random()-Math.random(),pos.coords.longitude+Math.random()-Math.random());//for debug
	trackMarkers.push(
		new google.maps.Marker(
			{
				position:presentMarker.getPosition(),
				map: map,
				icon:trackMarkerImage,
				"zIndex":1
			}
		)
	);
	if(getAutoCenterFlag()){
		map.setCenter(latlng);
	}
	presentMarker.setPosition(latlng);
	trackPolyline.getPath().insertAt(0,latlng);
	rotateMap();
}

function touchCenterIcon(){
	setAutoCenterFlag(!getAutoCenterFlag());
	if(getAutoCenterFlag()){
		map.setCenter(presentMarker.getPosition());
	}
}

function touchNorthUpIcon(){
	setAutoDirection(autoDirectionType==AUTO_DIRECTION_TYPE.NORTH?AUTO_DIRECTION_TYPE.NONE:AUTO_DIRECTION_TYPE.NORTH);
	rotateMap();
	if(getAutoCenterFlag()){
		map.setCenter(presentMarker.getPosition());
	}
}

function touchTrackUpIcon(){
	setAutoDirection(autoDirectionType==AUTO_DIRECTION_TYPE.TRACK?AUTO_DIRECTION_TYPE.NONE:AUTO_DIRECTION_TYPE.TRACK);
	rotateMap();
	if(getAutoCenterFlag()){
		map.setCenter(presentMarker.getPosition());
	}
}

function changeMapType(){
	var maptype=this.options[this.selectedIndex].value;
	map.setMapTypeId(google.maps.MapTypeId[maptype]);
	setTimeout(window.scrollTo,0,0,0);
}

function refreshButton(){
	$("centerIcon").src=(autoCenterFlag?centerOnIcon:centerOffIcon);
	$("northUpIcon").src=((autoDirectionType==AUTO_DIRECTION_TYPE.NORTH)?northUpOnIcon:northUpOffIcon);
	$("trackUpIcon").src=((autoDirectionType==AUTO_DIRECTION_TYPE.TRACK)?trackUpOnIcon:trackUpOffIcon);
}

function initialMap(){

	var latlng=new google.maps.LatLng(0,0);

	var opt={
		"zoom":15,
		"center":latlng,
		"mapTypeId":google.maps.MapTypeId[defaultMapType],
		"navigationControl":false,
		"mapTypeControl":false,
		"scaleControl":false
	};
	map=new google.maps.Map($("map"),opt);

	presentMarkerImage=new google.maps.MarkerImage(presentIcon);
	presentMarkerImage.anchor=new google.maps.Point(presentIconWidth/2,presentIconHeight/2);
	trackMarkerImage=new google.maps.MarkerImage(trackIcon);
	trackMarkerImage.anchor=new google.maps.Point(trackIconWidth/2,trackIconHeight/2);

	presentMarker=new google.maps.Marker(
		{
			position:latlng,
			map: map,
			icon:presentMarkerImage,
			"zIndex":2
		}
	);
	trackCoords=new google.maps.MVCArray();
	trackPolyline=new google.maps.Polyline(
		{
			path:trackCoords,
			strokeColor:"#0000ff",
			strokeOpacity:0.5,
			strokeWeight:2
		}
	);
	trackPolyline.setMap(map);

	Overlay.prototype=new google.maps.OverlayView();
	Overlay.prototype.onAdd=function(){};
	Overlay.prototype.draw=function(){};
	Overlay.prototype.onRemove=function(){};
	overlay=new Overlay();
	overlay.setMap(map);

}

function initial(){
	setAutoCenterFlag(true);
	setAutoDirection(AUTO_DIRECTION_TYPE.TRACK);
	initialMap();
	updateOrientation();
	for(var indx=0;indx<$("maptype").options.length;indx++){
		var option=$("maptype").options[indx];
		if(option.value==defaultMapType){
			option.selected=true;
			option.defaultSelected=true;
		}
	}
	$("maptype").addEventListener("change",changeMapType,false);
	$("centerIcon").addEventListener("click",touchCenterIcon,false);
	$("northUpIcon").addEventListener("click",touchNorthUpIcon,false);
	$("trackUpIcon").addEventListener("click",touchTrackUpIcon,false);
	$("touch").addEventListener("touchstart",changeStartDisplayPosition,false);
	$("touch").addEventListener("touchmove",changeDisplayPosition,false);
	$("touch").addEventListener("touchend",changeEndDisplayPosition,false);
	$("touch").addEventListener("gesturestart",gestureStart,false);
	$("touch").addEventListener("gesturechange",gestureChange,false);
	$("touch").addEventListener("gestureend",gestureEnd,false);
	window.addEventListener("orientationchange",updateOrientation,false);
	navigator.geolocation.watchPosition(changePresentPosition);
	rotateMap();
}

function Overlay(){};

window.addEventListener("load",initial,false);
