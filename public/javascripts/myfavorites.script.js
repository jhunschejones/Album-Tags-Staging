// ------- START UTILITIES SECTION ----------
console.log("The custom script for the 'myfavorites' page is running.");


function scrollToTop() {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}

function hideDOMelement(elementId) {
    try {
        let element = document.getElementById(elementId)
        element.style.display = "none";
    } catch (error) {
        // this element does not exist here
    }
}

function showDOMelement(elementId) {
    try {
        let element = document.getElementById(elementId)
        element.style.display = "block";
    } catch (error) {
        // this element does not exist here
    }
}

function replaceUnderscoreWithBackSlash(str) {
    return str.replace(/_/g, "/");
};

function replaceSpaceWithUnderscore(str) {
    return str.replace(/ /g,"_");
}

function replaceSepecialCharacters(str) {
    return str.replace(/[^\w\s]/gi, '');
}

function removeDash(str) {
    return str.replace(/-/g, '');
}

function removeDoubleSpace(str) {
    return str.replace(/\s\s+/g, ' ');
}

function isGenre(str) {
    let myGenres = ['Metalcore', 'Pop Punk', 'Emo', 'Rock', 'Post-Hardcore', 'Accoustic', 'Screamo', 'Metal', 'Nu Metal', 'Alt Metal', 'Djent']

    if (myGenres.indexOf(str) != -1) {
        return true
    } else {
        return false
    }
}

function removeDuplicates(inputArray){
    let outputArray = []
    for(let i = 0;i < inputArray.length; i++){
        if(outputArray.indexOf(inputArray[i]) == -1){
            outputArray.push(inputArray[i])
        }
    }
    return outputArray
}

function removeElementFromArray(array, element){
    if (array.indexOf(element) != -1) {
        array.splice(array.indexOf(element), 1)
    }
}

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

function truncatePlain(str, len){
    // set up the substring
    var subString = str.substr(0, len-1);

    return (
        // add elipse after last complete word
        subString.substr(0, subString.lastIndexOf(' '))
        // trim trailing comma
        .replace(/(^[,\s]+)|([,\s]+$)/g, '')
    )
};

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
    
    $.getJSON( '/api/v1/apple/albumdetails/' + albumNumber)
    .done(function(rawData) {     
    // send album info to populateCard
    try {
        populateCard(albumNumber, rawData.data[0].attributes, cardNumber);
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

    // Ben's Suggestions if performance is still lagging:
    // try fetch, https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
    // note: make sure to handle successful case and rejected case
    })
    .fail(function() { 
        console.log("error accessing Apple API");
    });
};

function createCard(cardNumber) {
    $('#all_cards').append(`<div id="card${cardNumber}" class="card albumCard"><a class="album_details_link" href=""><img class="card-img-top" src="" alt=""><a/><div class="card-body"><h4 class="card-title"></h4><span class="album"><span class="text-primary">Loading Album Details...</span></span></div></div>`);
}


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
    // add release year to card div as a class: year-YYYY
    $(`#card${cardNumber}`).addClass(`year-${results.releaseDate.slice(0,4)}`);
    // add artist to card div as: artist-NAME
    $(`#card${cardNumber}`).addClass(`artist-${replaceSpaceWithUnderscore(removeDoubleSpace(replaceSepecialCharacters(results.artistName)))}`);

    
    for (let index = 0; index < results.genreNames.length; index++) {
        let appleGenre = results.genreNames[index];

        if(notMyGenres.indexOf(appleGenre) == -1){
            $(`#card${cardNumber}`).addClass(`genre-${replaceSpaceWithUnderscore(replaceSepecialCharacters(appleGenre))}`);
        }
    }
    
    // album cover
    $(`#card${cardNumber} img`).attr(
        'src', results.artwork.url.replace('{w}', 260).replace('{h}', 260));
    // add album-details-link to album cover
    $(`#card${cardNumber} .album_details_link`).attr(
        'href', `/albumdetails/${albumNumber}`);

    // add to list of years to filter by 
    yearsList.push(`${results.releaseDate.slice(0,4)}`);
    appleGenreList.push(results.genreNames);
    artistsList.push(results.artistName);
};

