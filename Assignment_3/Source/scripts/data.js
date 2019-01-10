//
var zoom = 2;
const zoomVal = 0.5;
const zoomMax = 4;
const zoomMin = 1;

var left = -zoom;
var right = zoom;
var ytop = zoom;
var bottom = -zoom;

function updateZoom(in_out)
{
    zoom = (in_out == '+') ? zoom - zoomVal : zoom + zoomVal;

    if(zoom > zoomMax || zoom < zoomMin)
    {
        zoom = (in_out == '+') ? zoom + zoomVal : zoom - zoomVal;
        return;
    }

    left = -zoom;
    right = zoom;
    ytop = zoom;
    bottom = -zoom;
}

// Perspective
var near = -10;
var far = 10;
var radius = 4.0;
var theta  = 0;
var phi    = 0;
var dr = 5.0 * Math.PI / 180.0;

// Camera
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);
var eye;

var lightPosition = vec4(1.0, 1.0, 1.0, 0.0 );
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 0.0, 1.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialShininess = 20.0;

var img_urls = ["https://i.imgur.com/bEZZfeY.jpg",
                "https://i.imgur.com/J7QV7qd.jpg",
                "https://i.imgur.com/EsRbwr7.jpg",
                "https://i.imgur.com/sy6DqE7.jpg",
                "https://i.imgur.com/wg3op6k.jpg"];

// Environment Mapping (checker board pattern on outside cube)
var texSize = 64;

var temp = new Array();
for(var i = 0; i < texSize; i++)
    temp[i] = new Array();

for(var i = 0; i < texSize; i++)
    for(var j = 0; j < texSize; j++)
       temp[i][j] = new Float32Array(4);

for(var i = 0; i < texSize; i++)
{
    for(var j = 0; j < texSize; j++)
    {
        var c = (((i & 0x8) == 0) ^ ((j & 0x8)  == 0));
        temp[i][j] = [c, c, c, 1];
    }
}

// Convert floats to ubytes for texture
var pattern = new Uint8Array(4 * texSize * texSize);

for(var i = 0; i < texSize; i++)
    for(var j = 0; j < texSize; j++)
       for(var k = 0; k < 4; k++)
            pattern[4 * texSize * i + 4 * j + k] = 255 * temp[i][j][k];
