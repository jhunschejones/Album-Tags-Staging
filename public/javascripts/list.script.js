// ------- START UTILITIES SECTION ----------
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
// ------- END UTILITIES SECTION ----------

let listData
const listID = window.location.pathname.replace('/list/', '')

function getLists() {
  $.ajax({
    method: "GET",
    // url: "/api/v1/list/user/" + userID,
    url: "/api/v1/list/" + listID,
    success: function(data) {
      listData = data
      $('#loader').hide()
      populateList()
    }
  })
}

function createCard(cardNumber) {
  $('#albums').append(`<div id="card${cardNumber}" class="card albumCard"><a class="album_details_link" href=""><img class="card-img-top" src="" alt=""><a/><div class="card-body"><h4 class="card-title"></h4><span class="album"><span class="text-primary">Loading Album Details...</span></span></div></div>`)
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
  // album cover
  $(`#card${cardNumber} img`).attr('src', album.cover.replace('{w}', 260).replace('{h}', 260))
  // add album-details-link to album cover
  $(`#card${cardNumber} .album_details_link`).attr('href', `/albumdetails/${album.appleAlbumID}`)
}

function populateList() {
  $('#albums').html('')
  // console.log(listData)
  let listCreator = listData.displayName
  if (listCreator.trim === "") { listCreator = "Unknown" }
  $('#list-title').text(`${listData.title}`)
  $('#list-creator').text("by: " + listCreator)
  let card = 0
  listData.albums.forEach(albumObject => {
    card = card + 1
    createCard(card)
    populateCard(albumObject.album || albumObject, card)
  })
}
// ----- START FIREBASE AUTH SECTION ------
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
    getLists()

    $('#full_menu_login_logout_container').show()
    $('#login_button').hide()
    $('#full_menu_login_button').hide()
    $('#logout_button').show()
    $('#full_menu_logout_button').show()
    $('#log_in_message').hide()
  } else {   
    // no user logged in
    $('#all_cards').html('')
    $('#full_menu_login_logout_container').show()
    $('#login_button').show()
    $('#full_menu_login_button').show()
    $('#logout_button').hide()
    $('#full_menu_logout_button').hide()
    $('#loader').hide()
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
    userID = user.uid
    getLists()

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
    $('#full_menu_login_logout_container').show()
    $('#login_button').show()
    $('#full_menu_login_button').show()
    $('#logout_button').hide()
    $('#full_menu_logout_button').hide()

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
// ----- END FIREBASE AUTH SECTION ------