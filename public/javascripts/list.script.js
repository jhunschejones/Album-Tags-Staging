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

function scrollToTop() {
  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}

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

function addClassEventListener(selector, eventType, myFunction) {
  const c = document.getElementsByClassName(selector);
  for (let i = 0; i < c.length; i++) {
    c[i].addEventListener(eventType, myFunction);
  }
}

function stringToNode(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content.firstChild;
}

function showClass(selector) {
  const otherLists = document.getElementsByClassName(selector);
  for (let i = 0; i < otherLists.length; i++) {
    otherLists[i].classList.remove('hide_me');
  }
}

function hideClass(selector) {
  const otherLists = document.getElementsByClassName(selector);
  for (let i = 0; i < otherLists.length; i++) {
    otherLists[i].classList.add('hide_me');
  }
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

async function getList() {
  if (listType === "favorites") {
    // GET SHARED FAVORITES LIST
    let response = await fetch("/api/v1/favorite/virtual/" + listID);
    if (!response.ok) throw Error(response.statusText);
    let data = await response.json();
    if (data.message) {
      alert(data.message);
    } else {
      listData = data;
      document.getElementById('main-page-loader').classList.add('hide_me');
      populateList();
    }
    // $.ajax({
    //   method: "GET",
    //   url: "/api/v1/favorite/virtual/" + listID,
    //   success: function(data) {
        // if (data.message) {
        //   alert(data.message);
        // } else {
        //   listData = data;
        //   $('#main-page-loader').hide();
        //   populateList();
        // }
    //   }
    // });
  } else if (listType === "userlist"){
    // GET CUSTOM USER LIST
    let response = await fetch("/api/v1/list/" + listID);
    if (!response.ok) throw Error(response.statusText);
    let data = await response.json();

    if (data.message) {
      alert(data.message);
    } else {
      listData = data;
      document.getElementById('main-page-loader').classList.add('hide_me');
      populateList();
    }
    // $.ajax({
    //   method: "GET",
    //   url: "/api/v1/list/" + listID,
    //   success: function(data) {
        // if (data.message) {
        //   alert(data.message);
        // } else {
        //   listData = data;
        //   $('#main-page-loader').hide();
        //   populateList();
        // }
    //   }
    // });
  } else if (listType === "myfavorites") {
    // GET FAVORITES LIST FOR CURRENT USER
    let response = await fetch("/api/v1/favorite/" + userID);
    if (!response.ok) throw Error(response.statusText);
    let data = await response.json();

    if (data.message && data.message === "This user does not have any favorited albums.") {
      listData = [];
      document.getElementById('main-page-loader').classList.add('hide_me');
      populateList();
    } else {
      listData = {
        user: userID,
        displayName: "You!",
        title: "My Favorites",
        albums: data
      };
      document.getElementById('main-page-loader').classList.add('hide_me');
      populateList();
    }
    // $.ajax({
    //   method: "GET",
    //   url: "/api/v1/favorite/" + userID,
    //   success: function(data) {
        // if (data.message && data.message === "This user does not have any favorited albums.") {
        //   listData = [];
        //   $('#main-page-loader').hide();
        //   populateList();
        // } else {
        //   listData = {
        //     user: userID,
        //     displayName: "You!",
        //     title: "My Favorites",
        //     albums: data
        //   };
        //   $('#main-page-loader').hide();
        //   populateList();
        // }
    //   }
    // });
  } else if (listType === "tagsearch") {
    // GET TAG SEARCH RESULTS
    let databaseTags = [];
    let sellectedTagsHTML = "";
    decodeURIComponent(tagSearch).split(',').forEach(tag => {
      databaseTags.push(escapeHtml(tag)); // the tags we're searching in the database are already stored with escaped-HTML
      sellectedTagsHTML += `<a href="/list?type=tagsearch&search=${encodeURIComponent(tag)}" class="badge badge-light text-secondary mr-1 tagsearch-tag" data-toggle="tooltip" data-placement="top" title="Search for albums with just this tag" data-trigger="hover">${escapeHtml(tag)}</a>`;
    });
    document.getElementById('no-albums-message').innerHTML = "No albums match this combination of tags. Go <a href='/alltags'>back</a> to try another search, or click one of the tags above to search just that tag.";
  
    let response = await fetch("/api/v1/tag/" + databaseTags);
    if (!response.ok) throw Error(response.statusText);
    let data = await response.json();
    if (data.message) {
      data = [];
    } 
    listData = {
      user: userID || null,
      displayName: "All Users",
      // title: `Tags: ${decodeURIComponent(tagSearch).split(',').join(', ')}`, // TAGS AS TEXT
      title: `Tags: ${sellectedTagsHTML}`, // TAGS AS BADGES
      albums: data
    };
    document.getElementById('main-page-loader').classList.add('hide_me');
    populateList();
    // $.ajax({
    //   method: "GET",
    //   url: "/api/v1/tag/" + databaseTags,
    //   success: function(data) {
        // if (data.message) {
        //   data = [];
        // } 
        // listData = {
        //   user: userID || null,
        //   displayName: "All Users",
        //   // title: `Tags: ${decodeURIComponent(tagSearch).split(',').join(', ')}`, // TAGS AS TEXT
        //   title: `Tags: ${sellectedTagsHTML}`, // TAGS AS BADGES
        //   albums: data
        // };
        // $('#main-page-loader').hide();
        // populateList();
    //   }
    // });
  }
}

function showAppliedFilter(filter, filterType) {
  document.getElementById('applied-filters').classList.remove('hide_me');
  // $('#applied-filters').show();
  const cleanFilter = escapeHtml(filter);
  const pageFilter = cleanFilter.length > 24 ? truncate(cleanFilter, 24) : cleanFilter;
  document.getElementById('applied-filters').appendChild(stringToNode(`<span class="badge badge-primary mr-1 applied-filter applied-filter-${filterType}" data-${filterType}="${filter}">${pageFilter}</span>`));
  // $('#applied-filters').append(`<span class="badge badge-primary mr-1 applied-filter applied-filter-${filterType}" data-${filterType}="${filter}">${pageFilter}</span>`);

  addClassEventListener(`applied-filter-${filterType}`, 'click', function() {
    toggleFilter(filterType, this.dataset[filterType]);
  // $(`.applied-filter-${filterType}`).click(function() {
    // toggleFilter(filterType, $(this).data(filterType));
  });
}

function showAlbumCount() {
  const hideCount = sessionStorage.getItem('hideCount');
  if (!hideCount) {
    removeSelectedElement('#result-count');
    // $('#result-count').remove();
    const countText = `(${totalAlbumsOnPage} ${totalAlbumsOnPage > 1 || totalAlbumsOnPage === 0 ? "albums" : "album"})`;
    document.getElementById('applied-filters').appendChild(stringToNode(`<small id="result-count">${countText}</small>`));
    // $('#applied-filters').append(`<small id="result-count">${countText}</small>`);
    document.getElementById('applied-filters').classList.remove('hide_me');
  }

  if (hideCount && document.getElementsByClassName('applied-filter').length < 1) { 
    document.getElementById('applied-filters').classList.add('hide_me');
  }
}

function createCard(cardNumber) {
  document.getElementById('albums').appendChild(stringToNode(`<div id="card${cardNumber}" class="card list-card"><a class="album-details-link" href=""><img class="card-img-top" src=""><a/><div class="card-body"><h4 class="card-title"></h4><span class="album-title"></span></div></div>`));
  // $('#albums').append(`<div id="card${cardNumber}" class="card list-card"><a class="album-details-link" href=""><img class="card-img-top" src=""><a/><div class="card-body"><h4 class="card-title"></h4><span class="album-title"></span></div></div>`);
}

function populateCard(album, cardNumber) {
  let smallArtist = album.artist.length > 32 ? truncate(album.artist, 32) : album.artist;
  let largeArtist = album.artist.length > 49 ? truncate(album.artist, 49) : album.artist;
  let smallAlbum = album.title.length > 44 ? truncate(album.title, 44) : album.title;
  let largeAlbum = album.title.length > 66 ? truncate(album.title, 66): album.title;
  
  // artist name
  document.querySelector(`#card${cardNumber} .card-body h4`).innerHTML = `<span class="large_artist">${largeArtist}</span><span class="small_artist">${smallArtist}</span>`;
  // $(`#card${cardNumber} .card-body h4`).html(`<span class="large_artist">${largeArtist}</span><span class="small_artist">${smallArtist}</span>`);
  // album name
  document.querySelector(`#card${cardNumber} .card-body .album-title`).innerHTML = `<span class="large_album">${largeAlbum}</span><span class="small_album">${smallAlbum}</span>`;
  // $(`#card${cardNumber} .card-body .album-title`).html(`<span class="large_album">${largeAlbum}</span><span class="small_album">${smallAlbum}</span>`); 
  // album cover
  document.querySelector(`#card${cardNumber} .card-img-top`).src = album.cover.replace('{w}', 260).replace('{h}', 260);
  // $(`#card${cardNumber} .card-img-top`).attr('src', album.cover.replace('{w}', 260).replace('{h}', 260));
  // add album-details-link to album cover
  document.querySelector(`#card${cardNumber} .album-details-link`).href = `/album/${album.appleAlbumID}`;
  // $(`#card${cardNumber} .album-details-link`).attr('href', `/album/${album.appleAlbumID}`);
  // remove album from list button
  document.getElementById(`card${cardNumber}`).appendChild(stringToNode(`<span class="album-delete-button" data-album-id="${album.appleAlbumID}" data-toggle="tooltip" data-placement="right" title="Remove from list" data-trigger="hover">&#10005;</span></li>`));
  // $(`#card${cardNumber}`).append(`<span class="album-delete-button" data-album-id="${album.appleAlbumID}" data-toggle="tooltip" data-placement="right" title="Remove from list" data-trigger="hover">&#10005;</span></li>`);

  // sets remove album button visibility
  if (listData.user === userID && (listType === "userlist" || listType === "myfavorites")) {
    showClass('album-delete-button');
    // $('.album-delete-button').show();
  } else {
    hideClass('album-delete-button');
    // $('.album-delete-button').hide();
  }
}

function populateList() {
  const pageInfoButton = document.getElementById('page-info-button');
  if (pageInfoButton) { pageInfoButton.classList.add('hide_me'); }
  // $('#page-info-button').hide();
  document.getElementById('no-albums-message').classList.add('hide_me');
  // $("#no-albums-message").hide();
  document.getElementById('albums').innerHTML = '';
  totalAlbumsOnPage = 0;

  let listCreator = listData.displayName;
  if (!listCreator || listCreator.trim === "") { listCreator = "Unknown"; }
  document.getElementById('list-title').innerHTML = `${listData.title}`;
  document.getElementById('list-title').parentNode.insertBefore(stringToNode('<h5 id="page-info-button" class="text-secondary" data-toggle="modal" data-target="#pageInfoModal">&#9432;</h5>'), document.getElementById('list-title').nextSibling);
  // $('#list-title').after('<h5 id="page-info-button" class="text-secondary" data-toggle="modal" data-target="#pageInfoModal">&#9432;</h5>');
  document.getElementById('page-info-button').addEventListener('click', function() {
    const pageInfoModal = new Modal(document.getElementById('pageInfoModal'));
    pageInfoModal.show();
  });
  if (listType !== "userlist") { 
    document.getElementById('page-info-button').classList.add('hide_me');
    // $('#page-info-button').hide(); 
  }
  document.getElementById('list-creator').innerText = "by: " + listCreator;
  // $('#list-creator').text("by: " + listCreator);

  if (listData.albums && listData.albums.length > 0) {
    let albumArray = filterAlbums();

    if (albumArray.length > 0) {
      document.getElementById('no-albums-message').classList.add('hide_me');
      // $('#no-albums-message').hide();
    } else {
      // if removing an album results in no albums on the page
      // clear all filters and try one more time
      clearFilters(); 
      albumArray = filterAlbums();
      if (albumArray.length > 0) {
        document.getElementById('no-albums-message').classList.add('hide_me');
        document.getElementById('albums').innerHTML = '';
      } else {
        document.getElementById('no-albums-message').classList.remove('hide_me');
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
    addClassEventListener('album-delete-button', 'click', function() {
      if (listData.user !== userID) return alert("Sorry! Only the list creator can delete albums."); 
      
      if (listType === "userlist") {
        removeFromList(this.dataset.albumId); 
        // removeFromList($(this).attr("data-album-id")); 
      } else if (listType === "myfavorites") {
        removeFromFavorites(this.dataset.albumId); 
        // removeFromFavorites($(this).attr("data-album-id")); 
      } else {
        return alert("Sorry! This type of list won't let you delete albums.");
      }
    });
    populateFilters(albumArray);
  } else {
    document.getElementById('no-albums-message').classList.remove('hide_me');
    // $("#no-albums-message").show();
    populateFilters([]);
  }
  displayButtons(); // show user control buttons for this list type
  showAlbumCount();
}

async function removeFromList(albumID) {
  if (listData.user !== userID) { alert("Sorry, only the list creator can delete albums from a list."); return; }
  let thisAlbum = listData.albums.find(x => x.appleAlbumID == albumID);
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
    let response = await fetch("/api/v1/list/" + listID, {
      method: 'put',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deleteObject)
    });
    if (!response.ok) throw Error(response.statusText);
    let data = await response.json();
    removeFromArray(listData.albums, thisAlbum);
    populateList();

    // $.ajax({
    //   method: "PUT",
    //   url: "/api/v1/list/" + listID,
    //   contentType: 'application/json',
    //   data: JSON.stringify(deleteObject),
    //   success: function(data) {
    //     removeFromArray(listData.albums, thisAlbum);
    //     populateList();
    //   }
    // });
  }
}

async function editDisplayName() {
  let newDisplayName = document.getElementById('list-display-name-input').value.trim();

  // pass basic data validation
  if (newDisplayName === listData.displayName) return alert(`The display name for this list is already set as "${listData.displayName}"`);
  if (newDisplayName.length > 30) return alert("Display names must be shorter than 30 characters in length.");

  // start updating list
  let updateObject = {
    method: "change display name",
    displayName: newDisplayName
  };
  let response = await fetch("/api/v1/list/" + listID, {
    method: 'put',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateObject)
  });
  if (!response.ok) throw Error(response.statusText);
  let data = await response.json();

  listData.displayName = data.displayName;
  populateList();
  document.getElementById('list-update-success').innerHTML = "List info updated! &#10003;";
  // $('#list-update-success').html("List info updated! &#10003;");
  setTimeout(function(){ 
    document.getElementById('list-update-success').innerHTML = '&nbsp;';
    // $('#list-update-success').html('&nbsp;'); 
  }, 3000);

  // $.ajax({
  //   method: "PUT",
  //   url: "/api/v1/list/" + listID,
  //   contentType: 'application/json',
  //   data: JSON.stringify(updateObject),
  //   success: function(data) {
  //     listData.displayName = data.displayName;
  //     populateList();
  //     $('#list-update-success').html("List info updated! &#10003;");
  //     setTimeout(function(){ $('#list-update-success').html('&nbsp;'); }, 3000);
  //   }
  // });
}

