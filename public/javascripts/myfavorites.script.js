// ------- START UTILITIES SECTION ----------
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

function bubbleSort(arr, prop)
{
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

function createCard(cardNumber) {
  $('#all_cards').append(`<div id="card${cardNumber}" class="card albumCard"><a class="album_details_link" href=""><img class="card-img-top" src="" alt=""><a/><div class="card-body"><h4 class="card-title"></h4><span class="album"><span class="text-primary">Loading Album Details...</span></span></div></div>`)
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
      const myFavoritesURL = window.location.protocol + "//" + window.location.host + "/list/" + data

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
// === OLD CONFIG ===
// var config = {
//   apiKey: "AIzaSyD1Hts7zVBvDXUf-sCb89hcPesJkrUKyUc",
//   authDomain: "album-tag-auth.firebaseapp.com",
//   projectId: "album-tag-auth",
// }
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
      myFavoriteAlbums = data
      startFavoritesPage()
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
    albumCardsList[index].style.display = "inline"
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
  $('#year_filter_menu').removeClass('show')
  $('#genre_filter_menu').removeClass('show')
  // $('#artist_filter_menu').removeClass('show')
})

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
      $('#year_filter_menu').append(`<a id="year-${year}" class="badge badge-primary year_to_filter_by" href="#" onclick="filterByYear(${year})">${year}</a>`)
    } else {
      $('#year_filter_menu').append(`<a id="year-${year}" class="badge badge-light year_to_filter_by" href="#" onclick="filterByYear(${year})">${year}</a>`)
    }
  }

  $('#loading_year_filters').hide()
  whatsOnThePage_years()  
}

function filterByYear(year) {
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
      $('#genre_filter_menu').append(`<a id="genre-${replaceSpaceWithUnderscore(replaceSepecialCharacters(genre))}" class="badge badge-primary genre_to_filter_by" href="#" onclick="filterByGenre('${genre}')">${genre}</a>`)
    } else {
      $('#genre_filter_menu').append(`<a id="genre-${replaceSpaceWithUnderscore(replaceSepecialCharacters(genre))}" class="badge badge-light genre_to_filter_by" href="#" onclick="filterByGenre('${genre}')">${genre}</a>`)
    }       
  }

  $('#loading_genre_filters').hide()
  whatsOnThePage_genres()
}

function filterByGenre(genre){
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
      $('#artist_filter_menu').append(`<a id="artist-${cleanArtist}" class="badge badge-primary artist_to_filter_by" href="#" onclick="filterByArtist('${cleanArtist}')">${artist}</a>`)
    } else {
      $('#artist_filter_menu').append(`<a id="artist-${cleanArtist}" class="badge badge-light artist_to_filter_by" href="#" onclick="filterByArtist('${cleanArtist}')">${artist}</a>`)
    }
  } 

  $('#loading_artist_filters').hide()
  whatsOnThePage_artists() 
}

function filterByArtist(artist) {
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



function startFavoritesPage() {
  // clear any warnings
  $('#all_cards').html("")

  // display instructions if no favorites exist for this user
  if (myFavoriteAlbums.message) {
    showDOMelement("log_in_message")
    $('#log_in_message').html("<div style='text-align:center;'><p style='margin: 20px 5px 50px 5px;'>Looks like you don't have any favorites yet! <a href='/search'>Search</a> for an album then click the <img src='../images/heart-unliked.png' height='30' width='auto'> icon on the Lists tab to add it to your favorites.</p></div>")
    hideDOMelement("filter_by_genre_dropdown_button")
    hideDOMelement("filter_by_year_dropdown_button")
    hideDOMelement("filter_by_artist_dropdown_button")
    hideDOMelement("clear_filters_button")
    hideDOMelement("share-favorites-button")
    hideDOMelement("to_top_button")
    return
  } else {
    $('#log_in_message').html("")
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
    
    createCard(card)
    populateCard(album, card)
  }
  // populate our list of dom elements for filtering 
  albumCardsList = $(".albumCard")
  startTags()
}

function addInfoButtons() {
  const infoButtonSmall = '<small class="text-secondary ml-2 float-right page-info-button" style="cursor:pointer;" data-toggle="modal" data-target="#pageInfoModal">&#9432;</small>'
  $('#compact_menu p').append(infoButtonSmall)
  const infoButtonLage = '<button class="btn btn-sm btn-outline-secondary sticky-top float-left button_text" style="cursor:pointer;margin-top:2px;" data-toggle="modal" data-target="#pageInfoModal">&#9432;</button>'
  $('#all-favorites-filters').append(infoButtonLage)
}

addInfoButtons()