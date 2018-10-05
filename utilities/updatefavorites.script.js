// ======= RUN THIS FUNCTION WHILE LOGGED IN TO UPDATE DATABASE =======
console.log('Run startFavoritesUpdate() to update the datastructure of your favorites!')

// ========= ARCHIVED FIRST UPDATE FUNCTIONALITY =========
// function startFavoritesUpdate() {
//     for (let index = 0; index < myFavoriteAlbums.length; index++) {
//         let albumID = myFavoriteAlbums[index];
        
//         let newFavorite
//         let artist
//         let album
//         $.getJSON ( '/albumdetails/json/' + albumID, function(rawData) {
//             artist = rawData.data[0].attributes.artistName;
//             album = rawData.data[0].attributes.name;
//         }).then(function(){
//             newFavorite = 
//             {
//                 "albumId" : albumID,
//                 "artistName" : artist,
//                 "albumName" : album
//             }
//         }).then(function() {
//             let index = myFavoriteAlbums.indexOf(albumID);
//             myFavoriteAlbums.splice(index, 1);
//             myFavoriteAlbums.push(newFavorite);
//         }).then(function() {
//             favoritesDatabase.ref(userID).set({
//                 "My Favorites": myFavoriteAlbums
//             });
//         })
//     }
// }


// ======= RUN THIS FUNCTION WHILE LOGGED IN TO UPDATE DATABASE, V2 =======
let albumID 
let newFavorite
let artist
let album
let release


function timedSteps(index) {
    albumID = favoritesToUpdate[index];
    
    $.getJSON ( '/albumdetails/json/' + albumID, function(rawData) {
        artist = rawData.data[0].attributes.artistName;
        album = rawData.data[0].attributes.name;
        release = rawData.data[0].attributes.releaseDate;
    })
}

function moreSteps() {
    var newFavorite = 
        {
            "albumId" : albumID,
            "artistName" : artist,
            "albumName" : album,
            "releaseDate" : release
        }

    updatedFavorites.push(newFavorite);
}

var favoritesToUpdate
var updatedFavorites = []

function startFavoritesUpdate() {
    var index = -1
    var myTimer = setInterval(function() {
        
        if (index < 59) { 
            index = (index + 1)
        } else {
            console.log("done")
            clearInterval(myTimer);
        }
        
        setTimeout(function(){ timedSteps(index) }, 1500)
        setTimeout(function(){ moreSteps() }, 3000)
        
    }, 4000);
}

function finishUpdate() {
    favoritesDatabase.ref(userID).set({
        "My Favorites": updatedFavorites
    });
}

// ======= INSTRUCTIONS =========
console.log('1. Run this: favoritesToUpdate = myFavoriteAlbums'
+ '\n' + '2. Then run this: startFavoritesUpdate()'
+ '\n' + '3. Check updatedFavorites array for undefined values and use array.splice(index, 1) to take these off'
+ '\n' + '4. Last run this: finishUpdate()')
