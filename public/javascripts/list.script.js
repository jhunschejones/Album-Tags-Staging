// ------- START UTILITIES SECTION ----------
// ======
// To compile with google closure compiler
// instructions: https://developers.google.com/closure/compiler/docs/gettingstarted_app
// terminal command: `java -jar compiler.jar --js list.script.js --js_output_file list.script.min.js`
// ======

function truncate(str, len){
  // set up the substring
  const subString = str.substr(0, len-1);
  // add elipse after last complete word & trim trailing comma
  return (subString.substr(0, subString.lastIndexOf(' ')).replace(/(^[,\s]+)|([,\s]+$)/g, '') + '...');
}

function removeDash(str) { return str.replace(/-/g, ''); }

function bubbleSort(arr, prop) {
  let swapped;
  do {
    swapped = false;
    for (let i = 0; i < arr.length - 1; i++) {
      if (parseInt(removeDash(arr[i][prop])) > parseInt(removeDash(arr[i + 1][prop]))) {
        const temp = arr[i];
        arr[i] = arr[i + 1];
        arr[i + 1] = temp;
        swapped = true;
      }
    }
  } while (swapped);
}

function scrollToTop() {
  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}

function textToClassName(str) { return str.replace(/[^\w\s]/gi, '').replace(/\s\s+/g, ' ').replace(/ /g, '_').toLowerCase(); }

function isGenre(str) {
  const myGenres = ['Metalcore', 'Pop Punk', 'Emo', 'Rock', 'Post-Hardcore', 'Accoustic', 'Screamo', 'Metal', 'Nu Metal', 'Alt Metal', 'Djent', 'Accoustic', 'Jazz', 'Ska', 'Rap-Rock', 'Progressive', 'Punk', 'Rap'];
  return myGenres.indexOf(str) !== -1;
}

function removeFromArray(arr, ele){
  if (arr.indexOf(ele) !== -1) { arr.splice(arr.indexOf(ele), 1); }
}

function addToArray(arr, ele){
  if (arr.indexOf(ele) === -1) { arr.push(ele); }
}

function removeDuplicates(inputArray){
  let outputArray = [];
  for(let i = 0;i < inputArray.length; i++){
    if(outputArray.indexOf(inputArray[i]) == -1){
      outputArray.push(inputArray[i]);
    }
  }
  return outputArray;
}