// ----- START FIREBASE FAVORITES SECTION ------
var myFavoriteAlbums;

function updateFavoriteAlbums() {
    var favoritesRefrence = favoritesDatabase.ref().child(userID + "/My Favorites");
    favoritesRefrence.on('value', snap => {
        myFavoriteAlbums = snap.val() || [];

        startFavoritesPage();
    });
}
// ----- END FIREBASE FAVORITES SECTION ------



// ----------- START FILTERING FUNCTIONALITY --------------
var filterYear ='none';
var filterGenre ='none';
var filterArtist = 'none';
var filterTopTen = false;
var albumCardsList;
var yearsList = [];
var appleGenreList = [];
var yearsOnPage = [];
var artistsList = [];

function masterFilter(classToFilter) {
    if(classToFilter != 'none') {
        for (let index = 0; index < albumCardsList.length; index++) {
            let thisCard = albumCardsList[index];
            if(!$(thisCard).hasClass(classToFilter)) { thisCard.style.display = "none"; }
        }
    }
}

function restoreCards() {
    for (let index = 0; index < albumCardsList.length; index++) {
        albumCardsList[index].style.display = "inline";
    }
}

function clearFilters() {
    filterYear = 'none';
    filterGenre = 'none';
    filterArtist = 'none';
    if (filterTopTen == true) {
        toggleStar();
    }
    restoreCards();
    whatsOnThePage_genres()
    whatsOnThePage_years()
    whatsOnThePage_artists()
    whatsOnThePage_Top10()
}

// closes filter dropdown menu's when page is scrolling
$(document).on( 'scroll', function(){
    $('#year_filter_menu').removeClass('show');
    $('#genre_filter_menu').removeClass('show');
    // $('#artist_filter_menu').removeClass('show');
});

// filters artists in filter to match what albums are on page
function whatsOnThePage_artists() {
    let whatsLeft = $('.albumCard:visible')
    let artistOnPage = []
    let choppedArtistsOnPage = []

    for (let index = 0; index < whatsLeft.length; index++) {
        let element = $(`#${whatsLeft[index].id}`).prop("classList")[3];
        artistOnPage.push(element)
    }

    // for (let index = 0; index < artistOnPage.length; index++) {
    //     let element = artistOnPage[index];
    //     let chopped = element.substr(0, 39);
    //     chopped = chopped.substr(0, chopped.lastIndexOf('_')).replace(/(^[,\s]+)|([,\s]+$)/g, '')
    //     choppedArtistsOnPage.push(chopped)
    // }

    let artistFilters = $('.artist_to_filter_by')
    for (let index = 0; index < artistFilters.length; index++) {
        let element = artistFilters[index].id;
        
        if (artistOnPage.indexOf(element) == -1) {
            $(`#${element}`).hide()
        } else {
            $(`#${element}`).show()
        }
    }
}

// filters genres in filter to match what albums are on page
function whatsOnThePage_genres() {
    let whatsLeft = $('.albumCard:visible')
    let genreOnPage = []

    for (let index = 0; index < whatsLeft.length; index++) {
        let element = $(`#${whatsLeft[index].id}`).prop("classList");
        
        for (let index = 4; index < element.length; index++) {
            let genre = element[index];
            genreOnPage.push(genre)   
        }
    }

    let genreFilters = $('.genre_to_filter_by')
    for (let index = 0; index < genreFilters.length; index++) {
        let element = genreFilters[index].id;
        if (genreOnPage.indexOf(element) == -1) {
            $(`#${element}`).hide()
        } else {
            $(`#${element}`).show()
        }
    }
}

// filters years in filter to match what albums are on page
function whatsOnThePage_years() {
    let whatsLeft = $('.albumCard:visible')
    let yearsOnPage = []

    for (let index = 0; index < whatsLeft.length; index++) {
        let element = $(`#${whatsLeft[index].id}`).prop("classList")[2];
        yearsOnPage.push(element)
    }

    let yearFilters = $('.year_to_filter_by')
    for (let index = 0; index < yearFilters.length; index++) {
        let element = yearFilters[index].id;
        if (yearsOnPage.indexOf(element) == -1) {
            $(`#${element}`).hide()
        } else {
            $(`#${element}`).show()
        }
    }
}

