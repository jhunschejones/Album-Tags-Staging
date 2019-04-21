// ------- START UTILITIES SECTION ----------
// ======
// To compile with google closure compiler
// instructions: https://developers.google.com/closure/compiler/docs/gettingstarted_app
// terminal command: `java -jar compiler.jar --js search_modal.script.js --js_output_file search_modal.script.min.js`
// ======
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

function stringToNode(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content.firstChild;
}

function removeSelectedElement(selector) {
  if (selector[0] === ".") {
    const c = document.querySelectorAll(selector);
    for (let i = 0; i < c.length; i++) { 
      c[i].parentNode.removeChild(c[i]);
    }
  } else if (selector[0] === "#") {
    const e = document.getElementById(selector.substring(1));
    if (e) { e.parentNode.removeChild(e); }
  } else {
    console.error("removeSelectedElement() was passed an invalid selector");
  }
}
// ------- END UTILITIES SECTION ----------

async function executeSearch(searchString, searchType, pageNumber) {
  let searchOffset = 0;
  if (pageNumber && pageNumber > 1) { searchOffset = (pageNumber - 1) * 25; }

  let response = await fetch(`/api/v1/apple/search/${searchString}?offset=${searchOffset}`);
  if (!response.ok) throw Error(response.statusText);
  let data = await response.json();

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
    } else if (searchType === "add to favorites") {
      // this function is defined in myfavorites.script.js
      populateAddToFavoritesModalResults(data);
    } else {
      populateSearchModalResults(data, pageNumber || 1);
    }
  }

  // $.ajax({
  //   method: "GET",
  //   url: "/api/v1/apple/search/" + searchString,
  //   data: { offset: searchOffset },
  //   success: function(data) {
  //     if (data.message) {
  //       alert(data.messsage);
  //       return;
  //     } else {
  //       if (searchType === "connection") {
  //         // this function is defined in album.script.js
  //         populateConnectionModalResults(data);
  //       } else if (searchType === "add to list") {
  //         // this function is defined in list.script.js
  //         populateAddToListModalResults(data);
  //       } else if (searchType === "add to favorites") {
  //         // this function is defined in myfavorites.script.js
  //         populateAddToFavoritesModalResults(data);
  //       } else {
  //         populateSearchModalResults(data, pageNumber || 1);
  //       }
  //     }
  //   }
  // });
}

function populateSearchModalResults(data, pageNumber) {
  let offset = 0;
  if (!pageNumber || pageNumber < 2) {
    document.getElementById('search-modal-results').innerHTML = '';
    // $('#search-modal-results').html('');
    document.querySelector('#searchModal .new-loader').classList.add("hide_me");
    // $('#searchModal .new-loader').hide();
  } else {
    offset = (pageNumber - 1) * 25;
    const placeHolder = document.getElementById('search-modal-placeholder');
    if (placeHolder) { placeHolder.parentNode.removeChild(placeHolder); }
    // $('#search-modal-placeholder').remove();
  }

  if (data.albums && data.albums.length > 0) {
    if (!pageNumber || pageNumber === 1) {
      for (let index = 0; index < data.albums.length; index++) {
        const album = data.albums[index];
        const cardNumber = index + offset;
        createModalCard(cardNumber);
        populateModalCard(album, cardNumber);
      }
    } else {
      // do not display 2-album overlap with subsaquent sets of data
      for (let index = 2; index < data.albums.length; index++) {
        const album = data.albums[index];
        const cardNumber = index + offset;
        createModalCard(cardNumber);
        populateModalCard(album, cardNumber);
      }
    }
    // this adds an empty space at the end so the user can scroll 
    // all the way to the right to see the last album
    document.getElementById('search-modal-results').appendChild(stringToNode('<div id="search-modal-placeholder">&nbsp;</div>'));
    // $('#search-modal-results').append('<div id="search-modal-placeholder">&nbsp;</div>');
    
    if (data.albums.length === 25) {
      const search = document.getElementById('search-modal-input').value.trim().replace(/[^\w\s]/gi, '');
      pageNumber++;
      addNextPageButton(search, pageNumber);
    }
  } else {
    document.getElementById('search-modal-results').parentNode.insertBefore(stringToNode('<div id="no-results-message" class="text-primary mb-3" style="text-align:center;">It looks like no albums matched your search terms. Try a different search!</div>'), document.getElementById('search-modal-results').nextSibling);
    // $('#search-modal-results').after('<div id="no-results-message" class="text-primary mb-3" style="text-align:center;">It looks like no albums matched your search terms. Try a different search!</div>');
  }
}

