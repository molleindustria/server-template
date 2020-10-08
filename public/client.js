//check README.md for more information

//VS Code intellisense
/// <reference path="TSDef/p5.global-mode.d.ts" />

/*
The client and server version strings MUST be the same!
If the server gets updated it can be restarted, but if there are active clients (users' open browsers) they could be outdated and create issues.
*/
var VERSION = "1.0";

//for testing purposes I can skip the login phase
//and join with a random avatar
var QUICK_LOGIN = false;
var FPS = 60;
var AFK = false;

//the socket connection
var socket;
//sent by the server
var ROOMS;
var SETTINGS;

//default page background 
var PAGE_COLOR = "#000000";

//when the nickName is "" the player is invisible inactive: lurk mode
//for admins it contains the password so it shouldn't be shared
var nickName = "";

//this object keeps track of all the current players in the room, coordinates, bodies and color
var players;
//a reference to my player
var me;

//set the time at the beginning of the computing era, the SEVENTIES!
var lastMessage = 0;

//time since the server started
var START_TIME = -1;

var loggedIn = false;

function setup() {
    console.log("setting up...");

    //make sure there are no existing sockets
    if (socket != null) {
        socket.disconnect();
        socket = null;
    }

    //I create a socket but I wait to assign all the functions before opening a connection
    socket = io({
        autoConnect: false
    });

    //connected
    socket.on("connect", function () {
        console.log("connected to server");
    });//end connect

    //receive first server message with version and game data
    socket.on("serverWelcome",
        function (serverVersion, DATA, _START_TIME) {
            if (socket.id) {
                console.log("Welcome! Server version: " + serverVersion + " - client version " + VERSION + " started " + _START_TIME);
                START_TIME = _START_TIME;

                //check the version
                if (serverVersion != VERSION) {
                    errorMessage = "VERSION MISMATCH: PLEASE HARD REFRESH";
                    document.body.innerHTML = errorMessage;
                    socket.disconnect();
                }

                //store the unchangeable data locally
                ROOMS = DATA.ROOMS;
                SETTINGS = DATA.SETTINGS;
                print(">>> DATA RECEIVED " + (DATA.ROOMS != null));
            }
        }
    );

    //...server waits for username, see nameOk

    //server sends out the response to the name submission,
    socket.on("nameError",
        function (code) {
            if (socket.id) {

                if (code == 0) {
                    console.log("Username already taken");
                    var e = document.getElementById("username-error");

                    if (e != null)
                        e.innerHTML = "Username already taken";
                }
                else if (code == 3) {

                    var e = document.getElementById("username-error");

                    if (e != null)
                        e.innerHTML = "Sorry, only standard western characters are allowed";
                }

            }
        }

    );


    //when I join a room
    socket.on("joinedRoom", function (roomId, roomState) {
        console.log("Room joined");
        loggedIn = true;
        createRoom(roomId, roomState);
    });

    //when somebody else joins a room
    socket.on("playerJoined",
        function (p) {
            try {
                players[p.id] = new Player(p);

                var div = document.getElementById('content');
                div.innerHTML += "<em>Player " + players[p.id].nickName + " joined the room.</em><br/>";

                console.log("There are now " + Object.keys(players).length + " players in this room");

            } catch (e) {
                console.log("Error on playerJoined");
                console.error(e);
            }
        }
    );


    //when somebody disconnects/leaves the room
    socket.on("playerLeft",
        function (p) {
            try {

                var div = document.getElementById('content');

                if (p.disconnect)
                    div.innerHTML += "<em>Player " + p.nickName + " disconnected.</em><br/>";
                else
                    div.innerHTML += "<em>Player " + p.nickName + " left the room.</em><br/>";

                //update my local list
                if (players[p.id] != null)
                    players[p.id] = null;

                console.log("There are now " + Object.keys(players).length + " players in this room");

            } catch (e) {
                console.log("Error on playerLeft");
                console.error(e);
            }
        }
    );

    //when somebody talks
    socket.on("playerTalked",
        function (p) {
            try {
                console.log("new message from " + p.nickName + ": " + p.message);
                var div = document.getElementById('content');
                div.innerHTML += p.nickName + ": " + p.message + "<br/>";

                //the div dealw with overflow with a bar so scroll down on new message
                div.scrollTop = div.scrollHeight

            } catch (e) {
                console.log("Error on playerTalked");
                console.error(e);
            }
        }
    );

    //displays an error message
    socket.on("errorMessage",
        function (msg) {
            if (socket.id) {
                alert(msg);
            }
        }
    );

    //player in the room is AFK
    socket.on("playerBlurred", function (id) {
        console.log(id + " is AFK");
    });

    //player in the room is AFK
    socket.on("playerFocused", function (id) {
        console.log(id + " is back on keyboard");

    });

    //when the client realizes it's being disconnected
    socket.on("disconnect", function () {
        //console.log("OH NO");
    });

    //server forces refresh (on disconnect or to force load a new version of the client)
    socket.on("refresh", function () {
        socket.disconnect();
        location.reload(true);
    });

    //I can now open the socket
    socket.open();

    //initialize update cycle
    setInterval(function () {
        update();
    }, 1000 / FPS);
}