async function editListTitle() {
  let newListTitle = document.getElementById('list-title-input').value.trim();

  // pass basic data validation
  if (newListTitle === listData.title) return alert(`The title for this list is already "${listData.title}"`);
  if (newListTitle.length > 60) return alert("List titles must be shorter than 60 characters in length.");

  // start updating list
  if (newListTitle && newListTitle.length > 0) {
    let updateObject = {
      method: "change title",
      title: newListTitle
    };

    let response = await fetch("/api/v1/list/" + listID, {
      method: 'put',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateObject)
    });
    if (!response.ok) throw Error(response.statusText);
    let data = await response.json();

    listData.title = data.title;
    populateList();
    document.getElementById('list-update-success').innerHTML = "List info updated! &#10003;";
    // $('#list-update-success').html("List info updated! &#10003;");
    setTimeout(function(){ 
      document.getElementById('list-update-success').innerHTML = '&nbsp;';
      // $('#list-update-success').html('&nbsp;'); 
    }, 3000);

    // $.ajax({
    //   method: "PUT",
    //   url: "/api/v1/list/" + listID,
    //   contentType: 'application/json',
    //   data: JSON.stringify(updateObject),
    //   success: function(data) {
    //       listData.title = data.title;
    //       populateList();
    //       $('#list-update-success').html("List info updated! &#10003;");
    //       setTimeout(function(){ $('#list-update-success').html('&nbsp;'); }, 3000);
    //   }
    // });
  } else {
    alert("A non-blank title is required for every list.");
    document.getElementById('list-title-input').value = listData.title;
    // $('#list-title-input').val(listData.title);
  }
}