function escapeHtml(text) {
  var map = {
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&sol;',
    '\\': '&#92;',
    '{': '&#123;',
    '}': '&#125;',
  };
  return text.replace(/[<>"'/\\{}]/g, function(m) { return map[m]; });
}
// ------- END UTILITIES SECTION ----------

let listData;
let listType;
let listID;
let tagSearch;
let startingURL = (new URL(document.location));
let totalAlbumsOnPage = 0;

if (startingURL.pathname === "/list") {
  listType = startingURL.searchParams.get("type");
  listID = startingURL.searchParams.get("id");
  tagSearch = startingURL.searchParams.get("search");
} else if (startingURL.pathname === "/myfavorites") {
  listType = "myfavorites";
}

function getList() {
  if (listType === "favorites") {
    // GET SHARED FAVORITES LIST
    $.ajax({
      method: "GET",
      url: "/api/v1/list/favorites/" + listID,
      success: function(data) {
        if (data.message) {
          alert(data.message);
        } else {
          listData = data;
          $('#main-page-loader').hide();
          populateList();
        }
      }
    });
  } else if (listType === "userlist"){
    // GET CUSTOM USER LIST
    $.ajax({
      method: "GET",
      url: "/api/v1/list/" + listID,
      success: function(data) {
        if (data.message) {
          alert(data.message);
        } else {
          listData = data;
          $('#main-page-loader').hide();
          populateList();
        }
      }
    });
  } else if (listType === "myfavorites") {
    // GET FAVORITES LIST FOR CURRENT USER
    $.ajax({
      method: "GET",
      url: "/api/v1/album/favorites/" + userID,
      success: function(data) {
        if (data.message && data.message === "This user does not have any favorited albums.") {
          listData = [];
          $('#main-page-loader').hide();
          populateList();
        } else if (data.message) {
          alert(data.message);
        } else {
          listData = {
            user: userID,
            displayName: "You!",
            title: "My Favorites",
            albums: data
          };
          $('#main-page-loader').hide();
          populateList();
        }
      }
    });
  } else if (listType === "tagsearch") {
    // GET TAG SEARCH RESULTS
    let databaseTags = [];
    let sellectedTagsHTML = "";
    decodeURIComponent(tagSearch).split(',').forEach(tag => {
      databaseTags.push(escapeHtml(tag)); // the tags we're searching in the database are already stored with escaped-HTML
      sellectedTagsHTML += `<a href="/list?type=tagsearch&search=${encodeURIComponent(tag)}" class="badge badge-light text-secondary mr-1 tagsearch-tag" data-toggle="tooltip" data-placement="top" title="Search for albums with just this tag" data-trigger="hover">${escapeHtml(tag)}</a>`;
    });
    $("#no-albums-message").html("No albums match this combination of tags. Go <a href='/alltags'>back</a> to try another search, or click one of the tags above to search just that tag.");
  
    $.ajax({
      method: "GET",
      url: "/api/v1/album/matchingtags/" + databaseTags,
      success: function(data) {
        if (data.message) {
          alert(data.message);
        } else {
          listData = {
            user: userID || null,
            displayName: "All Users",
            // title: `Tags: ${decodeURIComponent(tagSearch).split(',').join(', ')}`, // TAGS AS TEXT
            title: `Tags: ${sellectedTagsHTML}`, // TAGS AS BADGES
            albums: data
          };
          $('#main-page-loader').hide();
          populateList();
        }
      }
    });
  }
}

function showAppliedFilter(filter, filterType) {
  $('#applied-filters').show();
  const cleanFilter = escapeHtml(filter);
  const pageFilter = cleanFilter.length > 24 ? truncate(cleanFilter, 24) : cleanFilter;
  $('#applied-filters').append(`<span class="badge badge-primary mr-1 applied-filter applied-filter-${filterType}" data-${filterType}="${filter}">${pageFilter}</span>`);

  $(`.applied-filter-${filterType}`).click(function() {
    toggleFilter(filterType, $(this).data(filterType));
  });
}

function showAlbumCount() {
  const hideCount = sessionStorage.getItem('hideCount');
  if (!hideCount) {
    $('#result-count').remove();
    const countText = `&#8594; ${totalAlbumsOnPage} ${totalAlbumsOnPage > 1 || totalAlbumsOnPage === 0 ? "albums" : "album"}`;
    $('#applied-filters').append(`<small id="result-count">${countText}</small>`);
    $('#applied-filters').show();
  
    // HIDE ALBUM COUNT AFTER 3 SECONDS IF NO FILTERS APPLIED
    // if ($('.applied-filter').length < 1) {
    //   setTimeout(function(){ $('#applied-filters').hide(); }, 3000);
    // }

    // HIDE ALBUM COUNT ON USER CLICK
    // $('#result-count').click(function(){
    //   sessionStorage.setItem('hideCount', true);
    //   if ($('.applied-filter').length < 1) {
    //     $('#applied-filters').hide();
    //   }
    //   $('#result-count').hide();
    // })
  }

  if (hideCount && $('.applied-filter').length < 1) { $('#applied-filters').hide(); }
}

function createCard(cardNumber) {
  $('#albums').append(`<div id="card${cardNumber}" class="card list-card"><a class="album-details-link" href=""><img class="card-img-top" src=""><a/><div class="card-body"><h4 class="card-title"></h4><span class="album-title"></span></div></div>`);
}

function populateCard(album, cardNumber) {
  let smallArtist = album.artist.length > 32 ? truncate(album.artist, 32) : album.artist;
  let largeArtist = album.artist.length > 49 ? truncate(album.artist, 49) : album.artist;
  let smallAlbum = album.title.length > 44 ? truncate(album.title, 44) : album.title;
  let largeAlbum = album.title.length > 66 ? truncate(album.title, 66): album.title;
  
  // artist name
  $(`#card${cardNumber} .card-body h4`).html(`<span class="large_artist">${largeArtist}</span><span class="small_artist">${smallArtist}</span>`);
  // album name
  $(`#card${cardNumber} .card-body .album-title`).html(`<span class="large_album">${largeAlbum}</span><span class="small_album">${smallAlbum}</span>`); 
  // album cover
  $(`#card${cardNumber} .card-img-top`).attr('src', album.cover.replace('{w}', 260).replace('{h}', 260));
  // add album-details-link to album cover
  $(`#card${cardNumber} .album-details-link`).attr('href', `/album/${album.appleAlbumID}`);
  // remove album from list button
  $(`#card${cardNumber}`).append(`<span class="album-delete-button" data-album-id="${album.appleAlbumID}" data-toggle="tooltip" data-placement="right" title="Remove from list" data-trigger="hover">&#10005;</span></li>`);

  // sets remove album button visibility
  if (listData.user === userID && (listType === "userlist" || listType === "myfavorites")) {
    $('.album-delete-button').show();
  } else {
    $('.album-delete-button').hide();
  }
}

function populateList() {
  $('#page-info-button').hide();
  $("#no-albums-message").hide();
  $('#albums').html('');
  totalAlbumsOnPage = 0;

  let listCreator = listData.displayName;
  if (!listCreator || listCreator.trim === "") { listCreator = "Unknown"; }
  $('#list-title').html(`${listData.title}`);
  $('#list-title').after('<h5 id="page-info-button" class="text-secondary" data-toggle="modal" data-target="#pageInfoModal">&#9432;</h5>');
  if (listType !== "userlist") { $('#page-info-button').hide(); }
  $('#list-creator').text("by: " + listCreator);

  if (listData.albums && listData.albums.length > 0) {
    let albumArray = filterAlbums();

    if (albumArray.length > 0) {
      $('#no-albums-message').hide();
    } else {
      // if removing an album results in no albums on the page
      // clear all filters and try one more time
      clearFilters(); 
      albumArray = filterAlbums();
      if (albumArray.length > 0) {
        $('#no-albums-message').hide(); 
        $('#albums').html('');
      } else {
        $('#no-albums-message').show();
      }
    }

    for (let index = 0; index < albumArray.length; index++) {
      const albumObject = albumArray[index];
      const card = index + 1;
      createCard(card);
      populateCard(albumObject, card);
    }
    totalAlbumsOnPage = albumArray.length;
  
    // ====== add event listener to delete buttons =====
    $(".album-delete-button").on("click", function() { 
      if (listData.user !== userID) return alert("Sorry! Only the list creator can delete albums."); 
      
      if (listType === "userlist") {
        removeListAlbum($(this).attr("data-album-id")); 
      } else if (listType === "myfavorites") {
        removeFavoritesAlbum($(this).attr("data-album-id")); 
      } else {
        return alert("Sorry! This type of list won't let you delete albums.");
      }
    });
    populateFilters(albumArray);
  } else {
    $("#no-albums-message").show();
    populateFilters([]);
  }
  displayButtons(); // show user control buttons for this list type
  showAlbumCount();
}

function removeListAlbum(albumID) {
  if (listData.user !== userID) { alert("Sorry, only the list creator can delete albums from a list."); return; }
  let thisAlbum = listData.albums.find(x => x.appleAlbumID === albumID);
  let confirmed = confirm(`Are you sure you want to remove "${thisAlbum.title}" from this list? You cannot undo this operation.`);
  
  if (confirmed) {
    let deleteObject = {
      method: "remove album",
      appleAlbumID: thisAlbum.appleAlbumID,
      title: thisAlbum.title,
      artist: thisAlbum.artist,
      releaseDate: thisAlbum.releaseDate,
      cover: thisAlbum.cover,
      genres: thisAlbum.genres
    };
    $.ajax({
      method: "PUT",
      url: "/api/v1/list/" + listID,
      contentType: 'application/json',
      data: JSON.stringify(deleteObject),
      success: function(data) {
        listData = data;
        populateList();
      }
    });
  }
}

function editDisplayName() {
  let newDisplayName = $("#list-display-name-input").val().trim();

  // pass basic data validation
  if (newDisplayName === listData.displayName) return alert(`The display name for this list is already set as "${listData.displayName}"`);
  if (newDisplayName.length > 30) return alert("Display names must be shorter than 30 characters in length.");

  // start updating list
  let updateObject = {
    method: "change display name",
    displayName: newDisplayName
  };
  $.ajax({
    method: "PUT",
    url: "/api/v1/list/" + listID,
    contentType: 'application/json',
    data: JSON.stringify(updateObject),
    success: function(data) {
      if (!data.message) {
        listData = data;
        populateList();
        $('#list-update-success').html("List info updated! &#10003;");
        setTimeout(function(){ $('#list-update-success').html('&nbsp;'); }, 3000);
      } else {
        alert(data.message);
      }
    }
  });
}

function editListTitle() {
  let newListTitle = $("#list-title-input").val().trim();

  // pass basic data validation
  if (newListTitle === listData.title) return alert(`The title for this list is already "${listData.title}"`);
  if (newListTitle.length > 60) return alert("List titles must be shorter than 60 characters in length.");

  // start updating list
  if (newListTitle && newListTitle.length > 0) {
    let updateObject = {
      method: "change title",
      title: newListTitle
    };
    $.ajax({
      method: "PUT",
      url: "/api/v1/list/" + listID,
      contentType: 'application/json',
      data: JSON.stringify(updateObject),
      success: function(data) {
        if (!data.message) {
          listData = data;
          populateList();
          $('#list-update-success').html("List info updated! &#10003;");
          setTimeout(function(){ $('#list-update-success').html('&nbsp;'); }, 3000);
        } else {
          alert(data.message);
        }
      }
    });
  } else {
    alert("A non-blank title is required for every list.");
    $('#list-title-input').val(listData.title);
  }
}

let addAlbumResults = [];
function populateAddToListModalResults(data) {
  $('#add-album-search-results').html('');
  $('#add-album-card-body .new-loader').hide();
  if (data.albums && data.albums.length > 0) {
    // store search results globally
    addAlbumResults = data.albums;

    for (let index = 0; index < data.albums.length; index++) {
      const album = data.albums[index];
      const cardNumber = index + 1;
      addPageModalCard('add-album-search-results', 'addAlbum', cardNumber);
      populatePageModalCard('addAlbum', addToList, addAlbumResults, album, cardNumber);
    }
    // this adds an empty space at the end so the user can scroll 
    // all the way to the right to see the last album
    $('#add-album-search-results').append('<div id="add-search-modal-placeholder">&nbsp;</div>');
  } else {
    $('#add-album-search-results').after('<div id="no-results-message" class="text-primary" style="text-align:center;">It looks like no albums matched your search terms. Try a different search!</div>');
  }
}

// ====== START CREATE AND POPULATE ALBUM CARDS FOR MODALS ======
function addPageModalCard(divName, modalType, cardNumber) {
  $(`#${divName}`).append(`<div id="${modalType}ModalCard${cardNumber}" class="search-modal-card" data-result-index="${cardNumber - 1}"><img class="search-modal-card-image" src="" alt=""><div class="search-modal-card-body"><h4 class="search-modal-card-title"></h4><span class="search-modal-card-album"></span></div></div>`);
}

function populatePageModalCard(modalType, clickMethod, resultsArray, album, cardNumber) {
  let smallArtist = album.artist.length > 32 ? truncate(album.artist, 32) : album.artist;
  let largeArtist = album.artist.length > 49 ? truncate(album.artist, 49) : album.artist;
  let smallAlbum = album.title.length > 44 ? truncate(album.title, 44) : album.title;
  let largeAlbum = album.title.length > 66 ? truncate(album.title, 66): album.title;
  
  // artist name
  $(`#${modalType}ModalCard${cardNumber} .search-modal-card-title`).html(`<span class="search-modal-card-large-artist">${largeArtist}</span><span class="search-modal-card-small-artist">${smallArtist}</span>`);
  // album name
  $(`#${modalType}ModalCard${cardNumber} .search-modal-card-album`).html(`<span class="search-modal-card-large-album">${largeAlbum}</span><span class="search-modal-card-small-album">${smallAlbum}</span>`);
  // album cover
  $(`#${modalType}ModalCard${cardNumber} .search-modal-card-image`).attr('src', album.cover.replace('{w}', 260).replace('{h}', 260));

  $(`#${modalType}ModalCard${cardNumber}`).click(function() {
    const selectedAlbumIndex = $(this).data("result-index");
    const selectedAlbum = resultsArray[selectedAlbumIndex];
    clickMethod(selectedAlbum);
  });
}
// ====== END CREATE AND POPULATE ALBUM CARDS FOR MODALS ======

function addToList(selectedAlbum) {
  if (selectedAlbum) {
    let alreadyInList = listData.albums.find(x => x.appleAlbumID === selectedAlbum.appleAlbumID);
    if (alreadyInList) return alert(`"${selectedAlbum.title}" is already in this list.`);

    let addAlbumToListBody = {
      method: "add album",
      appleAlbumID: selectedAlbum.appleAlbumID,
      title: selectedAlbum.title,
      artist: selectedAlbum.artist,
      releaseDate: selectedAlbum.releaseDate,
      cover: selectedAlbum.cover,
      genres: selectedAlbum.genres
    };
    $.ajax({
      method: "PUT",
      url: "/api/v1/list/" + listData._id,
      contentType: 'application/json',
      data: JSON.stringify(addAlbumToListBody),
      success: function(data) {
        if (!data.message) {
          listData = data;
          populateList();
          $('#editListModal').modal('hide');
        } else {
          alert(data.message);
        }
      }
    });
  }
}

function toggleActiveInfoTab(element) {
  $('#editListModal .active').removeClass("active").addClass("inactive-list-edit-tab");
  $(element).removeClass("inactive-list-edit-tab").addClass("active");
  $('.edit-list-card-body').hide();
  const selectedCard = element.data('card');
  $(`#${selectedCard}-card-body`).show();
}


// ====== START FILTER FUNCTIONALITY ======
function getCleanAlbumArray(arr) {
  let cleanArray = [];
  arr.forEach(ele => {
    if (ele.album) {
      cleanArray.push(ele.album);
    } else {
      cleanArray.push(ele);
    }
  });

  cleanArray.forEach(album => {
    if (album.tagObjects) {
      album.tagGenres = [];
      album.tagObjects.forEach(tagObject => {
        // check if the tag is created by the same person who created the list
        if (tagObject.creator === listData.user && (isGenre(tagObject.tag) || tagObject.customGenre) && album.tagGenres.indexOf(tagObject.tag) === -1) {
          album.tagGenres.push(tagObject.tag);
        }
      });
    }
    album.year = album.releaseDate.slice(0,4);
  });
  return cleanArray;
}

function getFilterObject() {
  return {
    "year": (new URL(document.location)).searchParams.get("year"),
    "artist": (new URL(document.location)).searchParams.get("artist"),
    "genre": (new URL(document.location)).searchParams.get("genre")
  };
}

function filterAlbums() {
  $('.applied-filter').remove(); // clear out previous filters displayed after list creator
  const filterObject = getFilterObject();
  let albumArray = getCleanAlbumArray(listData.albums);
  
  if (!!filterObject.genre) { // `!!` forces a boolean value
    albumArray = albumArray.filter(album => {
      return !album.tagGenres ? false : album.tagGenres.indexOf(filterObject.genre) !== -1;
    });
    showAppliedFilter(filterObject.genre, "genre");
  }
  if (!!filterObject.artist) {
    albumArray = albumArray.filter(album => !!album.artist && album.artist === filterObject.artist);
    showAppliedFilter(filterObject.artist, "artist");
  }
  if (!!filterObject.year) {
    albumArray = albumArray.filter(album => !!album.year && album.year === filterObject.year);
    showAppliedFilter(filterObject.year, "year");
  }
  bubbleSort(albumArray, "releaseDate");
  albumArray = albumArray.reverse(); // reverse shows newer albums first (generally)
  return albumArray;
}

let artistFilterElements;
function populateFilters(albumArray) {
  const filterObject = getFilterObject();
  $('#year-filter-dropdown').html('');
  $('#artist-filter-dropdown').html('');
  $('#genre-filter-dropdown').html('');

  if (albumArray.length < 1) {
    return $('.remove-if-no-albums').hide();
  } else {
    $('.remove-if-no-albums').show();
  }

  // YEAR FILTERS
  let yearFilters = [];
  albumArray.forEach(album => { addToArray(yearFilters, album.releaseDate.slice(0,4)); });
  yearFilters.sort().reverse();
  yearFilters.forEach(year => {
    if (!!filterObject.year && year === filterObject.year) {
      $('#year-filter-dropdown').append(`<span class="badge badge-primary year-filter" data-year="${year}">${year}</span>`);
    } else {
      $('#year-filter-dropdown').append(`<span class="badge badge-light year-filter" data-year="${year}">${year}</span>`);
    }
  });
  $('.year-filter').click(function() {
    toggleFilter("year", $(this).data("year"));
  });

  // ARTIST FILTERS
  let artistFilters = [];
  albumArray.forEach(album => { addToArray(artistFilters, album.artist); });
  artistFilters.sort();
  artistFilters.forEach(artist => {
    if (!!filterObject.artist && artist === filterObject.artist) {
      $('#artist-filter-dropdown').append(`<span class="badge badge-primary artist-filter" data-artist="${artist}">${artist.length > 32 ? truncate(artist, 32) : artist}</span>`);
    } else {
      $('#artist-filter-dropdown').append(`<span class="badge badge-light artist-filter" data-artist="${artist}">${artist.length > 32 ? truncate(artist, 32) : artist}</span>`);
    }
  });
  $('.artist-filter').click(function() {
    toggleFilter("artist", $(this).data("artist"));
  });
  // Add artist-filter input if more than 12 artists
  if (artistFilters.length > 12) {
    $('#artist-filter-dropdown').prepend('<input id="artist-tag-filter-input" type=search placeholder="Filter artist tags..." class="form-control"></input>');
    artistFilterElements = document.getElementsByClassName('artist-filter');
    $("#artist-tag-filter-input").on("input", searchFilter);
  }

  // GENRE FILTERS
  let genreFilters = [];
  albumArray.forEach(album => { if (album.tagGenres) { 
    album.tagGenres.forEach(genre => {
      addToArray(genreFilters, genre);
    });
  }});

  if (genreFilters.length < 1) { $('#filter-by-genre-button').hide(); }
  else { $('#filter-by-genre-button').show(); }
  
  genreFilters.sort();
  genreFilters.forEach(genre => {
    if (!!filterObject.genre && genre === filterObject.genre) {
      $('#genre-filter-dropdown').append(`<span class="badge badge-primary genre-filter" data-genre="${genre}">${genre.length > 32 ? truncate(genre, 32) : genre}</span>`);
    } else if (!filterObject.genre) { // don't show any other genre filters if there is a selected genre
      $('#genre-filter-dropdown').append(`<span class="badge badge-light genre-filter" data-genre="${genre}">${genre.length > 32 ? truncate(genre, 32) : genre}</span>`);
    }
  });
  $('.genre-filter').click(function() {
    toggleFilter("genre", $(this).data("genre"));
  });
}

function searchFilter() {
  userInput = document.getElementById("artist-tag-filter-input").value.toUpperCase();
  // if you remove all spaces and there is nothing in the input field then set all 
  // buttons to visible. This addresses empty searches and is used later to display 
  // all buttons when the box is blank
  if (userInput.trim().length == 0){
    for (let i = 0; i < artistFilterElements.length; i++){
      artistFilterElements[i].style.display = "";
    }
  } else {
    for (let i = 0; i < artistFilterElements.length; i++) {
      // if (tagElements[i].value.toUpperCase().indexOf(userInput)!= -1) {
      if (artistFilterElements[i].dataset.artist.toUpperCase().indexOf(userInput)!= -1) {
        artistFilterElements[i].style.display = "";
      } else {
        artistFilterElements[i].style.display = "none";
      }
    }
  }
}

function toggleFilter(type, filter) {
  let url = new URL(document.location);
  if (url.searchParams.get(type) == filter) {
    url.searchParams.delete(type); // toggle off if already set
  } else {
    url.searchParams.set(type, filter); // add if not set
  }
  history.replaceState({}, '', url); // replace history entry
  // history.pushState({}, '', url); // add new history entry
  populateList();
}

function clearFilters() {
  let url = new URL(document.location);
  url.searchParams.delete("year");
  url.searchParams.delete("artist");
  url.searchParams.delete("genre");
  history.replaceState({}, '', url); // replace history entry
  // history.pushState({}, '', url); // add new history entry
  populateList();
}

$('#clear-filters-button').click(clearFilters);
// ====== END FILTER FUNCTIONALITY ======

// ====== START MY FAVORITES FUNCTIONALITY ======
let addFavoritesAlbumResults = [];
function populateAddToFavoritesModalResults(data) {
  $('#favorites-search-results').html('');
  $('#addFavoritesAlbumModal .new-loader').hide();
  if (data.albums && data.albums.length > 0) {
    // store search results globally
    addFavoritesAlbumResults = data.albums;

    for (let index = 0; index < data.albums.length; index++) {
      const album = data.albums[index];
      const cardNumber = index + 1;
      addPageModalCard('favorites-search-results', 'addFavorites', cardNumber);
      populatePageModalCard('addFavorites', addToFavorites, addFavoritesAlbumResults, album, cardNumber);
    }
    
    // this adds an empty space at the end so the user can scroll 
    // all the way to the right to see the last album
    $('#favorites-search-results').append('<div id="add-search-modal-placeholder">&nbsp;</div>');
  } else {
    $('#favorites-search-results').after('<div id="no-results-message" class="text-primary mb-3" style="text-align:center;">It looks like no albums matched your search terms. Try a different search!</div>');
  }
}

$('#add-favorites-album-button').click(function() {
  const search = $('#add-favorites-album-input').val().trim().replace(/[^\w\s]/gi, '');
  $('#no-results-message').remove();
  $('#favorites-search-results').html('');
  $('#addFavoritesAlbumModal .new-loader').show();
  executeSearch(search, "add to favorites");
});
$("#add-favorites-album-input").keyup(function(event) {
  if (event.keyCode === 13) {
    $("#add-favorites-album-button").click();
  }
});

function addToFavorites(selectedAlbum) {
  let alreadyInFavorites = listData.albums.find(x => x.appleAlbumID === selectedAlbum.appleAlbumID);
  if (alreadyInFavorites) return alert(`"${selectedAlbum.title}" is already in your favorites.`);

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
          listData.albums.push(album);
          $('#addFavoritesAlbumModal').modal("hide");
          $('#add-favorites-album-input').val('');
          $('#favorites-search-results').html('');
          populateList();
        } else {
          alert(album.message);
        }
      }
    });
  }
}

