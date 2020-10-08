//settings are just variables that can be sent to the client from the server
//they are either related to the rooms or shared with the server 
module.exports.SETTINGS = {
    //if not specified by the url where is the starting point
    defaultRoom: "spaceship",
    //minimum time between talk messages enforced by both client and server
    ANTI_SPAM: 1000,
};

//ROOMS is (ideally) unchangeable data sent by the server to the client
module.exports.ROOMS = {

    spaceship: {
        text: "The spaceship is not quite spacious. [[Teleport to the planet|planet]].",
    },

    planet: {
        text: "The planet is brimming with alien life. [[Teleport back to the spaceship|spaceship]].",
    }

};