// ------- START UTILITIES SECTION ----------
// ======
// To compile with google closure compiler
// instructions: https://developers.google.com/closure/compiler/docs/gettingstarted_app
// terminal command: `java -jar compiler.jar --js myfavorites.script.js --js_output_file myfavorites.script.min.js`
// ======
function scrollToTop() {
  document.body.scrollTop = 0 // For Safari
  document.documentElement.scrollTop = 0 // For Chrome, Firefox, IE and Opera
}

function hideDOMelement(elementId) {
  try {
    let element = document.getElementById(elementId)
    element.style.display = "none"
  } catch (error) {
    // this element does not exist here
  }
}

function showDOMelement(elementId) {
  try {
    let element = document.getElementById(elementId)
    element.style.display = "block"
  } catch (error) {
    // this element does not exist here
  }
}

function replaceUnderscoreWithBackSlash(str) {
  return str.replace(/_/g, "/")
}

function replaceSpaceWithUnderscore(str) {
  return str.replace(/ /g,"_")
}

function replaceSepecialCharacters(str) {
  return str.replace(/[^\w\s]/gi, '')
}

function removeDash(str) {
  return str.replace(/-/g, '')
}

function removeDoubleSpace(str) {
  return str.replace(/\s\s+/g, ' ')
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
  var subString = str.substr(0, len-1)
  
  return (
    // add elipse after last complete word
    subString.substr(0, subString.lastIndexOf(' '))
    // trim trailing comma
    .replace(/(^[,\s]+)|([,\s]+$)/g, '') + '...'
  )
}

function truncatePlain(str, len){
  // set up the substring
  var subString = str.substr(0, len-1)

  return (
    // add elipse after last complete word
    subString.substr(0, subString.lastIndexOf(' '))
    // trim trailing comma
    .replace(/(^[,\s]+)|([,\s]+$)/g, '')
  )
}

function bubbleSort(arr, prop) {
  var swapped
  do {
    swapped = false
    for (var i = 0; i < arr.length - 1; i++) {
      if (parseInt(removeDash(arr[i][prop])) > parseInt(removeDash(arr[i + 1][prop]))) {
        var temp = arr[i]
        arr[i] = arr[i + 1]
        arr[i + 1] = temp
        swapped = true
      }
    }
  } while (swapped)
}
// ------- END UTILITIES SECTION ----------

// === UI MODIFICATION FOR MOBILE MENU BAR ===
function addInfoButtons() {
  const infoButtonSmall = '<span class="text-secondary ml-2 float-right page-info-button" style="cursor:pointer;" data-toggle="modal" data-target="#pageInfoModal">&#9432;</span>';
  $('#compact_menu p').width("80%");
  $('.my_dropdown').css("margin-top", "-2px");
  $('#compact_menu p').append(infoButtonSmall);
  
  // btn-outline-secondary
  const infoButtonLage = '<button class="btn btn-sm btn-light sticky-top float-left button_text ml-1" style="cursor:pointer;margin-top:2px;" data-toggle="modal" data-target="#pageInfoModal">&#9432;</button>';
  const addAlbumButtonLarge = '<button class="btn btn-sm btn-light sticky-top float-left button_text ml-1" style="cursor:pointer;margin-top:2px;" data-toggle="modal" data-target="#addFavoritesAlbumModal">Add Album</button>';
  $('#all-favorites-filters').append(addAlbumButtonLarge);
  $('#all-favorites-filters').append(infoButtonLage);
}

addInfoButtons();

$('.add-album-instruction-link').click(function(event) {
  event.preventDefault();
  $('#pageInfoModal').modal('hide');
  $('#addFavoritesAlbumModal').modal('show');
});
// === END UI MODIFICATION FOR MOBILE MENU BAR ===

function createCard(album, cardNumber) {
  $('#all_cards').append(`<div id="card${cardNumber}" class="card albumCard"><a class="album_details_link" href=""><img class="card-img-top" src="" alt=""><a/><span class="remove-favorite-button" data-album-id="${album._id}">&#10005;</span><div class="card-body"><h4 class="card-title"></h4><span class="album"><span class="text-primary">Loading Album Details...</span></span></div></div>`)
}