function removeFavoritesAlbum(selectedAlbum) {
  if (listData.user !== userID) return alert("Sorry, only the list creator can delete albums from a list."); 
  let albumToRemove = listData.albums.find(x => x.appleAlbumID === selectedAlbum);
  let confirmed = confirm(`Are you sure you want to remove "${albumToRemove.title}" from your favorites? You cannot undo this operation.`);

  if (confirmed && albumToRemove) {
    $.ajax(`/api/v1/album/favorites/${selectedAlbum}`, {
      method: 'DELETE',
      contentType: 'application/json',
      data: JSON.stringify({ "user" : userID }),
      success: function(data) {
        if (!data.message) {
          removeFromArray(listData.albums, albumToRemove);
          populateList();
        } else {
          alert(data.message);
        }
      }
    });
  }
}
// ====== END MY FAVORITES FUNCTIONALITY ======

// ====== START EVENT LISTENERS ======
$("#favorites-display-name-input").keyup(function(event) {
  if (event.keyCode === 13) {
    $("#get-shareable-link").click();
  }
});
$('#get-shareable-link').click(function() {
  let displayName = $('#favorites-display-name-input').val();

  $.ajax(`/api/v1/list/favorites/${userID}`, {
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({
      "displayName": displayName
    }),
    success: function (data) {
      const myFavoritesURL = window.location.protocol + "//" + window.location.host + "/list?type=favorites&id=" + data;
      const urlBox = document.getElementById("shareable-url");
      urlBox.value = myFavoritesURL;
      urlBox.select();

      navigator.clipboard.writeText(myFavoritesURL).then(function() {
        // show message if clipboard write succeeded
        $('#copied-message').show();
        setTimeout(function(){ $('#copied-message').hide(); }, 3000);
      }, function() {
        // clipboard write failed
      });
    }
  });
});
$('#add-album-modal-button').click(function() {
  const search = $('#add-album-modal-input').val().trim().replace(/[^\w\s]/gi, '');
  $('#add-album-search-results').html('');
  $('#no-results-message').remove();
  $('#add-album-card-body .new-loader').show();
  executeSearch(search, "add to list");
});
$('#share-favorites-button').click(function() {
  $('#shareFavoritesModal').modal('show');
});
$("#add-album-modal-input").keyup(function(event) {
  if (event.keyCode === 13) {
    $("#add-album-modal-button").click();
  }
});
$('#edit-button').click(function() {
  if (listData.user !== userID) return alert("Sorry! Only the list creator can edit the information for this list.");

  toggleActiveInfoTab($('#edit-list-modal-nav-tab'));
  $('#editListModal').modal('show');
  $('#list-title-input').val(listData.title);
  $('#list-display-name-input').val(listData.displayName || "Unknown");
});
$('#add-album-button').click(function() {
  if (listData.user !== userID) return alert("Sorry! Only the list creator can add albums to this list.");

  if (listType === "userlist") {
    toggleActiveInfoTab($('#add-album-modal-nav-tab'));
    $('#editListModal').modal('show');
    $('#list-title-input').val(listData.title);
    $('#list-display-name-input').val(listData.displayName || "Unknown");
  } else if (listType === "myfavorites") {
    $('#addFavoritesAlbumModal').modal('show');
  }
});
$('.add-album-refrence').click(function() {
  $('#pageInfoModal').modal('hide');
  $("#add-album-button").click();
});
$('.edit-list-refrence').click(function() {
  $('#pageInfoModal').modal('hide');
  $('#edit-button').click();
});
$("#list-title-input").keyup(function(event) {
  if (event.keyCode === 13) {
    $("#update-list-title").click();
  }
});
$("#list-display-name-input").keyup(function(event) {
  if (event.keyCode === 13) {
    $("#update-list-display-name").click();
  }
});
$('#update-list-display-name').click(editDisplayName);
$('#update-list-title').click(editListTitle);
$('#editListModal .nav-link').click(function(event) {
  event.preventDefault();
  toggleActiveInfoTab($(this));
});
$('#to-top-button').click(scrollToTop);
// closes filter dropdowns when page is scrolling
$(document).on( 'scroll', function(){
  $('#year-filter-dropdown').removeClass('show');
  $('#genre-filter-dropdown').removeClass('show');
  $('#artist-filter-dropdown').removeClass('show');
});
// ====== END EVENT LISTENERS ======