// filters top_10 in filter to match what albums are on page
function whatsOnThePage_Top10() {
    let whatsLeft = $('.albumCard:visible')

    let top10 = false
    for (let index = 0; index < whatsLeft.length; index++) {
        let element = $(`#${whatsLeft[index].id}`).prop("classList");
        
        for (let index = 4; index < element.length; index++) {
            let tag = element[index];
            if (tag == "Top_10") {
                top10 = true
            }
        }
    }

    if (top10 == true) {
        $('#top_10_button').show()
    } else {
        $('#top_10_button').hide()
    }
}


// ------------------ START YEARS FILTERS --------------------

// this populates the years the user can filter by in the dropdown
function buildYearFilters() {
    // clear everythig in list
    $('#year_filter_menu').html("");
    $('#year_filter_menu').append('<small id="loading_year_filters" class="text-primary" style="margin-left:8px;">Loading Year Filters...</small>')

    yearsList = removeDuplicates(yearsList);
    yearsList.sort().reverse();

    // add each year to list
    for (let index = 0; index < yearsList.length; index++) {
        let year = yearsList[index];
        if(filterYear == `year-${year}`){
            $('#year_filter_menu').append(`<a id="year-${year}" class="badge badge-primary year_to_filter_by" href="#" onclick="filterByYear(${year})">${year}</a>`)
        } else {
            $('#year_filter_menu').append(`<a id="year-${year}" class="badge badge-light year_to_filter_by" href="#" onclick="filterByYear(${year})">${year}</a>`)
        }
    }

    $('#loading_year_filters').hide();
    whatsOnThePage_years()  
};

function filterByYear(year) {
    if(document.getElementById(`year-${year}`).classList.contains("badge-primary")){
        filterYear = 'none';
    } else {
        filterYear = `year-${year}`;
    }
    
    restoreCards();
    masterFilter(filterGenre);
    masterFilter(filterYear);
    masterFilter(filterArtist);
    filterByTopTen(filterTopTen)
    whatsOnThePage_Top10()
    // whatsOnThePage_genres()
    // whatsOnThePage_artists()
};
// ------------------ END YEARS FILTERS --------------------



// ------------------ START GENRE FILTERS --------------------
var genresList = [];

// this populates the Tags card with any tags stored in the mongodb database
// and retrieved by the router stored at the URL listed with the album number
function getGenreTags(albumNumber, cardNumber) {

    $.getJSON ( '/api/v1/tags/' + albumNumber, function(rawData) {
        if (typeof(rawData[0]) != "undefined") {
            

            var tags = rawData[0].tags;
            // var authors = rawData[0].createdBy;
            var tagsObjects = rawData[0].createdBy;

            for (let index = 0; index < tags.length; index++) {
                var tag = tags[index];
                var tagObject = tagsObjects[index]
                tag = replaceUnderscoreWithBackSlash(tag);

                if(isGenre(tag) == true){
                    genresList.push(tag);             
                    
                    // add genre as a class on the card
                    tag = replaceSepecialCharacters(tag)
                    tag = replaceSpaceWithUnderscore(tag)
                    $(`#card${cardNumber}`).addClass(`genre-${tag}`);
                } else {
                    // none of these tags are genres
                }

                try {
                    if (tagObject.tag == "Top 10" & tagObject.author == userID) {
                        // using for top 10 functionality later
                        $("#top_10_button").show();
                        $(`#card${cardNumber}`).addClass("Top_10");
                    } else {
                        // console.log("There are no top 10 records")
                    }
                } catch (error) {
                    console.log(albumNumber)
                }
            };
        };
    });
};

var notMyGenres = ["Music", "Adult Alternative", "CCM", "Christian & Gospel", "Christian Rock", "College Rock", "Hard Rock", "Punk", "Death Metal/Black Metal", "Christian Metal"]