let addAlbumResults = [];
function populateAddToListModalResults(data) {
  document.getElementById('add-album-search-results').innerHTML = '';
  // $('#add-album-search-results').html('');
  document.querySelector('#add-album-card-body .new-loader').classList.add('hide_me');
  // $('#add-album-card-body .new-loader').hide(); 
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
    document.getElementById('add-album-search-results').appendChild(stringToNode('<div id="add-search-modal-placeholder">&nbsp;</div>'));
    // $('#add-album-search-results').append('<div id="add-search-modal-placeholder">&nbsp;</div>');
  } else {
    document.getElementById('add-album-search-results').parentNode.insertBefore(stringToNode('<div id="no-results-message" class="text-primary" style="text-align:center;">It looks like no albums matched your search terms. Try a different search!</div>'), document.getElementById('add-album-search-results').nextSibling);
    // $('#add-album-search-results').after('<div id="no-results-message" class="text-primary" style="text-align:center;">It looks like no albums matched your search terms. Try a different search!</div>');
  }
}

// ====== START CREATE AND POPULATE ALBUM CARDS FOR MODALS ======
function addPageModalCard(divName, modalType, cardNumber) {
  document.getElementById(`${divName}`).appendChild(stringToNode(`<div id="${modalType}ModalCard${cardNumber}" class="search-modal-card" data-result-index="${cardNumber - 1}"><img class="search-modal-card-image" src="" alt=""><div class="search-modal-card-body"><h4 class="search-modal-card-title"></h4><span class="search-modal-card-album"></span></div></div>`));
  // $(`#${divName}`).append(`<div id="${modalType}ModalCard${cardNumber}" class="search-modal-card" data-result-index="${cardNumber - 1}"><img class="search-modal-card-image" src="" alt=""><div class="search-modal-card-body"><h4 class="search-modal-card-title"></h4><span class="search-modal-card-album"></span></div></div>`);
}