function populateCard(album, cardNumber) {
  // set up album and artist trunction
  let smallArtist = album.artist
  let largeArtist = album.artist
  let smallAlbum = album.title
  let largeAlbum = album.title
  if (smallArtist.length > 32) { smallArtist = truncate(smallArtist, 32) } 
  if (smallAlbum.length > 44) { smallAlbum = truncate(smallAlbum, 44) } 

  if (largeArtist.length > 49) { largeArtist = truncate(largeArtist, 49) } 
  if (largeAlbum.length > 66) { largeAlbum = truncate(largeAlbum, 66) }
  
  // artist name
  $(`#card${cardNumber} .card-body h4`).html(`<span class="large_artist">${largeArtist}</span><span class="small_artist">${smallArtist}</span>`)
  // album name
  $(`#card${cardNumber} .card-body .album`).html(`<span class="large_album">${largeAlbum}</span><span class="small_album">${smallAlbum}</span>`) 
  // add release year to card div as a class: year-YYYY
  $(`#card${cardNumber}`).addClass(`year-${album.releaseDate.slice(0,4)}`)
  // add artist to card div as: artist-NAME
  $(`#card${cardNumber}`).addClass(`artist-${replaceSpaceWithUnderscore(removeDoubleSpace(replaceSepecialCharacters(album.artist)))}`)

  
  for (let index = 0; index < album.genres.length; index++) {
    let appleGenre = album.genres[index]

    if(notMyGenres.indexOf(appleGenre) == -1){
      $(`#card${cardNumber}`).addClass(`genre-${replaceSpaceWithUnderscore(replaceSepecialCharacters(appleGenre))}`)
    }
  }
  
  // album cover
  $(`#card${cardNumber} img`).attr(
      'src', album.cover.replace('{w}', 260).replace('{h}', 260))
  // add album-details-link to album cover
  $(`#card${cardNumber} .album_details_link`).attr(
      'href', `/album/${album.appleAlbumID}`)

  // add to list of years to filter by 
  yearsList.push(`${album.releaseDate.slice(0,4)}`)
  appleGenreList.push(album.genres)
  artistsList.push(album.artist)
}

document.getElementById("share-favorites-button").addEventListener("click", function() {
  $('#shareFavoritesModal').modal('show')
})

document.getElementById("get-shareable-link").addEventListener("click", function() {
  let displayName = $('#display-name-input').val()

  $.ajax(`/api/v1/list/favorites/${userID}`, {
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({
      "displayName": displayName
    }),
    success: function (data) {
      const myFavoritesURL = window.location.protocol + "//" + window.location.host + "/list?type=favorites&id=" + data

      const urlBox = document.getElementById("shareable-url")
      urlBox.value = myFavoritesURL
      urlBox.select()

      navigator.clipboard.writeText(myFavoritesURL).then(function() {
        // show message if clipboard write succeeded
        $('#copied-message').show()
        setTimeout(function(){ $('#copied-message').hide(); }, 3000)
      }, function() {
        // clipboard write failed
      })
    }
  })
})

// ----- START FIREBASE AUTH SECTION ------
// == New Config, November 2018 == 
const config = {
  apiKey: "AIzaSyAoadL6l7wVMmMcjqqa09_ayEC8zwnTyrc",
  authDomain: "album-tags-v1d1.firebaseapp.com",
  projectId: "album-tags-v1d1",
}
const defaultApp = firebase.initializeApp(config)

// checking if user is logged in or logs in during session
firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    userID = firebase.auth().currentUser.uid
    $('#all-favorites-filters').show()
    getFavoriteAlbums()

    $('#full_menu_login_logout_container').show()
    $('#login_button').hide()
    $('#full_menu_login_button').hide()
    $('#logout_button').show()
    $('#full_menu_logout_button').show()
    $('#log_in_message').hide()
  } else {   
    // no user logged in
    $('#full_menu_login_logout_container').show()
    $('#login_button').show()
    $('#full_menu_login_button').show()
    $('#logout_button').hide()
    $('#full_menu_logout_button').hide()
    $('#loader').hide()

    $('#all-favorites-filters').hide()
    $('#all_cards').html('')
    $('#log_in_message').show()   
  }
})