// ----- START FIREBASE AUTH SECTION ------
const config = {
  apiKey: "AIzaSyAoadL6l7wVMmMcjqqa09_ayEC8zwnTyrc",
  authDomain: "album-tags-v1d1.firebaseapp.com",
  projectId: "album-tags-v1d1",
};
const defaultApp = firebase.initializeApp(config);
let userID = false;
// checking if user is logged in or logs in during session
firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    userID = firebase.auth().currentUser.uid;
    getList();

    $('#full_menu_login_logout_container').show();
    $('#login_button').hide();
    $('#full_menu_login_button').hide();
    $('#logout_button').show();
    $('#full_menu_logout_button').show();
    $('#log_in_message').hide();
  } else {   
    // no user logged in
    userID = false;

    $('#full_menu_login_logout_container').show();
    $('#login_button').show();
    $('#full_menu_login_button').show();
    $('#logout_button').hide();
    $('#full_menu_logout_button').hide();
    $('#main-page-loader').hide();
    if (listType === "myfavorites") { 
      $('#no-albums-message').hide();
      $('#log_in_message').show(); 
      $('#list-title').text("My Favorites");
      $('#list-creator').text("You!");
      displayButtons();
      return;
    }

    getList();
  }
});

function logIn() {
  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  // local persistance remains if browser is closed
  .then(function() {
    const provider = new firebase.auth.GoogleAuthProvider();
    return firebase.auth().signInWithPopup(provider);
  })
  .then(function(result) {
    userID = user.uid;
    populateList();

    $('#full_menu_login_logout_container').show();
    $('#login_button').hide();
    $('#full_menu_login_button').hide();
    $('#logout_button').show();
    $('#full_menu_logout_button').show();
    $('#log_in_message').hide();
  }).catch(function(error) {
    // Handle Errors here.
  });
}