function buildGenreFilters() {
    // clear everythig in list
    $('#genre_filter_menu').html("");
    $('#genre_filter_menu').append('<small id="loading_genre_filters" class="text-primary" style="margin-left:8px;">Loading Genre Filters...</small>')

    // flatten array and remove duplicates
    appleGenreList = removeDuplicates(appleGenreList.reduce((a, b) => a.concat(b), []));
    for (let index = 0; index < notMyGenres.length; index++) {
        let genre = notMyGenres[index];
        removeElementFromArray(appleGenreList,genre)
    }

    genresList = removeDuplicates(genresList.concat(appleGenreList));
    genresList.sort();

    // add each genre to list
    for (let index = 0; index < genresList.length; index++) {
        let genre = genresList[index];
        if(filterGenre == `genre-${replaceSpaceWithUnderscore(replaceSepecialCharacters(genre))}`) {
            $('#genre_filter_menu').append(`<a id="genre-${replaceSpaceWithUnderscore(replaceSepecialCharacters(genre))}" class="badge badge-primary genre_to_filter_by" href="#" onclick="filterByGenre('${genre}')">${genre}</a>`);
        } else {
            $('#genre_filter_menu').append(`<a id="genre-${replaceSpaceWithUnderscore(replaceSepecialCharacters(genre))}" class="badge badge-light genre_to_filter_by" href="#" onclick="filterByGenre('${genre}')">${genre}</a>`);
        }       
    }

    $('#loading_genre_filters').hide();
    whatsOnThePage_genres()
};

function filterByGenre(genre){
    if(document.getElementById(`genre-${replaceSpaceWithUnderscore(replaceSepecialCharacters(genre))}`).classList.contains("badge-primary")){
        filterGenre = 'none';
    } else {
        filterGenre = `genre-${replaceSpaceWithUnderscore(replaceSepecialCharacters(genre))}`;
    }

    restoreCards();
    masterFilter(filterGenre);
    masterFilter(filterYear);
    masterFilter(filterArtist);
    filterByTopTen(filterTopTen)
    whatsOnThePage_Top10()
    // whatsOnThePage_years()
    // whatsOnThePage_artists()
}

function startTags() {
    if (myFavoriteAlbums.length != 0) {
        for (let index = 0; index < myFavoriteAlbums.length; index++) {
            let album = myFavoriteAlbums[index];
            let card = (index + 1)
            getGenreTags(album, card);   
        }
    }    
}
// ------------------ END GENRE FILTERS --------------------


// ------------------ START ARTIST FILTERS --------------------
function buildArtistFilters() {
    // clear everythig in list
    $('#artist_filter_menu').html("");
    $('#artist_filter_menu').append('<small id="loading_artist_filters" class="text-primary" style="margin-left:8px;">Loading Artist Filters...</small>')
    artistsList = removeDuplicates(artistsList);
    artistsList.sort();

    // add each artist to list
    for (let index = 0; index < artistsList.length; index++) {
        let artist = artistsList[index];
        let longArtist = artist;
        
        if (artist.length > 40) { artist = truncate(artist, 32) }

        let cleanArtist = replaceSpaceWithUnderscore(removeDoubleSpace(replaceSepecialCharacters(longArtist)));
        
        if(filterArtist == `artist-${cleanArtist}`){
            $('#artist_filter_menu').append(`<a id="artist-${cleanArtist}" class="badge badge-primary artist_to_filter_by" href="#" onclick="filterByArtist('${cleanArtist}')">${artist}</a>`)
        } else {
            $('#artist_filter_menu').append(`<a id="artist-${cleanArtist}" class="badge badge-light artist_to_filter_by" href="#" onclick="filterByArtist('${cleanArtist}')">${artist}</a>`)
        }
    } 

    $('#loading_artist_filters').hide();
    whatsOnThePage_artists() 
};

function filterByArtist(artist) {
    let cleanArtist = 
        replaceSpaceWithUnderscore(removeDoubleSpace(replaceSepecialCharacters(artist)));

    if(document.getElementById(`artist-${cleanArtist}`).classList.contains("badge-primary")){
        filterArtist = 'none';
    } else {
        filterArtist = `artist-${cleanArtist}`;
    }
    
    restoreCards();
    masterFilter(filterGenre);
    masterFilter(filterYear);
    masterFilter(filterArtist);
    filterByTopTen(filterTopTen)
    whatsOnThePage_Top10()
    // whatsOnThePage_genres()
    // whatsOnThePage_years()
};
// ------------------ END ARTIST FILTERS --------------------