function addNextPageButton(search, pageNumber) {
  document.getElementById('search-modal-results').appendChild(stringToNode('<div class="align-self-center" id="next-page-button"><img src="/images/back_arrow.png" style="height:25px;cursor:pointer;transform:scaleX(-1);"></div>'));
  // $('#search-modal-results').append('<div class="align-self-center" id="next-page-button"><img src="/images/back_arrow.png" style="height:25px;cursor:pointer;transform:scaleX(-1);"></div>');

  document.getElementById('next-page-button').addEventListener('click', function(event) {
    event.preventDefault();
    const nextPageButton = document.getElementById('next-page-button');
    if (nextPageButton) { nextPageButton.parentNode.removeChild(nextPageButton); }
    // $('#next-page-button').remove();
    executeSearch(search, "next page", pageNumber);
  })
}

function createModalCard(cardNumber) {
  document.getElementById('search-modal-results').appendChild(stringToNode(`<div id="searchModalCard${cardNumber}" class="search-modal-card"><a class="search-modal-card-album-link" href=""><img class="search-modal-card-image" src="" alt=""><a/><div class="search-modal-card-body"><h4 class="search-modal-card-title"></h4><span class="search-modal-card-album"></span></div></div>`));
  // $('#search-modal-results').append(`<div id="searchModalCard${cardNumber}" class="search-modal-card"><a class="search-modal-card-album-link" href=""><img class="search-modal-card-image" src="" alt=""><a/><div class="search-modal-card-body"><h4 class="search-modal-card-title"></h4><span class="search-modal-card-album"></span></div></div>`)
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
  document.querySelector(`#searchModalCard${cardNumber} .search-modal-card-title`).innerHTML = `<span class="search-modal-card-large-artist">${largeArtist}</span><span class="search-modal-card-small-artist">${smallArtist}</span>`;
  // $(`#searchModalCard${cardNumber} .search-modal-card-title`).html(`<span class="search-modal-card-large-artist">${largeArtist}</span><span class="search-modal-card-small-artist">${smallArtist}</span>`)
  // album name
  document.querySelector(`#searchModalCard${cardNumber} .search-modal-card-album`).innerHTML = `<span class="search-modal-card-large-album">${largeAlbum}</span><span class="search-modal-card-small-album">${smallAlbum}</span>`;
  // $(`#searchModalCard${cardNumber} .search-modal-card-album`).html(`<span class="search-modal-card-large-album">${largeAlbum}</span><span class="search-modal-card-small-album">${smallAlbum}</span>`) 
  // album cover
  document.querySelector(`#searchModalCard${cardNumber} .search-modal-card-image`).src = album.cover.replace('{w}', 260).replace('{h}', 260);
  // $(`#searchModalCard${cardNumber} .search-modal-card-image`).attr('src', album.cover.replace('{w}', 260).replace('{h}', 260))
  // add album-page-link to album cover
  document.querySelector(`#searchModalCard${cardNumber} .search-modal-card-album-link`).href = `/album/${album.appleAlbumID}`;
  // $(`#searchModalCard${cardNumber} .search-modal-card-album-link`).attr('href', `/album/${album.appleAlbumID}`)
}

document.getElementById('search-modal-button').addEventListener('click', function(event) {
  event.preventDefault();
  const search = document.getElementById('search-modal-input').value.trim().replace(/[^\w\s]/gi, '');
  const noResultsMessage = document.getElementById('no-results-message');
  if (noResultsMessage) { noResultsMessage.parentNode.removeChild(noResultsMessage); }
  // $('#no-results-message').remove();
  document.getElementById('search-modal-results').innerHTML = '';
  // $('#search-modal-results').html('');
  document.querySelector('#searchModal .new-loader').classList.remove('hide_me');
  // $('#searchModal .new-loader').show();
  executeSearch(search);
});

// execute search when enter key is pressed
document.getElementById('search-modal-input').addEventListener('keyup', function(event) {
  if (event.keyCode === 13) {
    document.getElementById('search-modal-button').click();
  }
});

document.addEventListener('DOMContentLoaded', function() {
  // make hover scrollbar always visible on touchscreens
  let isTouchDevice = false;
  if ("ontouchstart" in document.documentElement) { isTouchDevice = true; }
  if (isTouchDevice) {
    const searchResultsBox = document.getElementById("search-modal-results");
    searchResultsBox.style.paddingBottom="0px";
    searchResultsBox.style.overflowX="scroll";
  }

  document.getElementById("launch-search-modal-button").addEventListener('click', function(event) {
    event.preventDefault();
    new Modal(document.getElementById('searchModal')).show();
  });
});