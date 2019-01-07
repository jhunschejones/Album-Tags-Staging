// -------- START UTILITIES SECTION --------
function scrollToTop() {
  document.body.scrollTop = 0 // For Safari
  document.documentElement.scrollTop = 0 // For Chrome, Firefox, IE and Opera
}

function hideDOMelement(elementId) {
  try {
    let element = document.getElementById(elementId)
    element.style.display = "none"
    // $(`'#${element}'`).tooltip('disable')
  } catch (error) {
    // this element does not exist yere
  }
}

function showDOMelement(elementId) {
  try {
    let element = document.getElementById(elementId)
    element.style.display = "block"
    // $(`#${element}`).tooltip('enable')
  } catch (error) {
    // this element does not exist yere
  }
}

// takes a string thats an html element ID
function toggleDOMelement(content) {
  let query = $(`#${content}`) 
  // check if element is Visible
  var isVisible = query.is(':visible')
  
  if (isVisible === true) {
    // element was Visible
    query.hide()
  } else {
    // element was Hidden
    query.show()
  }
}

function toggleContentAndArrows(content, up, down) {
  let query = $(`#${content}`) 
  let downArrow = $(`#${down}`) 
  let upArrow = $(`#${up}`) 

  // check if element is Visible
  var isVisible = query.is(':visible')
  
  if (isVisible === true) {
    // element was Visible
    query.css( "display", "none" )
    downArrow.css( "display", "block" )
    upArrow.css( "display", "none" )
  } else {
    // element was Hidden
    query.css( "display", "block" )
    downArrow.css( "display", "none" )
    upArrow.css( "display", "block" )
  }
}

function toggleTracksAndArrows(content, up, down) {
  let query = $(`#${content}`) 
  let downArrow = $(`#${down}`) 
  let upArrow = $(`#${up}`) 

  // check if element is Visible
  var isVisible = query.is(':visible')
  
  if (isVisible === true) {
    // element was Visible
    query.css( "display", "none" )
    downArrow.css( "display", "inline-block" )
    upArrow.css( "display", "none" )
  } else {
    // element was Hidden
    query.css( "display", "inline-block" )
    downArrow.css( "display", "none" )
    upArrow.css( "display", "inline-block" )
  }
}

function countInArray(array, item) {
  var count = 0
  for (var i = 0; i < array.length; i++) {
    if (array[i] === item) {
      count++
    }
  }
  return count
}