let userID
function logIn() {
  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  // local persistance remains if browser is closed
  .then(function() {
    var provider = new firebase.auth.GoogleAuthProvider()
    return firebase.auth().signInWithPopup(provider)
  })
  .then(function(result) {
    $('#all-favorites-filters').show()
    userID = user.uid
    getFavoriteAlbums()

    $('#full_menu_login_logout_container').show()
    $('#login_button').hide()
    $('#full_menu_login_button').hide()
    $('#logout_button').show()
    $('#full_menu_logout_button').show()

  }).catch(function(error) {
    // Handle Errors here.
  })
}

function logOut() {
  firebase.auth().signOut().then(function() {
    // log out functionality
    // $('#full_menu_login_logout_container').show()
    // $('#login_button').show()
    // $('#full_menu_login_button').show()
    // $('#logout_button').hide()
    // $('#full_menu_logout_button').hide()
    // $('#all-favorites-filters').hide();
    location.reload();

  }).catch(function(error) {
  // An error happened.
  })
}

// add event listener to log in and out buttons
const loginButton = document.getElementById("login_button")
const loginButton2 = document.getElementById("full_menu_login_button")
const logoutButton = document.getElementById("logout_button")
const logoutButton2 = document.getElementById("full_menu_logout_button")
loginButton.addEventListener("click", logIn)
loginButton2.addEventListener("click", logIn)
logoutButton.addEventListener("click", logOut)
logoutButton2.addEventListener("click", logOut)
$('.login_button').on('click', logIn)


let myFavoriteAlbums

function getFavoriteAlbums() {
  $.ajax({
    method: "GET",
    url: "/api/v1/album/favorites/" + userID,
    success: function(data) {
      if (data.message && data.message === "This user does not have any favorited albums.") {
        myFavoriteAlbums = [];
        startFavoritesPage()
      } else if (data.message) {
        alert(data.message)
      } else {
        myFavoriteAlbums = data
        startFavoritesPage()
      }
    }
  })
}
// ----- END FIREBASE AUTH SECTION ------



// ----------- START FILTERING FUNCTIONALITY --------------
var filterYear ='none'
var filterGenre ='none'
var filterArtist = 'none'
var filterTopTen = false
var albumCardsList
var yearsList = []
var appleGenreList = []
var yearsOnPage = []
var artistsList = []

function masterFilter(classToFilter) {
  if(classToFilter != 'none') {
    for (let index = 0; index < albumCardsList.length; index++) {
      let thisCard = albumCardsList[index]
      if(!$(thisCard).hasClass(classToFilter)) { thisCard.style.display = "none"; }
    }
  }
}

function restoreCards() {
  for (let index = 0; index < albumCardsList.length; index++) {
    albumCardsList[index].style.display = "inline-flex"
  }
}

function clearFilters() {
  filterYear = 'none'
  filterGenre = 'none'
  filterArtist = 'none'
  if (filterTopTen) {
    toggleStar()
  }
  restoreCards()
  whatsOnThePage_genres()
  whatsOnThePage_years()
  whatsOnThePage_artists()
  whatsOnThePage_Top10()
}

// closes filter dropdown menu's when page is scrolling
$(document).on( 'scroll', function(){
  $('#year_filter_menu').removeClass('show');
  $('#genre_filter_menu').removeClass('show');
  $('#artist_filter_menu').removeClass('show');
});

// filters artists in filter to match what albums are on page
function whatsOnThePage_artists() {
  let whatsLeft = $('.albumCard:visible')
  let artistOnPage = []
  let choppedArtistsOnPage = []

  for (let index = 0; index < whatsLeft.length; index++) {
    let element = $(`#${whatsLeft[index].id}`).prop("classList")[3]
    artistOnPage.push(element)
  }

  let artistFilters = $('.artist_to_filter_by')
  for (let index = 0; index < artistFilters.length; index++) {
    let element = artistFilters[index].id
    
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
    let element = $(`#${whatsLeft[index].id}`).prop("classList")
      
    for (let index = 4; index < element.length; index++) {
      let genre = element[index]
      genreOnPage.push(genre)   
    }
  }

  let genreFilters = $('.genre_to_filter_by')
  for (let index = 0; index < genreFilters.length; index++) {
    let element = genreFilters[index].id
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
    let element = $(`#${whatsLeft[index].id}`).prop("classList")[2]
    yearsOnPage.push(element)
  }

  let yearFilters = $('.year_to_filter_by')
  for (let index = 0; index < yearFilters.length; index++) {
    let element = yearFilters[index].id
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
    let element = $(`#${whatsLeft[index].id}`).prop("classList")
    
    for (let index = 4; index < element.length; index++) {
      let tag = element[index]
      if (tag == "Top_10") {
        top10 = true
      }
    }
  }

  if (top10) {
    $('#top_10_button').show()
  } else {
    $('#top_10_button').hide()
  }
}


