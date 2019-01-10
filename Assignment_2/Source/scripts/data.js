var scale = 1.5;

// Theta values are splitted by this char
const splitter = "&&";

// Node information
const node_num = 20;
const angle_num = 24;
const vertices_num = 24;    // 6 * 4

// Animation
var anim_delay = 20;

const v_colors = [
    vec4(124.0 / 255.0, 252.0 / 255.0, 0.0),
    vec4(50.0 / 255.0, 205.0 / 255.0, 50.0 / 255.0),
    vec4(34.0 / 255.0, 139.0 / 255.0, 34.0 / 255.0),
    vec4(107.0 / 255.0, 142.0 / 255.0, 35.0 / 255.0),
    vec4(46.0 / 255.0, 139.0 / 255.0, 87.0 / 255.0),
    vec4(143.0 / 255.0, 188.0 / 255.0, 143.0 / 255.0),
    vec4(46.0 / 255.0, 139.0 / 255.0, 87.0 / 255.0),
    vec4(143.0 / 255.0, 188.0 / 255.0, 143.0 / 255.0)
];

var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 0),
    vec2(1, 1)
]

// ** Body components **

// Torso
const torso = {
    id: 0,
    id1: 0,
    id2: 20,
    id3: 21,
    width: 2.0 * scale,
    height: 10.0 * scale
};

// Neck
const neck = {
    id: 1,
    width: 1.0 * scale,
    height: 7.0 * scale
};

// Head
const head = {
    id: 2,
    id2: 19,
    width: 1.5 * scale,
    height: 1.5 * scale
};

// Front Limbs
const front_limbs = {
    upper: {
        left_id: 3,
        right_id: 4,
        left_id2: 22,
        right_id2: 23,
        width: 0.5 * scale,
        height: 5.0 * scale
    },
    middle: {
        left_id: 5,
        right_id: 6,
        width: 0.3 * scale,
        height: 5.0 * scale
    },
    lower: {
        left_id: 7,
        right_id: 8,
        width: 0.2 * scale,
        height: 5.0 * scale
    }
};

// Middle Limbs
const middle_limbs = {
    upper: {
        left_id: 9,
        right_id: 10,
        width: 0.5 * scale,
        height: 1.5 * scale
    },
    lower: {
        left_id: 11,
        right_id: 12,
        width: 0.2 * scale,
        height: 6.0 * scale
    }
};

// Back Limbs
const back_limbs = {
    upper: {
        left_id: 13,
        right_id: 14,
        width: 0.5 * scale,
        height: 2.0 * scale
    },
    lower: {
        left_id: 15,
        right_id: 16,
        width: 0.2 * scale,
        height: 8.5 * scale
    }
};

// Anthenna
const anthenna = {
    left_id: 17,
    right_id: 18,
    width: 0.1 * scale,
    height: 5.0 * scale
}

// Default global positions
var position_x = 0.0;
var position_y = 0.0;

// Default theta angles
var theta = [];

theta[torso.id1] = -80.0;
theta[torso.id2] = 180.0;
theta[torso.id3] = -40.0;

theta[head.id] = 20.0;
theta[head.id2] = 0.0;

theta[neck.id] = 70.0;

theta[front_limbs.upper.right_id] = 20.0;
theta[front_limbs.upper.right_id2] = -30.0;
theta[front_limbs.middle.right_id] = 140.0;
theta[front_limbs.lower.right_id] = -120.0;
theta[front_limbs.upper.left_id] = 30.0;
theta[front_limbs.upper.left_id2] = 30.0;
theta[front_limbs.middle.left_id] = 150.0;
theta[front_limbs.lower.left_id] = -120.0;

theta[middle_limbs.upper.right_id] = -40.0;
theta[middle_limbs.lower.right_id] = 80.0;
theta[middle_limbs.upper.left_id] = 50.0;
theta[middle_limbs.lower.left_id] = 80.0;

theta[back_limbs.upper.right_id] = -10.0;
theta[back_limbs.lower.right_id] = 130.0;
theta[back_limbs.upper.left_id] = 10.0;
theta[back_limbs.lower.left_id] = 130.0;

theta[anthenna.left_id] = 0.0;
theta[anthenna.right_id] = 0.0;

// Positions
theta[angle_num] = position_x;
theta[angle_num + 1] = position_y;

// For keeping default angles
const default_theta = theta.slice();

var vertices = [
    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5, -0.5, -0.5, 1.0 )
];