function populatePageModalCard(modalType, clickMethod, resultsArray, album, cardNumber) {
  let smallArtist = album.artist.length > 32 ? truncate(album.artist, 32) : album.artist;
  let largeArtist = album.artist.length > 49 ? truncate(album.artist, 49) : album.artist;
  let smallAlbum = album.title.length > 44 ? truncate(album.title, 44) : album.title;
  let largeAlbum = album.title.length > 66 ? truncate(album.title, 66): album.title;
  
  // artist name
  document.querySelector(`#${modalType}ModalCard${cardNumber} .search-modal-card-title`).innerHTML = `<span class="search-modal-card-large-artist">${largeArtist}</span><span class="search-modal-card-small-artist">${smallArtist}</span>`;
  // $(`#${modalType}ModalCard${cardNumber} .search-modal-card-title`).html(`<span class="search-modal-card-large-artist">${largeArtist}</span><span class="search-modal-card-small-artist">${smallArtist}</span>`);
  // album name
  document.querySelector(`#${modalType}ModalCard${cardNumber} .search-modal-card-album`).innerHTML = `<span class="search-modal-card-large-album">${largeAlbum}</span><span class="search-modal-card-small-album">${smallAlbum}</span>`;
  // $(`#${modalType}ModalCard${cardNumber} .search-modal-card-album`).html(`<span class="search-modal-card-large-album">${largeAlbum}</span><span class="search-modal-card-small-album">${smallAlbum}</span>`);
  // album cover
  document.querySelector(`#${modalType}ModalCard${cardNumber} .search-modal-card-image`).src = album.cover.replace('{w}', 260).replace('{h}', 260);
  // $(`#${modalType}ModalCard${cardNumber} .search-modal-card-image`).attr('src', album.cover.replace('{w}', 260).replace('{h}', 260));

  document.getElementById(`${modalType}ModalCard${cardNumber}`).addEventListener('click', function() {
    const selectedAlbumIndex = this.dataset.resultIndex;
    // const selectedAlbumIndex = $(this).data("result-index");
    const selectedAlbum = resultsArray[selectedAlbumIndex];
    clickMethod(selectedAlbum);
  });
}
// ====== END CREATE AND POPULATE ALBUM CARDS FOR MODALS ======

async function addToList(selectedAlbum) {
  if (selectedAlbum) {
    const newAlbumID = parseInt(selectedAlbum.appleAlbumID);
    let alreadyInList = listData.albums.find(x => x.appleAlbumID === newAlbumID);
    if (alreadyInList) return alert(`"${selectedAlbum.title}" is already in this list.`);

    let addAlbumToListBody = {
      method: "add album",
      appleAlbumID: selectedAlbum.appleAlbumID,
      title: selectedAlbum.title,
      artist: selectedAlbum.artist,
      releaseDate: selectedAlbum.releaseDate,
      cover: selectedAlbum.cover,
      genres: selectedAlbum.genres,
      appleURL: selectedAlbum.appleURL,
      recordCompany: selectedAlbum.recordCompany
    };

    let response = await fetch("/api/v1/list/" + listData.id, {
      method: 'put',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addAlbumToListBody)
    });
    if (!response.ok) throw Error(response.statusText);
    let data = await response.json();
    listData.albums.push(selectedAlbum);
    const editListModal = new Modal(document.getElementById('editListModal'));
    editListModal.hide();
    // $('#editListModal').modal('hide');
    populateList();

    // $.ajax({
    //   method: "PUT",
    //   url: "/api/v1/list/" + listData.id,
    //   contentType: 'application/json',
    //   data: JSON.stringify(addAlbumToListBody),
    //   success: function(data) {
    //     listData.albums.push(selectedAlbum);
    //     $('#editListModal').modal('hide');
    //     populateList();
    //   }
    // });
  }
}