// ------------------ START YEARS FILTERS --------------------

// this populates the years the user can filter by in the dropdown
function buildYearFilters() {
  // clear everythig in list
  $('#year_filter_menu').html("")
  $('#year_filter_menu').append('<small id="loading_year_filters" class="text-primary" style="margin-left:8px;">Loading Year Filters...</small>')

  yearsList = removeDuplicates(yearsList)
  yearsList.sort().reverse()

  // add each year to list
  for (let index = 0; index < yearsList.length; index++) {
    let year = yearsList[index]
    if(filterYear == `year-${year}`){
      $('#year_filter_menu').append(`<a id="year-${year}" class="badge badge-primary year_to_filter_by" href="" onclick="filterByYear(${year}, event)">${year}</a>`)
    } else {
      $('#year_filter_menu').append(`<a id="year-${year}" class="badge badge-light year_to_filter_by" href="" onclick="filterByYear(${year}, event)">${year}</a>`)
    }
  }

  $('#loading_year_filters').hide()
  whatsOnThePage_years()  
}

function filterByYear(year, event) {
  if (event) { event.preventDefault(); }
  if(document.getElementById(`year-${year}`).classList.contains("badge-primary")){
    filterYear = 'none'
  } else {
    filterYear = `year-${year}`
  }
  
  restoreCards()
  masterFilter(filterGenre)
  masterFilter(filterYear)
  masterFilter(filterArtist)
  filterByTopTen(filterTopTen)
  whatsOnThePage_Top10()
  // whatsOnThePage_genres()
  // whatsOnThePage_artists()
}
// ------------------ END YEARS FILTERS --------------------



// ------------------ START GENRE FILTERS --------------------
var genresList = []

// this populates the Tags card with any tags stored in the mongodb database
// and retrieved by the router stored at the URL listed with the album number
function getGenreTags(album, cardNumber) {
  if (album && !album.message && album.tagObjects && album.tagObjects.length > 0) {
    for (let index = 0; index < album.tagObjects.length; index++) {
      var tagObject = album.tagObjects[index]
      var tag = tagObject.tag
      // tag = replaceUnderscoreWithBackSlash(tag)

      if(isGenre(tag)){
        genresList.push(tag)             
          
        // add genre as a class on the card
        tag = replaceSepecialCharacters(tag)
        tag = replaceSpaceWithUnderscore(tag)
        $(`#card${cardNumber}`).addClass(`genre-${tag}`)
      } else {
        // none of these tags are genres
      }

      if (tagObject.tag === "Top 10" & tagObject.creator === userID) {
        // using for top 10 functionality later
        $("#top_10_button").show()
        $(`#card${cardNumber}`).addClass("Top_10")
      } else {
        // the user has not added a `Top 10` tag
      }
    }
  }
}

var notMyGenres = ["Music", "Adult Alternative", "CCM", "Christian & Gospel", "Christian Rock", "College Rock", "Hard Rock", "Punk", "Death Metal/Black Metal", "Christian Metal", "Hair Metal"]

function buildGenreFilters() {
  // clear everythig in list
  $('#genre_filter_menu').html("")
  $('#genre_filter_menu').append('<small id="loading_genre_filters" class="text-primary" style="margin-left:8px;">Loading Genre Filters...</small>')

  // flatten array and remove duplicates
  appleGenreList = removeDuplicates(appleGenreList.reduce((a, b) => a.concat(b), []))
  for (let index = 0; index < notMyGenres.length; index++) {
    let genre = notMyGenres[index]
    removeElementFromArray(appleGenreList,genre)
  }

  genresList = removeDuplicates(genresList.concat(appleGenreList))
  genresList.sort()

  // add each genre to list
  for (let index = 0; index < genresList.length; index++) {
    let genre = genresList[index]
    if(filterGenre == `genre-${replaceSpaceWithUnderscore(replaceSepecialCharacters(genre))}`) {
      $('#genre_filter_menu').append(`<a id="genre-${replaceSpaceWithUnderscore(replaceSepecialCharacters(genre))}" class="badge badge-primary genre_to_filter_by" href="" onclick="filterByGenre('${genre}', event)">${genre}</a>`)
    } else {
      $('#genre_filter_menu').append(`<a id="genre-${replaceSpaceWithUnderscore(replaceSepecialCharacters(genre))}" class="badge badge-light genre_to_filter_by" href="" onclick="filterByGenre('${genre}', event)">${genre}</a>`)
    }       
  }

  $('#loading_genre_filters').hide()
  whatsOnThePage_genres()
}

