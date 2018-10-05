// ------- START UTILITIES SECTION ----------
console.log('The custom script for the favorites page is running.');

function truncate(str, len){
    // set up the substring
    var subString = str.substr(0, len-1);
    
    return (
        // add elipse after last complete word
        subString.substr(0, subString.lastIndexOf(' '))
        // trim trailing comma
        .replace(/(^[,\s]+)|([,\s]+$)/g, '') + '...'
    )
};

function removeDash(str) {
    return str.replace(/-/g, '');
}

function bubbleSort(arr, prop)
{
    var swapped;
    do {
        swapped = false;
        for (var i = 0; i < arr.length - 1; i++) {
            // console.log("Comparing " + parseInt(removeDash(arr[i][prop])) + " to " + parseInt(removeDash(arr[i + 1][prop])))
            if (parseInt(removeDash(arr[i][prop])) > parseInt(removeDash(arr[i + 1][prop]))) {
                var temp = arr[i];
                arr[i] = arr[i + 1];
                arr[i + 1] = temp;
                swapped = true;
            }
        }
    } while (swapped);
}

// ------- END UTILITIES SECTION ----------

function getAlbumInfo(albumNumber, cardNumber) {
    
    $.getJSON( '/favorites/album/' + albumNumber)
    .done(function(rawData) {
    
    // if the album is from this year, populate the page, otherwise remove the card
    try {
        if(rawData.data[0].attributes.releaseDate.slice(0,4) == `${(new Date()).getFullYear()}`){
            populateCard(albumNumber, rawData.data[0].attributes, cardNumber);
        }
        else {
            let emptyCard = document.getElementById(`card${cardNumber}`)
            emptyCard.remove();
        }
    } catch (error) {
        console.log(albumNumber, error)

        function logError() {
            var newKey = firebase.database().ref().child('errors').push().key;
        
            firebase.database().ref('errors/' + newKey).update({
            // firebase.database().ref('errors/').set({
                "error" : 
                {
                    "Album_Number" : albumNumber,
                    "User" : userID,
                    "URL" : window.location.href,
                    "Date_Time" : new Date().toLocaleString(),
                    "Error" : JSON.stringify(error, Object.getOwnPropertyNames(error))
                }
                // "error" : "No errors!"
            });
        
            // return firebase.database().ref('/errors').once('value').then(function(snapshot) {
            //     var error = snapshot.val();
            //     console.log(error)
            // });
        }

        logError()

        // newrelic.setCustomAttribute("Page_Load_Error", "Album_number_may_no_longer_be_valid")

        let emptyCard = document.getElementById(`card${cardNumber}`)
        emptyCard.remove();
    }

    })
    .fail(function() { 
        // this function should only fail if there is trouble accessing the apple API
        // check jwt to see if it is still valid
        console.log("error accessing Apple API");
    });
};

// creates the album card with loading message and no details
function createCard(cardNumber) {
    $('#favorites_all_cards').append(`<div id="card${cardNumber}" class="card albumCard"><a class="album_details_link" href=""><img class="card-img-top" src="" alt=""><a/><div class="card-body"><h4 class="card-title"></h4><span class="album"><span class="text-primary">Loading Album Details...</span></span></div></div>`);
}

// populates the album card
function populateCard(albumNumber, results, cardNumber) {

    // set up album and artist trunction
    let smallArtist = results.artistName;
    let largeArtist = results.artistName;
    let smallAlbum = results.name;
    let largeAlbum = results.name;
    if (smallArtist.length > 32) { smallArtist = truncate(smallArtist, 32) } 
    if (smallAlbum.length > 44) { smallAlbum = truncate(smallAlbum, 44) } 

    if (largeArtist.length > 49) { largeArtist = truncate(largeArtist, 49) } 
    if (largeAlbum.length > 66) { largeAlbum = truncate(largeAlbum, 66) }
    
    // artist name
    $(`#card${cardNumber} .card-body h4`).html(`<span class="large_artist">${largeArtist}</span><span class="small_artist">${smallArtist}</span>`);
    // album name
    $(`#card${cardNumber} .card-body .album`).html(`<span class="large_album">${largeAlbum}</span><span class="small_album">${smallAlbum}</span>`); 
    // album cover
    $(`#card${cardNumber} img`).attr(
        'src', results.artwork.url.replace('{w}', 260).replace('{h}', 260));
    // add album-details-link to album cover
    $(`#card${cardNumber} .album_details_link`).attr(
        'href', `/albumdetails/${albumNumber}`);
};

// ----- START FIREBASE FAVORITES SECTION ------
var favoriteAlbums;

var favoritesRefrence = favoritesDatabase.ref().child('Ol5d5mjWi9eQ7HoANLhM4OFBnso2/My Favorites');
favoritesRefrence.on('value', snap => {
    favoriteAlbums = snap.val();

    startFavoritesPage();
});
// ----- END FIREBASE FAVORITES SECTION ------


function startFavoritesPage() {
    // clear any warnings
    $('#favorites_all_cards').html("");

    bubbleSort(favoriteAlbums, "releaseDate")

    // pull album id's into an array to sort them 
    let favoriteAlbumsArray = []
    for (let index = 0; index < favoriteAlbums.length; index++) {
        let element = favoriteAlbums[index];
        favoriteAlbumsArray.push(element.albumId)
    }
    // providing a compare function to sort by actual value, not first numbers
    // favoriteAlbumsArray.sort(function(a, b){return a-b});
    favoriteAlbumsArray.reverse();

    // create card and populate for each favorite album
    for (let index = 0; index < favoriteAlbumsArray.length; index++) {
        let album = favoriteAlbumsArray[index];
        let card = (index + 1);
        
        createCard(card);
        getAlbumInfo(album, card);
    }
};
