// ====== START UTILITY SECTION ======
function makeNiceDate(uglyDate) {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  let year = uglyDate.slice(0, 4)
  let day = uglyDate.slice(8, 10)
  let uglyMonth = uglyDate.slice(5, 7) 
  let niceMonth = months[uglyMonth-1]
  return(`${niceMonth} ${day}, ${year}`)
}

function safeParse(content) {
  // replace characters with html equivalents
  //prevents some basic cross site scripting attacks
  content = content.replace(/\</g, "&lt;").replace(/\>/g, "&gt;").replace(/\//g, "&#47;").replace(/\\/g, "&#92;").replace(/\(/g, "&#40;").replace(/\)/, "&#41;").replace(/\./g, "&#46;").replace(/\[/g, "&#91;").replace(/\]/g, "&#93;").replace(/\{/g, "&#123;").replace(/\}/g, "&#125;").replace(/\=/g, "&#61;")
  return content
}

function replaceBackSlashWithHtml(str) {
  return str.replace(/\//g, '&sol;')
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
// ====== END UTILITY SECTION ======

const albumID = window.location.pathname.replace('/album/', '')
let albumResult
let selectedTags = []

function getAlbumDetails() {
  $.ajax('/api/v1/album/albumid/' + albumID, {
    method: 'GET',
    success: function(album) {
      if (!album.message) {
        albumResult = album
        console.log(albumResult)
        populateAlbumPage()
      }
    }
  })
}

function populateAlbumPage() {
  $('#album-title').text(albumResult.title)
  $('#band-name').text(albumResult.artist)
  $('#album-cover').attr('src', albumResult.cover.replace('{w}', 450).replace('{h}', 450))
  $('#release-date span').text(makeNiceDate(albumResult.releaseDate))
  $('#record-company span').text(albumResult.recordCompany)
  $('#track-titles').html('')
  albumResult.songNames.forEach(songName => {
    $('#track-titles').append(`<li><span>${songName}</span></li>`)
  })
  $('#apple-album-id span').text(albumResult.appleAlbumID)
  $('#more-by-this-artist').click(function(event) {
    event.preventDefault()
    sessionStorage.setItem('artist', albumResult.artist)
    window.location.href = '/search'
  })

  addTags()
  populateConnections()
}

function populateConnections() {
  if (albumResult.connectionObjects && albumResult.connectionObjects.length > 0) {
    $('#connected-albums').html('')

    for (let index = 0; index < albumResult.connectionObjects.length; index++) {
      let connectedAlbum = albumResult.connectionObjects[index]

      if (connectedAlbum.appleAlbumID != albumResult.appleAlbumID) {
        const cover = connectedAlbum.cover.replace('{w}', 105).replace('{h}', 105)
        let smallTitle
        if (connectedAlbum.title.length > 20) { 
          smallTitle = truncate(connectedAlbum.title, 20) 
        } else {
          smallTitle = connectedAlbum.title
        }

        $('#connected-albums').append(`<a href="/album/${connectedAlbum.appleAlbumID}" id="${connectedAlbum.appleAlbumID}" class="connection" data-creator="${connectedAlbum.creator}"><img class="connection-cover" src="${cover}" data-toggle="tooltip" data-placement="top" title="${smallTitle}" data-trigger="hover"></a>`)
      }
    } 

    // ------------- enable tooltips -----------
    var isTouchDevice = false
    if ("ontouchstart" in document.documentElement) { isTouchDevice = true; }
    if (!isTouchDevice) { $('[data-toggle="tooltip"]').tooltip(); }
  } else {
    //there are no connected albums
  }
}

function addTags() {
  for (let index = 0; index < albumResult.tagObjects.length; index++) {
    let tag = albumResult.tagObjects[index].tag
    const creator = albumResult.tagObjects[index].creator
    
    // add tags
    if (parseInt(tag)) {
      const addLetters = "tag_"
      var tagName = addLetters.concat(tag).replace(/[^A-Z0-9]+/ig,'')
    } else {                  
      var tagName = tag.replace(/[^A-Z0-9]+/ig,'')
    }
  
    $('#current-tags').append(`<a href="" onclick="selectTag(${tagName}, event)" id="${tagName}" class="badge badge-light album-tag" data-creator="creator-${creator}">${safeParse(tag)}</a>`) 
  }
}

function selectTag(tagName, event) {
  if (event) { event.preventDefault(); }

  var thisTag = document.getElementById(tagName.id)
  thisTag.classList.toggle("badge-primary")
  thisTag.classList.toggle("selected-tag")
  thisTag.classList.toggle("badge-light")

  modifySelectedTags(replaceBackSlashWithHtml(thisTag.innerHTML))
}

function modifySelectedTags(tag) {
  // this conditional returns -1 value if tag is not in array
  if ($.inArray(tag, selectedTags) === -1) {
    selectedTags.push(tag)
  } else {
    // cant use pop because it removes last item only
    // this finds the item being clicked and uses that
    // index with splice() to remove 1 item only
    let index = selectedTags.indexOf(tag)
    selectedTags.splice(index, 1)
  }
}

function toggleActiveInfoTab(element) {
  $('#info-card .active').removeClass("active").addClass("inactive-info-tab")
  $(element).removeClass("inactive-info-tab").addClass("active")
  $('.info-card-body').hide()
  const selectedCard = element.data('card')
  $(`#${selectedCard}-info-card-body`).show()
}

function clearTagArray(event) {
  if (event) { event.preventDefault() }
  
  if ($(".selected-tag").length > 0) {
    $(".selected-tag").toggleClass( "badge-primary" )
    $(".selected-tag").toggleClass( "badge-light" )
    $(".selected-tag").toggleClass( "selected-tag" )

    selectedTags = []
  }
}

$('#info-card .nav-link').click(function(event) {
  event.preventDefault()
  toggleActiveInfoTab($(this))
})
$('#tag-search-button').click(function(event) {
  event.preventDefault()
  if (selectedTags.length > 0) {
    var win = window.location = (`/search/tags/${selectedTags}`)
  }  else {
    alert("Select one or more tags to preform a tag search")
  }
})
$('#clear-tag-button').click(function(event) {
  event.preventDefault()
  clearTagArray(event)
})

getAlbumDetails()

// ----- START FIREBASE AUTH SECTION ------
function userIsLoggedIn() {
  $('.hide_when_logged_in').addClass('hide_me')
  $('.hide_when_logged_out').removeClass('hide_me')
  $('#full_menu_login_logout_container').show()
  $('#login_button').hide()
  $('#full_menu_login_button').hide()
  $('#logout_button').show()
  $('#full_menu_logout_button').show()

  $('.info-card-login-button').hide()
  $('#tag-update-button').show()
  $('#connection-update-button').show()
  $('#list-update-button').show()
}

function userIsLoggedOut() {
  $('.hide_when_logged_out').addClass('hide_me')
  $('.hide_when_logged_in').removeClass('hide_me')
  $('#full_menu_login_logout_container').show()
  $('#login_button').show()
  $('#full_menu_login_button').show()
  $('#logout_button').hide()
  $('#full_menu_logout_button').hide()

  $('.info-card-login-button').show()
  $('#tag-update-button').hide()
  $('#connection-update-button').hide()
  $('#list-update-button').hide()
}

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
    userIsLoggedIn()
  } 
  if (!user) {   
    // no user logged in 
    userIsLoggedOut()
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

    userIsLoggedIn()
  }).catch(function(error) {
    // Handle Errors here.
  })
}

function logOut() {
  firebase.auth().signOut().then(function() {
    // log out functionality
    userIsLoggedOut()

  }).catch(function(error) {
  // An error happened.
  })
}

// add event listener to log in and out buttons
document.getElementById("login_button").addEventListener("click", logIn)
document.getElementById("full_menu_login_button").addEventListener("click", logIn)
document.getElementById("logout_button").addEventListener("click", logOut)
document.getElementById("full_menu_logout_button").addEventListener("click", logOut)
$(".info-card-login-button").on("click", logIn)
// ----- END FIREBASE AUTH SECTION ------