function filterByGenre(genre, event){
  if (event) { event.preventDefault(); }
  if(document.getElementById(`genre-${replaceSpaceWithUnderscore(replaceSepecialCharacters(genre))}`).classList.contains("badge-primary")){
      filterGenre = 'none'
  } else {
    filterGenre = `genre-${replaceSpaceWithUnderscore(replaceSepecialCharacters(genre))}`
  }

  restoreCards()
  masterFilter(filterGenre)
  masterFilter(filterYear)
  masterFilter(filterArtist)
  filterByTopTen(filterTopTen)
  whatsOnThePage_Top10()
  // whatsOnThePage_years()
  // whatsOnThePage_artists()
}

function startTags() {
  if (myFavoriteAlbums.length > 0) {
    for (let index = 0; index < myFavoriteAlbums.length; index++) {
      let album = myFavoriteAlbums[index]
      let card = (index + 1)
      getGenreTags(album, card)   
    }
  }    
}
// ------------------ END GENRE FILTERS --------------------


// ------------------ START ARTIST FILTERS --------------------
function buildArtistFilters() {
  // clear everythig in list
  $('#artist_filter_menu').html("")
  $('#artist_filter_menu').append('<small id="loading_artist_filters" class="text-primary" style="margin-left:8px;">Loading Artist Filters...</small>')
  artistsList = removeDuplicates(artistsList)
  artistsList.sort()

  // add each artist to list
  for (let index = 0; index < artistsList.length; index++) {
    let artist = artistsList[index]
    let longArtist = artist
    
    if (artist.length > 40) { artist = truncate(artist, 32) }

    let cleanArtist = replaceSpaceWithUnderscore(removeDoubleSpace(replaceSepecialCharacters(longArtist)))
    
    if(filterArtist == `artist-${cleanArtist}`){
      $('#artist_filter_menu').append(`<a id="artist-${cleanArtist}" class="badge badge-primary artist_to_filter_by" href="" onclick="filterByArtist('${cleanArtist}', event)">${artist}</a>`)
    } else {
      $('#artist_filter_menu').append(`<a id="artist-${cleanArtist}" class="badge badge-light artist_to_filter_by" href="" onclick="filterByArtist('${cleanArtist}', event)">${artist}</a>`)
    }
  } 

  $('#loading_artist_filters').hide()
  whatsOnThePage_artists() 
}

function filterByArtist(artist, event) {
  if (event) { event.preventDefault(); }
  let cleanArtist = 
    replaceSpaceWithUnderscore(removeDoubleSpace(replaceSepecialCharacters(artist)))

  if(document.getElementById(`artist-${cleanArtist}`).classList.contains("badge-primary")){
    filterArtist = 'none'
  } else {
    filterArtist = `artist-${cleanArtist}`
  }
  
  restoreCards()
  masterFilter(filterGenre)
  masterFilter(filterYear)
  masterFilter(filterArtist)
  filterByTopTen(filterTopTen)
  whatsOnThePage_Top10()
  // whatsOnThePage_genres()
  // whatsOnThePage_years()
}
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
  toggleStar()

  restoreCards()
  masterFilter(filterGenre)
  masterFilter(filterYear)
  masterFilter(filterArtist)
  filterByTopTen(filterTopTen)
}

function filterByTopTen(classToFilter) {
  if(classToFilter != false) {
    for (let index = 0; index < albumCardsList.length; index++) {
      let thisCard = albumCardsList[index]
      if(!$(thisCard).hasClass("Top_10")) { thisCard.style.display = "none"; }
    }
  }
}
// ------------------ END TOP 10 FILTERS --------------------

