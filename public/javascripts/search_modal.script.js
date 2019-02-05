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

function executeSearch(searchString, searchType) {
  $.ajax({
    method: "GET",
    url: "/api/v1/apple/search/" + searchString,
    success: function(data) {
      if (data.message) {
        alert(data.messsage);
        return;
      } else {
        if (searchType === "connection") {
          // this function is defined in album.script.js
          populateConnectionModalResults(data);
        } else if (searchType === "add to list") {
          // this function is defined in list.script.js
          populateAddToListModalResults(data);
        } else {
          populateSearchModalResults(data);
        }
      }
    }
  });
}

function populateSearchModalResults(data) {
  $('#search-modal-results').html('');
  $('#searchModal .new-loader').hide();
  if (data.albums) {
    for (let index = 0; index < data.albums.length; index++) {
      const album = data.albums[index];
      const cardNumber = index + 1;
      createModalCard(cardNumber);
      populateModalCard(album, cardNumber);
    }
    // this adds an empty space at the end so the user can scroll 
    // all the way to the right to see the last album
    createModalCard(data.albums.length + 1)
  }
}

function createModalCard(cardNumber) {
  $('#search-modal-results').append(`<div id="searchModalCard${cardNumber}" class="search-modal-card"><a class="search-modal-card-album-link" href=""><img class="search-modal-card-image" src="" alt=""><a/><div class="search-modal-card-body"><h4 class="search-modal-card-title"></h4><span class="search-modal-card-album"></span></div></div>`)
}

function populateModalCard(album, cardNumber) {
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
  $(`#searchModalCard${cardNumber} .search-modal-card-title`).html(`<span class="search-modal-card-large-artist">${largeArtist}</span><span class="search-modal-card-small-artist">${smallArtist}</span>`)
  // album name
  $(`#searchModalCard${cardNumber} .search-modal-card-album`).html(`<span class="search-modal-card-large-album">${largeAlbum}</span><span class="search-modal-card-small-album">${smallAlbum}</span>`) 
  // album cover
  $(`#searchModalCard${cardNumber} .search-modal-card-image`).attr('src', album.cover.replace('{w}', 260).replace('{h}', 260))
  // add album-page-link to album cover
  $(`#searchModalCard${cardNumber} .search-modal-card-album-link`).attr('href', `/album/${album.appleAlbumID}`)
}

$('#search-modal-button').click(function(event) {
  event.preventDefault();
  const search = $('#search-modal-input').val().trim().replace(/[^\w\s]/gi, '');
  $('#search-modal-results').html('');
  $('#searchModal .new-loader').show();
  executeSearch(search);
});

// execute search when enter key is pressed
$("#search-modal-input").keyup(function(event) {
  if (event.keyCode === 13) {
    $("#search-modal-button").click();
  }
});