// ------------------ START TOP 10 FILTERS --------------------
function toggleStar() {
    if($("#top_star_full").is(":visible")){
        $("#top_star_full").hide()
        $("#top_star_empty").show()
        filterTopTen = false
    } else {
        $("#top_star_full").show()
        $("#top_star_empty").hide() 
        filterTopTen = true
    }
}

function selectTopTen() {
    toggleStar();

    restoreCards();
    masterFilter(filterGenre);
    masterFilter(filterYear);
    masterFilter(filterArtist);
    filterByTopTen(filterTopTen)
}

function filterByTopTen(classToFilter) {
    if(classToFilter != false) {
        for (let index = 0; index < albumCardsList.length; index++) {
            let thisCard = albumCardsList[index];
            if(!$(thisCard).hasClass("Top_10")) { thisCard.style.display = "none"; }
        }
    }
};
// ------------------ END TOP 10 FILTERS --------------------

// ----------- END FILTERING FUNCTIONALITY --------------



function startFavoritesPage() {
    // clear any warnings
    $('#all_cards').html("");

    // display instructions if no favorites exist for this user
    if (myFavoriteAlbums.length == 0) {
        showDOMelement("log_in_message")
        $('#log_in_message').html("<div style='text-align:center;margin: 20px 0px 50px 0px;'><p>Looks like you don't have any favorites yet!</p><p><a href='/search'>Search</a> for albums and use the <img src='../images/heart-unliked.png' height='30' width='auto'> icon to add them to your favorites.</p></div>");
        hideDOMelement("filter_by_genre_dropdown_button");
        hideDOMelement("filter_by_year_dropdown_button");
        hideDOMelement("filter_by_artist_dropdown_button");
        hideDOMelement("clear_filters_button");
        hideDOMelement("to_top_button");
    } else {
        $('#log_in_message').html("");
    }
    $('#artist_filter_menu').html("");
    $('#artist_filter_menu').append('<small id="loading_artist_filters" class="text-primary" style="margin-left:8px;">Loading Artist Filters...</small>')

    bubbleSort(myFavoriteAlbums, "releaseDate")

    // pull album id's into an array to sort them 
    let myFavoriteAlbumsArray = []
    for (let index = 0; index < myFavoriteAlbums.length; index++) {
        let element = myFavoriteAlbums[index];
        myFavoriteAlbumsArray.push(element.albumId)
    }

    // providing a compare function to sort by actual value, not first numbers
    // reverse shows newer albums first (mostly)
    // myFavoriteAlbums = myFavoriteAlbumsArray.sort(function(a, b){return a-b}).reverse();
    myFavoriteAlbums = myFavoriteAlbumsArray.reverse()

    // create card and populate for each favorite album
    for (let index = 0; index < myFavoriteAlbums.length; index++) {
        let album = myFavoriteAlbums[index];
        let card = (index + 1);
        
        createCard(card)
        getAlbumInfo(album, card) 
    }
    // populate our list of dom elements for filtering 
    albumCardsList = $(".albumCard");
    startTags();
};

// ------------- start tooltips section -----------
var isTouchDevice = false

$(function () {
    if ("ontouchstart" in document.documentElement) {
        isTouchDevice = true
    }
    
    if(isTouchDevice == false) {
        $('[data-toggle="tooltip"]').tooltip()
    }
})
// combine with data-trigger="hover" in html element 
// for desired behavior
// -------------- end tooltips section --------------




// ======= RUN THIS FUNCTION WHILE LOGGED IN TO UPDATE DATABASE =======
let albumID 
let newFavorite
let artist
let album
let release


function timedSteps(index) {
    albumID = favoritesToUpdate[index];
    
    $.getJSON ( '/api/v1/apple/albumdetails/' + albumID, function(rawData) {
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
        
        if (index < myFavoriteAlbums.length) { 
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
// console.log('1. Run this: favoritesToUpdate = myFavoriteAlbums'
// + '\n' + '2. Then run this: startFavoritesUpdate()'
// + '\n' + '3. Check updatedFavorites array for undefined values and use array.splice(index, 1) to take these off'
// + '\n' + '4. Last run this: finishUpdate()')