function toggleActiveInfoTab(element) {
  const activeTab = document.querySelector('#editListModal .active');
  activeTab.classList.remove('active');
  activeTab.classList.add('inactive-list-edit-tab');
  // $('#editListModal .active').removeClass("active").addClass("inactive-list-edit-tab");
  document.getElementById(element).classList.remove('inactive-list-edit-tab');
  document.getElementById(element).classList.add('active');
  // $(element).removeClass("inactive-list-edit-tab").addClass("active");
  hideClass('edit-list-card-body');
  // $('.edit-list-card-body').hide();
  const selectedCard = document.getElementById(element).dataset.card;
  document.getElementById(`${selectedCard}-card-body`).classList.remove('hide_me');
  // $(`#${selectedCard}-card-body`).show();
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
        if (tagObject.creator === listData.user && (isGenre(tagObject.text) || tagObject.customGenre) && album.tagGenres.indexOf(tagObject.text) === -1) {
          album.tagGenres.push(tagObject.text);
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
  removeSelectedElement('.applied-filter'); // clear out previous filters displayed after list creator
  // $('.applied-filter').remove(); // clear out previous filters displayed after list creator
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
  albumArray = albumArray.sort((a, b) => (a.releaseDate > b.releaseDate) ? 1 : -1);
  albumArray = albumArray.reverse(); // reverse shows newer albums first (generally)
  return albumArray;
}

let artistFilterElements;
function populateFilters(albumArray) {
  const filterObject = getFilterObject();
  document.getElementById('year-filter-dropdown').innerHTML = '';
  document.getElementById('artist-filter-dropdown').innerHTML = '';
  document.getElementById('genre-filter-dropdown').innerHTML = '';

  if (albumArray.length < 1) {
    return hideClass('remove-if-no-albums');
    // return $('.remove-if-no-albums').hide();
  } else {
    showClass('remove-if-no-albums');
    // $('.remove-if-no-albums').show();
  }

  // YEAR FILTERS
  let yearFilters = [];
  albumArray.forEach(album => { addToArray(yearFilters, album.releaseDate.slice(0,4)); });
  yearFilters.sort().reverse();
  yearFilters.forEach(year => {
    if (!!filterObject.year && year === filterObject.year) {
      document.getElementById('year-filter-dropdown').appendChild(stringToNode(`<span class="badge badge-primary year-filter" data-year="${year}">${year}</span>`));
      // $('#year-filter-dropdown').append(`<span class="badge badge-primary year-filter" data-year="${year}">${year}</span>`);
    } else {
      document.getElementById('year-filter-dropdown').appendChild(stringToNode(`<span class="badge badge-light year-filter" data-year="${year}">${year}</span>`));
      // $('#year-filter-dropdown').append(`<span class="badge badge-light year-filter" data-year="${year}">${year}</span>`);
    }
  });
  addClassEventListener('year-filter', 'click', function() {
    toggleFilter("year", this.dataset.year);
  });

  // ARTIST FILTERS
  let artistFilters = [];
  albumArray.forEach(album => { addToArray(artistFilters, album.artist); });
  artistFilters.sort();
  artistFilters.forEach(artist => {
    if (!!filterObject.artist && artist === filterObject.artist) {
      document.getElementById('artist-filter-dropdown').appendChild(stringToNode(`<span class="badge badge-primary artist-filter" data-artist="${artist}">${artist.length > 32 ? truncate(artist, 32) : artist}</span>`));
      // $('#artist-filter-dropdown').append(`<span class="badge badge-primary artist-filter" data-artist="${artist}">${artist.length > 32 ? truncate(artist, 32) : artist}</span>`);
    } else {
      document.getElementById('artist-filter-dropdown').appendChild(stringToNode(`<span class="badge badge-light artist-filter" data-artist="${artist}">${artist.length > 32 ? truncate(artist, 32) : artist}</span>`));
      // $('#artist-filter-dropdown').append(`<span class="badge badge-light artist-filter" data-artist="${artist}">${artist.length > 32 ? truncate(artist, 32) : artist}</span>`);
    }
  });
  addClassEventListener('artist-filter', 'click', function() {
    toggleFilter("artist", this.dataset.artist);
  });
  // Add artist-filter input if more than 12 artists
  if (artistFilters.length > 12) {
    document.getElementById('artist-filter-dropdown').prepend(stringToNode('<input id="artist-tag-filter-input" type="search" placeholder="Filter artist tags..." class="form-control"></input>'));
    // $('#artist-filter-dropdown').prepend('<input id="artist-tag-filter-input" type=search placeholder="Filter artist tags..." class="form-control"></input>');
    artistFilterElements = document.getElementsByClassName('artist-filter');
    document.getElementById('artist-tag-filter-input').addEventListener('click', function(event) {
      event.stopPropagation(); // stops touch from bubbling up to boostrap listeners
    });
    document.getElementById('artist-tag-filter-input').addEventListener('input', searchFilter);
    // $("#artist-tag-filter-input").on("input", searchFilter);
  }

  // GENRE FILTERS
  let genreFilters = [];
  albumArray.forEach(album => { if (album.tagGenres) { 
    album.tagGenres.forEach(genre => {
      addToArray(genreFilters, genre);
    });
  }});

  if (genreFilters.length < 1) { 
    document.getElementById('filter-by-genre-button').classList.add('hide_me');
    // $('#filter-by-genre-button').hide(); 
  } else { 
    document.getElementById('filter-by-genre-button').classList.remove('hide_me');
    // $('#filter-by-genre-button').show(); 
  }
  
  genreFilters.sort();
  genreFilters.forEach(genre => {
    if (!!filterObject.genre && genre === filterObject.genre) {
      document.getElementById('genre-filter-dropdown').appendChild(stringToNode(`<span class="badge badge-primary genre-filter" data-genre="${genre}">${genre.length > 32 ? truncate(genre, 32) : genre}</span>`));
      // $('#genre-filter-dropdown').append(`<span class="badge badge-primary genre-filter" data-genre="${genre}">${genre.length > 32 ? truncate(genre, 32) : genre}</span>`);
    } else if (!filterObject.genre) { // don't show any other genre filters if there is a selected genre
      document.getElementById('genre-filter-dropdown').appendChild(stringToNode(`<span class="badge badge-light genre-filter" data-genre="${genre}">${genre.length > 32 ? truncate(genre, 32) : genre}</span>`));
      // $('#genre-filter-dropdown').append(`<span class="badge badge-light genre-filter" data-genre="${genre}">${genre.length > 32 ? truncate(genre, 32) : genre}</span>`);
    }
  });
  addClassEventListener('genre-filter', 'click', function() {
    toggleFilter("genre", this.dataset.genre);
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

document.getElementById('clear-filters-button').addEventListener('click', clearFilters);
// $('#clear-filters-button').click(clearFilters);
// ====== END FILTER FUNCTIONALITY ======

// ====== START MY FAVORITES FUNCTIONALITY ======
let addFavoritesAlbumResults = [];
function populateAddToFavoritesModalResults(data) {
  document.getElementById('favorites-search-results').innerHTML = '';
  // $('#favorites-search-results').html('');
  document.querySelector('#addFavoritesAlbumModal .new-loader').classList.add('hide_me');
  // $('#addFavoritesAlbumModal .new-loader').hide();
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
    document.getElementById('favorites-search-results').appendChild(stringToNode('<div id="add-search-modal-placeholder">&nbsp;</div>'));
    // $('#favorites-search-results').append('<div id="add-search-modal-placeholder">&nbsp;</div>');
  } else {
    document.getElementById('favorites-search-results').parentNode.insertBefore(stringToNode('<div id="no-results-message" class="text-primary mb-3" style="text-align:center;">It looks like no albums matched your search terms. Try a different search!</div>'), document.getElementById('favorites-search-results').nextSibling);
    // $('#favorites-search-results').after('<div id="no-results-message" class="text-primary mb-3" style="text-align:center;">It looks like no albums matched your search terms. Try a different search!</div>');
  }
}

document.getElementById('add-favorites-album-button').addEventListener('click', function () {
  const search = document.getElementById('add-favorites-album-input').value.trim().replace(/[^\w\s]/gi, '');
  removeSelectedElement('#no-results-message');
  // $('#no-results-message').remove();
  document.getElementById('favorites-search-results').innerHTML = '';
  document.querySelector('#addFavoritesAlbumModal .new-loader').classList.remove('hide_me');
  // $('#addFavoritesAlbumModal .new-loader').show();
  executeSearch(search, "add to favorites");
});
document.getElementById('add-favorites-album-input').addEventListener('keyup', function(event) {
  if (event.keyCode === 13) {
    document.getElementById('add-favorites-album-button').click();
  }
});

async function addToFavorites(selectedAlbum) {
  const newAlbumID = parseInt(selectedAlbum.appleAlbumID);
  let alreadyInFavorites = listData.albums.find(x => x.appleAlbumID === newAlbumID);
  if (alreadyInFavorites) return alert(`"${selectedAlbum.title}" is already in your favorites.`);

  if (selectedAlbum && userID) {
    let response = await fetch('/api/v1/favorite', {
      method: 'post',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        "user" : userID,
        "album" : selectedAlbum
      })
    });
    if (!response.ok) throw Error(response.statusText);
    let data = await response.json();

    listData.albums.push(selectedAlbum);
    const addFavoritesAlbumModal = new Modal(document.getElementById('addFavoritesAlbumModal'));
    addFavoritesAlbumModal.hide();
    document.getElementById('add-favorites-album-input').value = '';
    document.getElementById('favorites-search-results').innerHTML = '';
    populateList();

    // $.ajax('/api/v1/favorite', {
    //   method: 'POST',
    //   contentType: 'application/json',
    //   data: JSON.stringify({ 
    //     "user" : userID,
    //     "album" : selectedAlbum
    //   }),
    //   success: function(album) {
    //     listData.albums.push(selectedAlbum);
    //     $('#addFavoritesAlbumModal').modal("hide");
    //     $('#add-favorites-album-input').val('');
    //     $('#favorites-search-results').html('');
    //     populateList();
    //   }
    // });
  }
}

async function removeFromFavorites(selectedAlbum) {
  if (listData.user !== userID) return alert("Sorry, only the list creator can delete albums from a list."); 
  let albumToRemove = listData.albums.find(x => x.appleAlbumID == selectedAlbum);
  let confirmed = confirm(`Are you sure you want to remove "${albumToRemove.title}" from your favorites? You cannot undo this operation.`);

  if (confirmed && albumToRemove) {

    let response = await fetch('/api/v1/favorite', {
      method: 'delete',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        "user" : userID,
        "appleAlbumID" : albumToRemove.appleAlbumID,
        "returnData": "list"
      })
    });
    if (!response.ok) throw Error(response.statusText);
    let data = await response.json();

    if (!data.message || data.message === "Album successfully removed from user favorites.") {
      listData.albums = data;
      populateList();
    } else {
      alert(data.message);
    }
    // $.ajax('/api/v1/favorite', {
    //   method: 'DELETE',
    //   contentType: 'application/json',
    //   data: JSON.stringify({ 
    //     "user" : userID,
    //     "appleAlbumID" : albumToRemove.appleAlbumID,
    //     "returnData": "list"
    //   }),
    //   success: function(response) {
    //     if (!response.message || response.message === "Album successfully removed from user favorites.") {
    //       listData.albums = response;
    //       populateList();
    //     } else {
    //       alert(response.message);
    //     }
    //   }
    // });
  }
}
// ====== END MY FAVORITES FUNCTIONALITY ======