function safeParse(content) {
  // replace characters with html equivalents
  //prevents some basic cross site scripting attacks
  content = content.replace(/\</g, "&lt;").replace(/\>/g, "&gt;").replace(/\//g, "&#47;").replace(/\\/g, "&#92;").replace(/\(/g, "&#40;").replace(/\)/, "&#41;").replace(/\./g, "&#46;").replace(/\[/g, "&#91;").replace(/\]/g, "&#93;").replace(/\{/g, "&#123;").replace(/\}/g, "&#125;").replace(/\=/g, "&#61;")
  return content
}

// replaces back slash with html character
function replaceBackSlashWithHtml(str) {
  return str.replace(/\//g, '&sol;')
}
// -------- END UTILITIES SECTION --------

const albumId = window.location.pathname.replace('/albumdetails/', '')
let tagsForThisAlbum
let albumResult

// this function actually makes the database calls
function getAlbumDetails(albumNumber) {
  $.getJSON ( '/api/v1/album/albumid/' + albumNumber, function(album) {
    if (album.message) { 
      $.getJSON ( '/api/v1/apple/details/' + albumNumber, function(album) { 
        // store result globally 
        albumResult = album
        populateAlbumDetails(album)
        return
      })
      return
    } else {
      // store result globally 
      albumResult = album
      populateAlbumDetails(album)
      return
    }
  })
}

// this populates the page with all the details
function populateAlbumDetails(album){
  var artist = album.artist
  var title = album.title
  var label = album.recordCompany
  // the replaceing at the end here is setting the width and height of the image
  var cover = album.cover.replace('{w}', 450).replace('{h}', 450)
  var applemusicurl = album.appleURL
  // calling my makeNiceDate function from below to format the date
  var release = makeNiceDate(album.releaseDate)
  var songNames = album.songNames

  $('.albumdetails_details img').attr("src", cover, '<br')
  $('.albumdetails_artist').append(`<span onclick="moreByThisArtist('${artist}')" data-toggle="tooltip" data-placement="right" title="Search This Artist" data-trigger="hover" style="cursor:pointer;">${artist}</span>`)
  $('.albumdetails_artist').append('<span id="add-tag-button" data-toggle="tooltip" data-placement="right" title="Go to the update page to add to favorites" data-trigger="hover">&#43;</span>')
  // $('.albumdetails_artist').append(`<img src="../images/heart-unliked.png" height="30" width="auto" id="add_to_favorites" class="hide_when_logged_out hide_me_details" style="cursor:pointer;" onclick="addToFavoriteAlbums(${album.appleAlbumID})" data-toggle="tooltip" title="Add To Favorites" data-trigger="hover">`)
  // $('.albumdetails_artist').append(`<img src="../images/heart-liked.png" height="30" width="auto" id="remove_from_favorites" class="hide_when_logged_out hide_me_details" style="cursor:pointer;" onclick="removeFromFavorites(${album.appleAlbumID})" data-toggle="tooltip" title="Remove From Favorites" data-trigger="hover">`)
  // $('.albumdetails_album').append(album, '<br/>')
  $('.albumdetails_album').append(`<span id="the_album_name" data-toggle="tooltip" data-placement="right" title="Click to Show Album ID" data-trigger="hover" onclick="showAlbumID()" style="cursor:pointer;">${title}</span><span id="the_album_id" class="text-secondary" data-toggle="tooltip" data-placement="right" title="Select & Copy Album ID" data-trigger="hover" style="display:none;">${album.appleAlbumID}</span>`)

  // adding path to apple music to button
  $('.applemusicurl').attr("href", applemusicurl, '<br>')
  $('.albumdetails_label').append(label, '<br>')
  $('.albumdetails_release').append(release, '<br>')
  
  songNames.forEach(element => {
    $('.song_names').append(`<li>${element}</li>`)
  })

  populateTags(album.appleAlbumID)
  document.getElementById("add-tag-button").addEventListener("click", goToUpdatePage)
}


function showAlbumID() {
  $('#the_album_id').tooltip('disable')
  showDOMelement("the_album_id")
  hideDOMelement("the_album_name")
  setTimeout(showAlbumName, 7000)
}

function showAlbumName() {
  $('#the_album_name').tooltip('disable')
  showDOMelement("the_album_name")
  hideDOMelement("the_album_id")
}

// I'm using this variable and function to reformat the date provided in Apple's API
// into a fully written-out and formated date
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
function makeNiceDate(uglyDate) {
  let year = uglyDate.slice(0, 4)
  let day = uglyDate.slice(8, 10)
  let uglyMonth = uglyDate.slice(5, 7) 
  let niceMonth = months[uglyMonth-1]
  return(`${niceMonth} ${day}, ${year}`)
}

function replaceUnderscoreWithBackSlash(str) {
  return str.replace(/_/g, "/")
}

// this populates the Tags card with any tags stored in the mongodb database
// and retrieved by the router stored at the URL listed with the album number
function populateTags(albumNumber) {
  if (albumNumber === "start") { return; }
  var noAuthors = false
  $("#tags_toggle").html('<img src="/images/toggle_off.png" id="show_only_my_tags" class="hide_when_logged_out" style="height:22px;margin-left:10px;" onclick="showAllTags()" data-toggle="tooltip" data-placement="right" title="Show All Tags" data-trigger="hover"><img src="/images/toggle_on.png" class="hide_when_logged_out" id="show_all_tags" style="height:22px;margin-left:10px;" onclick="showOnlyMyTags()" data-toggle="tooltip" data-placement="right" title="Only Show My Tags" data-trigger="hover">')

  if (albumResult.tagObjects && albumResult.tagObjects.length > 0) {
    // clear default no-tags notice if tags exist
    $(".tag_results").text('')
    $(".tag_search_button").html('<a href="" onclick="tagSearch(event)" class="btn btn-sm btn-outline-secondary tag_search_button hide_when_logged_out" style="display:none;">Search<span class="button_text"> by Selected Tags</span></a>')
    currentTags = []
    currentAuthors = []

    for (let index = 0; index < albumResult.tagObjects.length; index++) {
      let tag = albumResult.tagObjects[index].tag
      const author = albumResult.tagObjects[index].creator

      // tag = replaceUnderscoreWithBackSlash(tag)
      // creating a unique tag for each element, solving the problem of number tags not allowed
      // by adding some letters to the start of any tag that can be converted to a number
      // then using a regular expression to remove all spaces and special characters in each tag
      if (parseInt(tag)) {
        var addLetters = "tag_"
        var tagName = addLetters.concat(tag).replace(/[^A-Z0-9]+/ig,'')
      } else {                  
        var tagName = tag.replace(/[^A-Z0-9]+/ig,'')
      }

      // Here we add the tags as elements on the DOM, with an onclick function that uses a unique
      // tag to toggle a badge-success class name and change the color
      $('.tag_results').append(`<a href="" onclick="changeClass(${tagName}, event)" id="${tagName}" class="badge badge-light album_details_tags author-${author}">${safeParse(tag)}</a>  `)   
    }
    $('.album_details_tags').hide()
  }  
  checkUserDisplayPrefrences()
  // call this whether or not there are tags
  putConnectionsOnPage()
}



// this function is avaiable onclick for all the tags it will toggle
// between two boostrap classes to change the color of selected tags
// it takes in the unique tag ID assigned to eatch badge durring
// creation so that only the desired badge toggles colors
function changeClass(tagName, event) {
  if (event) { event.preventDefault() }
  // clear warning label
  $('.warning_label').text('')
  var thisTag = document.getElementById(tagName.id)
  thisTag.classList.toggle("badge-primary")
  thisTag.classList.toggle("selected_tag")
  thisTag.classList.toggle("badge-light")
  // see below
  addToTagArray(replaceBackSlashWithHtml(thisTag.innerHTML))
}


// this function creates an array and adds or removes tags as the
// applicable tag badges are clicked
var selectedTags = []
function addToTagArray(tag) {
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

function putConnectionsOnPage() {
  $(".connection_results").text('')
  $("#connections_toggle").html('<img src="/images/toggle_off.png" id="show_only_my_connections" class="hide_when_logged_out" style="height:22px;margin-left:10px;" onclick="showAllConnections()" data-toggle="tooltip" data-placement="right" title="Show All Connections" data-trigger="hover"><img src="/images/toggle_on.png" class="hide_when_logged_out" id="show_all_connections" style="height:22px;margin-left:10px;" onclick="showOnlyMyConnections()" data-toggle="tooltip" data-placement="right" title="Only Show My Connections" data-trigger="hover">')
  let directConnections = []

  if (albumResult.connectionObjects && albumResult.connectionObjects.length > 0) {
    for (let index = 0; index < albumResult.connectionObjects.length; index++) {
      let connectedAlbum = albumResult.connectionObjects[index]
      
      // curating a directConnections array for later use in finding indirectConnections
      directConnections.push(connectedAlbum.appleAlbumID)

      if (connectedAlbum.appleAlbumID != albumResult.appleAlbumID) {
        var cover = connectedAlbum.cover.replace('{w}', 105).replace('{h}', 105)

        $('.connection_results').append(`<a href="/albumdetails/${connectedAlbum.appleAlbumID}" id="${connectedAlbum.appleAlbumID}" class="connection author-${connectedAlbum.creator}"><img class="small_cover" src="${cover}" data-toggle="tooltip" data-placement="top" title="Album Details" data-trigger="hover"></a>`)
      }
    } 
    checkConnectionDisplayPrefrences()
  } else {
    //there are no connected albums
    checkConnectionDisplayPrefrences()
  }
}

function showAllTags(event) {
  if (event) { event.preventDefault(); }

  allTagsNoFilter()
  $('#show_all_tags').show()
  $('#show_only_my_tags').hide()
  $('#tags_modifier').html('All ')
  sessionStorage.setItem('tags', 'All Tags')
  clearTagArray()
}

function showOnlyMyTags(event) {
  if (event) { event.preventDefault() }

  filterDisplayedTags()
  $('#show_all_tags').hide()
  $('#show_only_my_tags').show()
  $('#tags_modifier').html('My ')
  sessionStorage.setItem('tags', 'My Tags')
  clearTagArray()
}

function clearTagArray(event) {
  if (event) { event.preventDefault() }
  $('.warning_label').html('')
  
  if ($( ".selected_tag" ).length > 0) {
    $( ".selected_tag" ).toggleClass( "badge-primary" )
    $( ".selected_tag" ).toggleClass( "badge-light" )
    $( ".selected_tag" ).toggleClass( "selected_tag" )

    selectedTags = []
  }
}

function deDupAllTags(){
  let allAlbumTags = $('.album_details_tags')

  let thisAuthor = []
  let thisAuthorId = []
  let otherAuthor = []
  let otherAuthorId = []
  
  // divide all tags into two arrays of elements by author
  for (let index = 0; index < allAlbumTags.length; index++) {
    let elementId = allAlbumTags[index].id
    let element = allAlbumTags[index]

    if (element.classList.contains(`author-${userID}`) == true) {
      thisAuthor.push(element)
      thisAuthorId.push(elementId)
    } else {
      otherAuthor.push(element)
      otherAuthorId.push(elementId)
    }
  }

  // remove tags from other authors if the same tag exists from current user
  for (let index = 0; index < otherAuthor.length; index++) {
    let element = otherAuthor[index]
    let elementId = otherAuthorId[index]

    if (thisAuthorId.indexOf(elementId) != -1) {
      element.remove()
      otherAuthor.splice(index, 1)
      otherAuthorId.splice(index, 1)
    }
  }

  // remove duplicates from others array
  for (let index = 0; index < otherAuthor.length; index++) {
    let element = otherAuthor[index]
    let elementId = otherAuthorId[index]
    
    if (countInArray(otherAuthorId, elementId) > 1) {
      element.remove()
      otherAuthor.splice(index, 1)
      otherAuthorId.splice(index, 1)
    }     
  }
}

function deDupAllConnections(){
  let allAlbumConnections = $('.connection')

  let thisAuthor = []
  let thisAuthorId = []
  let otherAuthor = []
  let otherAuthorId = []

  for (let index = 0; index < allAlbumConnections.length; index++) {
    let element = allAlbumConnections[index]
    let elementId = allAlbumConnections[index].id

    if (element.classList.contains(`author-${userID}`) == true) {
      thisAuthor.push(element)
      thisAuthorId.push(elementId)
    } else {
      otherAuthor.push(element)
      otherAuthorId.push(elementId)
    }
  }

  // remove tags from other authors if the same tag exists from current user
  for (let index = 0; index < otherAuthor.length; index++) {
    let element = otherAuthor[index]
    let elementId = otherAuthorId[index]

    if (thisAuthorId.indexOf(elementId) != -1) {
      element.remove()
      otherAuthor.splice(index, 1)
      otherAuthorId.splice(index, 1)
    }
  }

  // remove duplicates from others array
  for (let index = 0; index < otherAuthor.length; index++) {
    let element = otherAuthor[index]
    let elementId = otherAuthorId[index]
    
    if (countInArray(otherAuthorId, elementId) > 1) {
      element.remove()
      otherAuthor.splice(index, 1)
      otherAuthorId.splice(index, 1)
    }     
  }
}

function showAllConnections() {
  allConnectionsNoFilter()
  $('#show_all_connections').show()
  $('#show_only_my_connections').hide()
  $('#connections_modifier').html('All ')
  sessionStorage.setItem('connections', 'All Connections')
  // clearTagArray()
}

function showOnlyMyConnections() {
  filterDisplayedConnections()
  $('#show_all_connections').hide()
  $('#show_only_my_connections').show()
  $('#connections_modifier').html('My ')
  sessionStorage.setItem('connections', 'My Connections')
  // clearTagArray()
}


function checkUserDisplayPrefrences() {
  // Get saved data from sessionStorage
  var whatTagsToShow = sessionStorage.getItem('tags')
  deDupAllTags()

  if (whatTagsToShow == 'My Tags') {
    $('#show_all_tags').hide()
    $('#tags_modifier').html('My ')
  } else if (whatTagsToShow == 'All Tags' || whatTagsToShow == undefined) {
    $('#show_only_my_tags').hide()
    $('#tags_modifier').html('All ')
    showAllTags()
  } else {
    // do nothing
  }
}

function checkConnectionDisplayPrefrences() {
  $('#connections_card').show()
  var whatConnectionsToShow = sessionStorage.getItem('connections')
  deDupAllConnections()

  if (whatConnectionsToShow == "My Connections"){
    $('#show_all_connections').hide()
    $('#connections_modifier').html('My ')
    showOnlyMyConnections()
  } else if (whatConnectionsToShow == "All Connections" || whatConnectionsToShow == undefined) {
    $('#show_only_my_connections').hide()
    $('#connections_modifier').html('All ')
    showAllConnections()
  } else {
    // do nothing
  }
}

// called by the search button on tags card
function tagSearch(event) {
  if (event) { event.preventDefault() }

  if (selectedTags.length > 0) {
    var win = window.location = (`/search/tags/${selectedTags}`)
  }  else {
    $('.warning_label').html('')
    $('.warning_label').html('<br/>Select one or more tags to preform a tag-search.')
  }
}

function moreByThisArtist(artist) {
  sessionStorage.setItem('artist', artist)
  window.location.href = '/search'
}

function scrollDown() {
  if (isTouchDevice == true & screen.width < 570) {
    window.scrollTo(0,document.body.scrollHeight)
  }
}

function filterDisplayedTags() {
  var anyTagsOnPage = false
  tagsForThisAlbum = $(".album_details_tags")
  for (var index = 0; index < tagsForThisAlbum.length; index++) {
    var thisTag = tagsForThisAlbum[index]

    if($(thisTag).hasClass('author-' + userID)) {
      $(thisTag).show()
      anyTagsOnPage = true
    } else {
      $(thisTag).hide()
    }
  }  
  if (anyTagsOnPage == true) {
    $(".tag_search_button").show() 
    $('#tag_results').show()
    $('#tag_results_message').html('')
  } else {
    $(".tag_search_button").hide()
    $('#tag_results').hide()
    $('#tag_results_message').html('<small class="text-primary">You currently have no tags for this album!</small>') 
  }
}

function allTagsNoFilter() {
  var anyTagsOnPage = false
  tagsForThisAlbum = $(".album_details_tags")
  
  if (tagsForThisAlbum.length > 0) { 
    anyTagsOnPage = true 
    for (var index = 0; index < tagsForThisAlbum.length; index++) {
      var thisTag = tagsForThisAlbum[index]
      $(thisTag).show()
    }  
  }

  if (anyTagsOnPage == true) {
    $(".tag_search_button").show() 
    $('#tag_results').show()
    $('#tag_results_message').html('')
  } else {
    $(".tag_search_button").hide()
    $('#tag_results').hide()
    $('#tag_results_message').html('<small class="text-primary">There are currently no tags for this album!</small>') 
  }
}

function filterDisplayedConnections() {
  var anyConnectionsOnPage = false
  connectionsForThisAlbum = $(".connection")

  for (var index = 0; index < connectionsForThisAlbum.length; index++) {
    var connection = connectionsForThisAlbum[index]

    if($(connection).hasClass('author-' + userID)) {
      $(connection).show()
      anyConnectionsOnPage = true
    } else {
      $(connection).hide()
      anyConnectionsOnPage = false
    }
  }  
  if (anyConnectionsOnPage == true) {
    // $(".tag_search_button").show() 
    $('#connection_results').show()
    $('#connection_results_message').html('')
    $('#connection_results_message').hide()
  } else {
    // $(".tag_search_button").hide()
    $('#connection_results').hide()
    $('#connection_results_message').show()
    $('#connection_results_message').html('<small class="text-primary">You currently have no connections for this album!</small>') 
  }
}

function allConnectionsNoFilter() {
  var anyConnectionsOnPage = false
  connectionsForThisAlbum = $(".connection")
  
  if (connectionsForThisAlbum.length > 0) { 
    anyConnectionsOnPage = true 
    for (var index = 0; index < connectionsForThisAlbum.length; index++) {
      var thisConnection = connectionsForThisAlbum[index]
      $(thisConnection).show()
    }  
  }

  if (anyConnectionsOnPage == true) {
    // $(".tag_search_button").show() 
    $('#connection_results').show()
    $('#connection_results_message').html('')
    $('#connection_results_message').hide()
  } else {
    // $(".tag_search_button").hide()
    $('#connection_results').show()
    $('#connection_results_message').show()
    $('#connection_results_message').html('<small class="text-primary">There are currently no connections for this album!</small>') 
  }
}

// directs user to update page for this album
function goToUpdatePage(event) {
  if (event) { event.preventDefault() }
  var url = window.location.href
  url = url.replace("albumdetails", "update")
  window.location = url
}

// ------------- start tooltips section -----------
var isTouchDevice = false

$(function () {
  setTimeout(function(){ 
    if ("ontouchstart" in document.documentElement) {
      isTouchDevice = true
    }
    
    if(isTouchDevice == false) {
      $('[data-toggle="tooltip"]').tooltip()
    }
  }, 1000)
})
// -------------- end tooltips section --------------

// ----- START FIREBASE AUTH SECTION ------
function userIsLoggedIn() {
  $('.hide_when_logged_in').addClass('hide_me')
  $('.hide_when_logged_out').removeClass('hide_me')
  $('#full_menu_login_logout_container').show()
  $('#login_button').hide()
  $('#full_menu_login_button').hide()
  $('#logout_button').show()
  $('#full_menu_logout_button').show()
  $("#update_button_container").html('<a href="" onclick="goToUpdatePage(event)" class="btn btn-sm btn-outline-secondary update_button hide_when_logged_out">Update<span class="button_text"> Tags</span></a>')
  $("#connection_button_container").html('<a href="" onclick="goToUpdatePage(event)" class="btn btn-sm btn-outline-secondary update_button hide_when_logged_out">Update Connections</a>')
  $('#connections_card').show()

  var whatTagsToShow = sessionStorage.getItem('tags')
  if (whatTagsToShow == 'My Tags') {
    sessionStorage.setItem('tags', 'My Tags')
    filterDisplayedTags()
  } else if (!whatTagsToShow || whatTagsToShow == "All Tags"  || whatTagsToShow == undefined) {
    sessionStorage.setItem('tags', 'All Tags')
    allTagsNoFilter()
  } 

  var whatConnectionsToShow = sessionStorage.getItem('connections');            
  if (whatConnectionsToShow == "My Connections"){
    sessionStorage.setItem('connections', 'My Connections')
    filterDisplayedConnections()
  } else if (!whatConnectionsToShow || whatConnectionsToShow == "All Connections" || whatConnectionsToShow == undefined) {
    sessionStorage.setItem('connections', 'All Connections')
    allConnectionsNoFilter()
  }

  $('#connections_toggle').show()
  $('#tags_toggle').show()
  $('.update_button').show()
}

function userIsLoggedOut() {
  $('.hide_when_logged_out').addClass('hide_me')
  $('.hide_when_logged_in').removeClass('hide_me')
  $('#full_menu_login_logout_container').show()
  $('#login_button').show()
  $('#full_menu_login_button').show()
  $('#logout_button').hide()
  $('#full_menu_logout_button').hide()
  showAllTags()
  showAllConnections()

  $('#connections_toggle').hide()
  $('#tags_toggle').hide()
  $('.update_button').hide()
}

// == OLD FIREBASE CONFIG == 
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
const loginButton = document.getElementById("login_button")
const loginButton2 = document.getElementById("full_menu_login_button")
const logoutButton = document.getElementById("logout_button")
const logoutButton2 = document.getElementById("full_menu_logout_button")
loginButton.addEventListener("click", logIn)
loginButton2.addEventListener("click", logIn)
logoutButton.addEventListener("click", logOut)
logoutButton2.addEventListener("click", logOut)

// ----- END FIREBASE AUTH SECTION ------

// this function call sarts populating the page
getAlbumDetails(albumId)