//just an update cycle at 60 FPS
function update() {

}

//pupulate the room with gamestate data
//happens once upon entering
function createRoom(roomId, roomState) {

    //initialize players as object list
    players = {};

    //populate the room with unchangeable data from ROOMS

    //I have to delete the elements from the previous room at this point
    var div = document.getElementById('content');
    div.innerHTML = "";
    var intro = ROOMS[roomId].text;

    //parse the "link" between rooms, it's a twine-like syntax that gets converted into a link that calls a changeRoom function 

    var link = intro.match(/\[\[(.*?)\]\]/);

    while (link != null) {
        //found link
        if (link != null) {
            var l = link[1].split("|");
            //valid format
            if (l.length == 2) {
                var htmlLink = "<a class='roomLink' href='#' onclick='changeRoom(\"" + l[1] + "\"); return false; '>" + l[0] + "</a>";
                intro = intro.replace(link[0], htmlLink);
            }
        }
        //keep replacing until there are no matches
        link = intro.match(/\[\[(.*?)\]\]/);
    }


    div.innerHTML = "<span class='description'>" + intro + "</span><br/>";

    var usersInTheRoom = [];

    //create/initialize all the players including me
    for (var playerId in roomState.players) {
        var player = roomState.players[playerId];

        //initialize player object and add it to the local list
        players[playerId] = new Player({ id: playerId, nickName: player.nickName });

        if (socket.id == playerId) {
            console.log("I joined the room " + player.room + " as " + player.nickName);
            me = player;
        }
        else {
            console.log("Player " + player.nickName + " is here too");
            usersInTheRoom.push(player.nickName);
        }
    }

    //display the status of the room
    var div = document.getElementById('content');

    if (usersInTheRoom.length == 0) {
        div.innerHTML += "<em>There are no other players in the room.</em><br/>";
    }
    else {
        div.innerHTML += "<em>Players in the room: " + usersInTheRoom.join(", ") + "</em><br/>";
    }


    //html interface stuff
    hideUsername();
    showChat();
}

//player object
function Player(p) {
    this.id = p.id;
    this.nickName = p.nickName;
}

//when I hit send
function talk(msg) {

    if (AFK) {
        AFK = false;
        if (socket != null && me != null)
            socket.emit("focus", { room: me.room });
    }

    //non empty string
    if (msg.replace(/\s/g, "") != "") {
        socket.emit("talk", { message: msg, room: me.room });
    }
}

function changeRoom(roomId) {
    if (ROOMS[roomId] != null)
        socket.emit("changeRoom", { from: me.room, to: roomId });
    else
        print("Warning: room " + roomId + " doesn't exist.")
}

//called by the talk button in the html
function getTalkInput() {

    var time = new Date().getTime();

    if (time - lastMessage > SETTINGS.ANTI_SPAM) {

        // Selecting the input element and get its value 
        var inputVal = document.getElementById("talk-field").value;
        //sending it to the talk function in sketch
        talk(inputVal);
        document.getElementById("talk-field").value = "";
        //save time
        lastMessage = time;
        longText = "";
        longTextLink = "";
    }
    //prevent page from refreshing (default form behavior)
    return false;
}

//called by the continue button in the html
function nameOk() {
    var v = document.getElementById("username-field").value;

    if (v != "") {
        nickName = v;

        //if socket !null the connection has been established ie lurk mode
        if (socket != null) {
            socket.emit("submitName", v);
        }

        //prevent page from refreshing on enter (default form behavior)
        return false;
    }
}




//enable the chat input when it's time
function showUsername() {
    var e = document.getElementById("username-form");

    if (e != null)
        e.style.display = "block";
}

function hideUsername() {

    var e = document.getElementById("username-form");
    if (e != null)
        e.style.display = "none";
}

//enable the chat input when it's time
function showChat() {
    var e = document.getElementById("talk-form");

    if (e != null)
        e.style.display = "block";

    e = document.getElementById("content");

    if (e != null)
        e.style.display = "block";
}

function hideChat() {
    var e = document.getElementById("talk-form");
    if (e != null)
        e.style.display = "none";

    e = document.getElementById("content");

    if (e != null)
        e.style.display = "none";
}

//p5 style alias
function print(s) { console.log(s); }

//disable scroll on phone
function preventBehavior(e) {
    e.preventDefault();
};

document.addEventListener("touchmove", preventBehavior, { passive: false });

// Active
window.addEventListener("focus", function () {
    if (socket != null && me != null)
        socket.emit("focus", { room: me.room });
});

// Inactive
window.addEventListener("blur", function () {
    if (socket != null && me != null)
        socket.emit("blur", { room: me.room });
});


// automatically focus on the textbox
document.addEventListener('keypress', focusOnText);

function focusOnText() {
    if (loggedIn)
        document.getElementById("talk-field").focus();
    else
        document.getElementById("username-field").focus();
}


///

setup();

if (QUICK_LOGIN) {
    hideUsername();
    nickName = "user" + Math.floor(Math.random() * 1000);

    //if socket !null the connection has been established ie lurk mode
    if (socket != null) {
        socket.emit("submitName", nickName);
    }

}
else {
    hideChat();
    showUsername();
}