// ====== START EVENT LISTENERS ======
document.getElementById('favorites-display-name-input').addEventListener('keyup', function(event) {
  if (event.keyCode === 13) {
    document.getElementById('get-shareable-link').click();
  }
});
document.getElementById('get-shareable-link').addEventListener('click', async function() {
  let displayName = document.getElementById('favorites-display-name-input').value.trim();

  let response = await fetch(`/api/v1/favorite/virtual/${userID}`, {
    method: 'post',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      "displayName": displayName
    }),
  });
  if (!response.ok) throw Error(response.statusText);
  let data = await response.json();

  const myFavoritesURL = window.location.protocol + "//" + window.location.host + "/list?type=favorites&id=" + data;
  const urlBox = document.getElementById("shareable-url");
  urlBox.value = myFavoritesURL;
  urlBox.select();

  navigator.clipboard.writeText(myFavoritesURL).then(function() {
    // show message if clipboard write succeeded
    document.getElementById('copied-message').classList.remove('hide_me');
    setTimeout(function(){ 
      document.getElementById('copied-message').classList.add('hide_me');
    }, 3000);
  }, function() {
    // clipboard write failed
  });

  // $.ajax(`/api/v1/favorite/virtual/${userID}`, {
  //   method: 'POST',
  //   contentType: 'application/json',
  //   data: JSON.stringify({
  //     "displayName": displayName
  //   }),
  //   success: function (data) {
  //     const myFavoritesURL = window.location.protocol + "//" + window.location.host + "/list?type=favorites&id=" + data;
  //     const urlBox = document.getElementById("shareable-url");
  //     urlBox.value = myFavoritesURL;
  //     urlBox.select();

  //     navigator.clipboard.writeText(myFavoritesURL).then(function() {
  //       // show message if clipboard write succeeded
  //       $('#copied-message').show();
  //       setTimeout(function(){ $('#copied-message').hide(); }, 3000);
  //     }, function() {
  //       // clipboard write failed
  //     });
  //   }
  // });
});