// ----------- END FILTERING FUNCTIONALITY --------------


let addAlbumResults = [];
function populateAddToFavoritesModalResults(data) {
  $('#favorites-search-results').html('');
  $('#addFavoritesAlbumModal .new-loader').hide();
  if (data.albums && data.albums.length > 0) {
    for (let index = 0; index < data.albums.length; index++) {
      const album = data.albums[index];
      const cardNumber = index;
      createFavoritesModalCard(cardNumber);
      populateFavoritesModalCard(album, cardNumber);
    }
    // this adds an empty space at the end so the user can scroll 
    // all the way to the right to see the last album
    createFavoritesModalCard(data.albums.length + 1)
    addAlbumResults = data.albums;
  } else {
    $('#favorites-search-results').after('<div id="no-results-message" class="text-primary mb-3" style="text-align:center;">It looks like no albums matched your search terms. Try a different search!</div>');
  }
}

function createFavoritesModalCard(cardNumber) {
  $('#favorites-search-results').append(`<div id="addFavoritesModalCard${cardNumber}" class="search-modal-card" data-result-index="${cardNumber}"><img class="search-modal-card-image" src="" alt=""><div class="search-modal-card-body"><h4 class="search-modal-card-title"></h4><span class="search-modal-card-album"></span></div></div>`)
}

function populateFavoritesModalCard(album, cardNumber) {
  // set up album and artist trunction
  let smallArtist = album.artist
  let largeArtist = album.artist
  let smallAlbum = album.title
  let largeAlbum = album.title
  if (smallArtist.length > 32) { smallArtist = truncate(smallArtist, 32) } 
  if (smallAlbum.length > 44) { smallAlbum = truncate(smallAlbum, 44) } 

  if (largeArtist.length > 49) { largeArtist = truncate(largeArtist, 49) } 
  if (largeAlbum.length > 66) { largeAlbum = truncate(largeAlbum, 66) }
  
  // artist name
  $(`#addFavoritesModalCard${cardNumber} .search-modal-card-title`).html(`<span class="search-modal-card-large-artist">${largeArtist}</span><span class="search-modal-card-small-artist">${smallArtist}</span>`)
  // album name
  $(`#addFavoritesModalCard${cardNumber} .search-modal-card-album`).html(`<span class="search-modal-card-large-album">${largeAlbum}</span><span class="search-modal-card-small-album">${smallAlbum}</span>`) 
  // album cover
  $(`#addFavoritesModalCard${cardNumber} .search-modal-card-image`).attr('src', album.cover.replace('{w}', 260).replace('{h}', 260))

  $(`#addFavoritesModalCard${cardNumber}`).click(function(event) {
    event.preventDefault();
    // add this album to favorites
    const selectedAlbumIndex = $(this).data("result-index");
    const selectedAlbum = addAlbumResults[selectedAlbumIndex];

    let alreadyInFavorites = myFavoriteAlbums.find(x => x.appleAlbumID === selectedAlbum.appleAlbumID);
    if (!alreadyInFavorites) {
      addToFavorites(selectedAlbum);
    } else {
      alert(`"${selectedAlbum.title}" is already in your favorites.`);
    }
  })
}

$('#add-favorites-album-button').click(function(event) {
  event.preventDefault();
  const search = $('#add-favorites-album-input').val().trim().replace(/[^\w\s]/gi, '');
  $('#no-results-message').remove();
  $('#favorites-search-results').html('');
  $('#addFavoritesAlbumModal .new-loader').show();
  executeSearch(search, "add to favorites");
});

// execute search when enter key is pressed
$("#add-favorites-album-input").keyup(function(event) {
  if (event.keyCode === 13) {
    $("#add-favorites-album-button").click();
  }
});

