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

function removeDash(str) {
  return str.replace(/-/g, '')
}

function bubbleSort(arr, prop)
{
  var swapped
  do {
    swapped = false
    for (var i = 0; i < arr.length - 1; i++) {
      if (parseInt(removeDash(arr[i][prop])) < parseInt(removeDash(arr[i + 1][prop]))) {
        var temp = arr[i]
        arr[i] = arr[i + 1]
        arr[i + 1] = temp
        swapped = true
      }
    }
  } while (swapped)
}
// ------- END UTILITIES SECTION ----------

let myFavoriteAlbums

// creates the album card with loading message and no details
function createCard(cardNumber) {
  $('#favorites_all_cards').append(`<div id="card${cardNumber}" class="card albumCard"><a class="album_details_link" href=""><img class="card-img-top" src="" alt=""><a/><div class="card-body"><h4 class="card-title"></h4><span class="album"><span class="text-primary">Loading Album Details...</span></span></div></div>`)
}

// populates the album card
function populateCard(album, cardNumber) {
  
  const selectedYear = (new URL(document.location)).searchParams.get("year")

  if (album.releaseDate.slice(0,4) != `${selectedYear || (new Date()).getFullYear()}`){
    const emptyCard = document.getElementById(`card${cardNumber}`)
    emptyCard.remove()
    return
  }

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
  $(`#card${cardNumber} img`).attr(
    'src', album.cover.replace('{w}', 260).replace('{h}', 260))
  // add album-details-link to album cover
  $(`#card${cardNumber} .album_details_link`).attr(
    'href', `/album/${album.appleAlbumID}`)
}

function getFavoriteAlbums() {
  $.ajax({
    method: "GET",
    url: "/api/v1/album/favorites/Ol5d5mjWi9eQ7HoANLhM4OFBnso2",
    success: function(data) {
      myFavoriteAlbums = data
      startFavoritesPage()
    }
  })
}

let allYears = []
function addToYears(album) {
  let releaseYear = album.releaseDate.slice(0,4)
  if (allYears.indexOf(releaseYear) == -1) {
    $('.year-dropdown').append(`<a class="dropdown-item release-year" data-release="${releaseYear}" href="">${releaseYear}</a>`)
    allYears.push(releaseYear)
  }
}


function startFavoritesPage() {
  // clear any warnings
  $('#favorites_all_cards').html("")
  $('.year-dropdown').html("")
  allYears = []

  bubbleSort(myFavoriteAlbums, "releaseDate")

  // create card and populate for each favorite album
  for (let index = 0; index < myFavoriteAlbums.length; index++) {
    const album = myFavoriteAlbums[index]
    const card = (index + 1)
    
    createCard(card)
    populateCard(album, card)
    addToYears(album)
  }

  $(".release-year").on("click", function(e) {
    let year = $(this).attr("data-release")
    let newUrl = "/favorites?year=" + year

    // window.history.pushState({}, null, newUrl)
    // need to write it this way for page update on `back` to work
    history.pushState({}, '', newUrl)
    $('.year-dropdown-button').text(year)
    document.title = `Album Tags : ${year}`

    startFavoritesPage()
    e.preventDefault()
  })

  if ($('#favorites_all_cards')[0].childElementCount === 0) {
    let chosenYear = (new URL(document.location)).searchParams.get("year")

    if ((new URL(document.location)).pathname == '/favorites' && !(new URL(document.location)).searchParams.get("year")) {
      chosenYear = (new Date()).getFullYear()
    }

    if ((new URL(document.location)).searchParams.get("year") == "") {
      chosenYear = "blank"
    }

    $('#favorites_all_cards').html(`<div class="col" style="text-align:center;margin-top:100px;margin-bottom:100px;"><p class="text-danger">Sorry, we don't have any favorite albums from year "${chosenYear || "blank"}." Try a different year from the dropdown!</p></div>`)
  }
}

getFavoriteAlbums()

const dropdownYear = `<div class="dropdown" style="display:inline;"><a class="dropdown-toggle text-secondary year-dropdown-button" href="" role="button" id="dropdownYearLink" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">${(new URL(document.location)).searchParams.get("year") || (new Date()).getFullYear()}</a><div class="year-dropdown dropdown-menu" aria-labelledby="dropdownYearLink" style="max-height:41vh;overflow-y:scroll;"></div></div>`

$('.subtitle').html(`Our Favorite Albums of <span>${dropdownYear}</span>`)

// closes filter dropdown menu's when page is scrolling
$(document).on( 'scroll', function(){
  $(".year-dropdown").removeClass('show')
})

// this updates the page when the back button is pressed
$(document).ready(function( $ ) {
  $(window).on('popstate', function() {
    //  location.reload(true)
    startFavoritesPage()
    $('.year-dropdown-button').text(`${(new URL(document.location)).searchParams.get("year") || (new Date()).getFullYear()}`)
  })
})