document.getElementById('add-album-modal-button').addEventListener('click', function() {
  const search = document.getElementById('add-album-modal-input').value.trim().replace(/[^\w\s]/gi, '');
  document.getElementById('add-album-search-results').innerHTML = '';
  removeSelectedElement('#no-results-message');
  // $('#no-results-message').remove();
  document.querySelector('#add-album-card-body .new-loader').classList.remove('hide_me');
  // $('#add-album-card-body .new-loader').show();
  executeSearch(search, "add to list");
});
document.getElementById('share-favorites-button').addEventListener('click', function() {
  const shareFavoritesModal = new Modal(document.getElementById('shareFavoritesModal'));
  shareFavoritesModal.show();
});
document.getElementById('add-album-modal-input').addEventListener('keyup', function(event) {
  if (event.keyCode === 13) {
    document.getElementById('add-album-modal-button').click();
  }
});
document.getElementById('edit-button').addEventListener('click', function() {
  if (listData.user !== userID) return alert("Sorry! Only the list creator can edit the information for this list.");

  toggleActiveInfoTab('edit-list-modal-nav-tab');
  const editListModal = new Modal(document.getElementById('editListModal'));
  editListModal.show();
  document.getElementById('list-title-input').value = listData.title;
  // $('#list-title-input').val(listData.title);
  document.getElementById('list-display-name-input').value = listData.displayName || "Unknown";
  // $('#list-display-name-input').val(listData.displayName || "Unknown");
});
document.getElementById('add-album-button').addEventListener('click', function() {
  if (listData.user !== userID) return alert("Sorry! Only the list creator can add albums to this list.");

  if (listType === "userlist") {
    toggleActiveInfoTab('add-album-modal-nav-tab');
    const editListModal = new Modal(document.getElementById('editListModal'));
    editListModal.show();

    document.getElementById('list-title-input').value = listData.title;
    // $('#list-title-input').val(listData.title);
    document.getElementById('list-display-name-input').value = listData.displayName || "Unknown";
    // $('#list-display-name-input').val(listData.displayName || "Unknown");
  } else if (listType === "myfavorites") {
    const addFavoritesAlbumModal = new Modal(document.getElementById('addFavoritesAlbumModal'));
    addFavoritesAlbumModal.show();
  }
});
addClassEventListener('add-album-refrence', 'click', function() {
  const pageInfoModal = new Modal(document.getElementById('pageInfoModal'));
  pageInfoModal.hide();
  document.getElementById('add-album-button').click();
});
addClassEventListener('edit-list-refrence', 'click', function() {
  const pageInfoModal = new Modal(document.getElementById('pageInfoModal'));
  pageInfoModal.hide();
  document.getElementById('edit-button').click();
});
document.getElementById('list-title-input').addEventListener('keyup', function(event) {
  if (event.keyCode === 13) {
    document.getElementById('update-list-title').click();
  }
});
document.getElementById('list-display-name-input').addEventListener('keyup', function(event) {
  if (event.keyCode === 13) {
    document.getElementById('update-list-display-name').click();
  }
});
document.getElementById('update-list-display-name').addEventListener('click', editDisplayName);
document.getElementById('update-list-title').addEventListener('click', editListTitle);
document.getElementById('to-top-button').addEventListener('click', scrollToTop);
// closes filter dropdowns when page is scrolling
document.addEventListener('scroll', function() {
  document.getElementById('year-filter-dropdown').classList.remove('show');
  document.getElementById('genre-filter-dropdown').classList.remove('show');
  document.getElementById('artist-filter-dropdown').classList.remove('show');
});
// $(document).on( 'scroll', function(){
//   $('#year-filter-dropdown').removeClass('show');
//   $('#genre-filter-dropdown').removeClass('show');
//   $('#artist-filter-dropdown').removeClass('show');
// });
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

    document.getElementById('full_menu_login_logout_container').classList.remove('hide_me');
    // $('#full_menu_login_logout_container').show();
    document.getElementById('login_button').classList.add('hide_me');
    // $('#login_button').hide();
    document.getElementById('full_menu_login_button').classList.add('hide_me');
    // $('#full_menu_login_button').hide();
    document.getElementById('logout_button').classList.remove('hide_me');
    // $('#logout_button').show();
    document.getElementById('full_menu_logout_button').classList.remove('hide_me');
    // $('#full_menu_logout_button').show();
    document.getElementById('log_in_message').classList.add('hide_me');
    // $('#log_in_message').hide();
  } else {   
    // no user logged in
    userID = false;

    document.getElementById('full_menu_login_logout_container').classList.remove('hide_me');
    // $('#full_menu_login_logout_container').show();
    document.getElementById('login_button').classList.remove('hide_me');
    // $('#login_button').show();
    document.getElementById('full_menu_login_button').classList.remove('hide_me');
    // $('#full_menu_login_button').show();
    document.getElementById('logout_button').classList.add('hide_me');
    // $('#logout_button').hide();
    document.getElementById('full_menu_logout_button').classList.add('hide_me');
    // $('#full_menu_logout_button').hide();
    document.getElementById('main-page-loader').classList.add('hide_me');
    // $('#main-page-loader').hide();
    if (listType === "myfavorites") { 
      // $('#no-albums-message').hide();
      document.getElementById('no-albums-message').classList.add('hide_me');
      // $('#log_in_message').show(); 
      document.getElementById('log_in_message').classList.remove('hide_me');
      // $('#list-title').text("My Favorites");
      document.getElementById('list-title').innerText = "My Favorites";
      // $('#list-creator').text("You!");
      document.getElementById('list-creator').innerText = "You!";
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

    document.getElementById('full_menu_login_logout_container').classList.remove('hide_me');
    // $('#full_menu_login_logout_container').show();
    document.getElementById('login_button').classList.add('hide_me');
    // $('#login_button').hide();
    document.getElementById('full_menu_login_button').classList.add('hide_me');
    // $('#full_menu_login_button').hide();
    document.getElementById('logout_button').classList.remove('hide_me');
    // $('#logout_button').show();
    document.getElementById('full_menu_logout_button').classList.remove('hide_me');
    // $('#full_menu_logout_button').show();
    document.getElementById('log_in_message').classList.add('hide_me');
    // $('#log_in_message').hide();
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
    const pageInfoButton = document.getElementById('page-info-button');
    if (pageInfoButton) { pageInfoButton.classList.add('hide_me'); }
    // $('#page-info-button').hide();
    hideClass('tag-search-only');
    // $('.tag-search-only').hide();
    document.getElementById('edit-button').classList.add('hide_me');
    // $('#edit-button').hide();
    document.getElementById('add-album-button').classList.add('hide_me');
    // $('#add-album-button').hide();
    hideClass('remove-if-no-albums');
    // $('.remove-if-no-albums').hide();
    document.getElementById('share-favorites-button').classList.add('hide_me');
    // $('#share-favorites-button').hide();
  } else if (listData.user === userID && listType === "userlist") {
    document.getElementById('edit-button').classList.remove('hide_me');
    // $('#edit-button').show(); 
    hideClass('tag-search-only');
    // $('.tag-search-only').hide();
    document.getElementById('add-album-button').classList.remove('hide_me');
    // $('#add-album-button').show();
    document.getElementById('page-info-button').classList.remove('hide_me');
    // $('#page-info-button').show();
  } else if (listData.user === userID && listType === "myfavorites") {
    document.getElementById('page-info-button').classList.remove('hide_me');
    // $('#page-info-button').show();
    hideClass('list-only');
    // $('.list-only').hide();
    hideClass('tag-search-only');
    // $('.tag-search-only').hide();
    document.getElementById('edit-button').classList.add('hide_me');
    // $('#edit-button').hide();
    document.getElementById('add-album-button').classList.remove('hide_me');
    // $('#add-album-button').show();
    document.getElementById('share-favorites-button').classList.remove('hide_me');
    // $('#share-favorites-button').show();
  } else {
    document.getElementById('page-info-button').classList.add('hide_me');
    // $('#page-info-button').hide();
    document.getElementById('edit-button').classList.add('hide_me');
    // $('#edit-button').hide();
    document.getElementById('add-album-button').classList.add('hide_me');
    // $('#add-album-button').hide();
    hideClass('album-delete-button');
    // $('.album-delete-button').hide();
  }

  if (listType === "favorites") {
    document.getElementById('page-info-button').classList.remove('hide_me');
    // $('#page-info-button').show();
    hideClass('list-and-favorites-only');
    // $('.list-and-favorites-only').hide();
    hideClass('tag-search-only');
    // $('.tag-search-only').hide();
    hideClass('list-only');
    // $('.list-only').hide();
  }

  if (listType === "tagsearch") {
    document.getElementById('page-info-button').classList.remove('hide_me');
    // $('#page-info-button').show();
    showClass('tag-search-only');
    // $('.tag-search-only').show();
    hideClass('list-only');
    // $('.list-only').hide();
    hideClass('list-and-favorites-only');
    // $('.list-and-favorites-only').hide();
    if (document.getElementsByClassName('tagsearch-tag').length > 1) {
      // // ------ enable tooltips ------
      // let isTouchDevice = false;
      // if ("ontouchstart" in document.documentElement) { isTouchDevice = true; }
      // if (!isTouchDevice) { $('[data-toggle="tooltip"]').tooltip(); }
      var isTouchDevice = false;
      if ("ontouchstart" in document.documentElement) { isTouchDevice = true; }
      if (!isTouchDevice) { 
        const elementsTooltip = document.querySelectorAll('[title]');
        for (let i = 0; i < elementsTooltip.length; i++){
          new Tooltip(elementsTooltip[i], {
            placement: 'top', //string
            animation: 'hide', // CSS class
            delay: 10, // integer
          });
        }
      }
    }
  }
}

// add event listener to log in and out buttons
document.getElementById('login_button').addEventListener('click', logIn);
// $('#login_button').click(logIn);
document.getElementById('full_menu_login_button').addEventListener('click', logIn);
// $('#full_menu_login_button').click(logIn);
document.getElementById('logout_button').addEventListener('click', logOut);
// $('#logout_button').click(logOut);
document.getElementById('full_menu_logout_button').addEventListener('click', logOut);
// $('#full_menu_logout_button').click(logOut);
addClassEventListener('login_button', 'click', logIn);
// $('.login_button').click(logIn);
// ----- END FIREBASE AUTH SECTION ------


// make hover scrollbar always visible on touchscreens
document.addEventListener('DOMContentLoaded', function() {
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

  const modalTabs = document.querySelectorAll('#editListModal .nav-link');
  for (let i = 0; i < modalTabs.length; i++) {
    modalTabs[i].addEventListener('click', function (event) {
      event.preventDefault();
      toggleActiveInfoTab(this.id);
    });
  }
});

// ====== FILTER DROPDOWNS MANUAL CODE ======