function addToFavorites(selectedAlbum) {
  if (selectedAlbum && userID) {
    $.ajax('/api/v1/album/favorites/new', {
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ 
        "user" : userID,
        "albumData" : selectedAlbum
      }),
      success: function(album) {
        if (!album.message) {
          myFavoriteAlbums.push(album);
          $('#addFavoritesAlbumModal').modal("hide");
          startFavoritesPage();
          $('#add-favorites-album-input').val('');
          $('#favorites-search-results').html('');

          // maintain current state of filters
          restoreCards();
          masterFilter(filterGenre);
          masterFilter(filterYear);
          masterFilter(filterArtist);
          filterByTopTen(filterTopTen);
          whatsOnThePage_Top10();

          // clear filters if there are no matching albums
          let whatsLeft = $('.albumCard:visible');
          if (whatsLeft.length < 1) { clearFilters(); }
        } else {
          alert(album.message);
        }
      }
    });
  }
}

function startFavoritesPage() {
  // clear any warnings
  $('#all_cards').html("")

  // display instructions if no favorites exist for this user
  if (myFavoriteAlbums.length < 1) {
    showDOMelement("log_in_message")
    $('#log_in_message').html("<div class='text-secondary' style='text-align:center;'><p style='margin: 20px 5px 50px 5px;'>Looks like you don't have any favorites yet! Click <span class='text-primary' style='cursor:pointer;' data-toggle='modal' data-target='#addFavoritesAlbumModal'>Add Album</span> to find an album and add it to your favorites.</p></div>")
    hideDOMelement("filter_by_genre_dropdown_button")
    hideDOMelement("filter_by_year_dropdown_button")
    hideDOMelement("filter_by_artist_dropdown_button")
    hideDOMelement("clear_filters_button")
    hideDOMelement("share-favorites-button")
    hideDOMelement("to_top_button")
    // this removes top-10 filter
    whatsOnThePage_Top10()
    return
  } else {
    $('#log_in_message').hide();
    showDOMelement("filter_by_genre_dropdown_button");
    showDOMelement("filter_by_year_dropdown_button");
    showDOMelement("filter_by_artist_dropdown_button");
    showDOMelement("clear_filters_button");
    showDOMelement("share-favorites-button");
    showDOMelement("to_top_button");
  }
  $('#artist_filter_menu').html("")
  $('#artist_filter_menu').append('<small id="loading_artist_filters" class="text-primary" style="margin-left:8px;">Loading Artist Filters...</small>')

  bubbleSort(myFavoriteAlbums, "releaseDate")

  // reverse shows newer albums first (mostly)
  myFavoriteAlbums = myFavoriteAlbums.reverse()

  // create card and populate for each favorite album
  for (let index = 0; index < myFavoriteAlbums.length; index++) {
    let album = myFavoriteAlbums[index]
    let card = (index + 1)
    
    createCard(album, card)
    populateCard(album, card)
  }
  $('.remove-favorite-button').click(function(event) {
    event.preventDefault();
    const selectedAlbum = $(this).data("album-id");
    removeFromFavorites(selectedAlbum);
  }) 
  // populate our list of dom elements for filtering 
  albumCardsList = $(".albumCard")
  startTags()
}

function removeFromFavorites(selectedAlbum) {
  let albumToRemove = myFavoriteAlbums.find(x => x._id === selectedAlbum);
  let confirmed = confirm(`Are you sure you want to remove "${albumToRemove.title}" from your favorites? You cannot undo this operation.`);
  if (confirmed) {
    $.ajax(`/api/v1/album/favorites/${selectedAlbum}`, {
      method: 'DELETE',
      contentType: 'application/json',
      data: JSON.stringify({ "user" : userID }),
      success: function(album) {
        if (!album.message) {
          removeElementFromArray(myFavoriteAlbums, albumToRemove);
          startFavoritesPage();

          // maintain current filters
          restoreCards();
          masterFilter(filterGenre);
          masterFilter(filterYear);
          masterFilter(filterArtist);
          filterByTopTen(filterTopTen);
          whatsOnThePage_Top10();

          // clear filters if there are no more matching albums
          let whatsLeft = $('.albumCard:visible');
          if (whatsLeft.length < 1) { clearFilters(); }
        } else {
          alert(album.message);
        }
      }
    });
  }
}

// make hover scrollbar always visible on touchscreens
$(document).ready(function() {
  let isTouchDevice = false;
  if ("ontouchstart" in document.documentElement) { isTouchDevice = true; }
  if (isTouchDevice) {
    const searchResultsBox = document.getElementById("favorites-search-results");
    searchResultsBox.style.paddingBottom="0px";
    searchResultsBox.style.overflowX="scroll";
  }
});