function logOut() {
  firebase.auth().signOut().then(function() {
    userID = false;
    location.reload();

  }).catch(function(error) {
  // An error happened.
  });
}

function displayButtons() {
  if (!listData && listType === "myfavorites") {
    $('#page-info-button').hide();
    $('.tag-search-only').hide();
    $('#edit-button').hide();
    $('#add-album-button').hide();
    $('.remove-if-no-albums').hide();
    $('#share-favorites-button').hide();
  } else if (listData.user === userID && listType === "userlist") {
    $('#edit-button').show(); 
    $('.tag-search-only').hide();
    $('#add-album-button').show();
    $('#page-info-button').show();
  } else if (listData.user === userID && listType === "myfavorites") {
    $('#page-info-button').show();
    $('.list-only').hide();
    $('.tag-search-only').hide();
    $('#edit-button').hide();
    $('#add-album-button').show();
    $('#share-favorites-button').show();
  } else {
    $('#page-info-button').hide();
    $('#edit-button').hide();
    $('#add-album-button').hide();
    $('.album-delete-button').hide();
  }

  if (listType === "favorites") {
    $('#page-info-button').show();
    $('.list-and-favorites-only').hide();
    $('.tag-search-only').hide();
    $('.list-only').hide();
  }

  if (listType === "tagsearch") {
    $('#page-info-button').show();
    $('.tag-search-only').show();
    $('.list-only').hide();
    $('.list-and-favorites-only').hide();
    if ($('.tagsearch-tag').length > 1) {
      // ------ enable tooltips ------
      let isTouchDevice = false;
      if ("ontouchstart" in document.documentElement) { isTouchDevice = true; }
      if (!isTouchDevice) { $('[data-toggle="tooltip"]').tooltip(); }
    }
  }
}

// add event listener to log in and out buttons
$('#login_button').click(logIn);
$('#full_menu_login_button').click(logIn);
$('#logout_button').click(logOut);
$('#full_menu_logout_button').click(logOut);
$('.login_button').click(logIn);
// ----- END FIREBASE AUTH SECTION ------


// make hover scrollbar always visible on touchscreens
$(document).ready(function() {
  let isTouchDevice = false;
  if ("ontouchstart" in document.documentElement) { isTouchDevice = true; }
  if (isTouchDevice) {
    // SCROLLBAR FOR ADD TO LIST
    let searchResultsBox = document.getElementById("add-album-search-results");
    searchResultsBox.style.paddingBottom="0px";
    searchResultsBox.style.overflowX="scroll";
    // SCROLLBAR FOR ADD TO FAVORITES
    searchResultsBox = document.getElementById("favorites-search-results");
    searchResultsBox.style.paddingBottom="0px";
    searchResultsBox.style.overflowX="scroll";
  }
});