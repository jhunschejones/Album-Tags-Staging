// -------- START UTILITIES ---------
// console.log("The custom script for the search page is running");

function hideDOMelement(elementId) {
  try {
    let element = document.getElementById(elementId)
    element.style.display = "none";
  } catch (error) {
    // this element does not exist yere
  }
}

function showDOMelement(elementId) {
  try {
    let element = document.getElementById(elementId)
    element.style.display = "block";
  } catch (error) {
    // this element does not exist yere
  }
}
// ----------- END UTILITIES -----------

var albums = [];
var artists = [];
var pageReloaded = false;
var emptyArtists = false;
var emptyAlbums = false;

// populate search results
function populateSearchResults(pageReloaded, artist) {    
  showDOMelement("loader");
  hideDOMelement("results_returned");
  // hideDOMelement("artists_label");
  // hideDOMelement("albums_label");
  // hideDOMelement("artist_results");
  // hideDOMelement("album_results");
  
  // stop button from reloading page
  if (pageReloaded == false) {
    try {
      event.preventDefault();
    } catch (error) {
      // nothing was clicked to get here
    }
  }
  // get the value of the search box  
  var mySearch = $('#search_box').val().trim();

  if (mySearch == '' & artist != undefined) {
    mySearch = artist
  }

  // reset the results spans
  $('.artist_results').html('');
  $('.album_results').html('');
  $('#warning_label').html('');
  hideDOMelement("warning_label");

  // main functionality is wrapped in some basic error handling
  // dealing with blank results catagories
  if (mySearch && mySearch != '') {
    $('#warning_label').html('');
    hideDOMelement("warning_label");
    // const cleanSearch = mySearch.replace(/'/g, "").replace(/\s/g, '%20').replace(/\&/g, '%26').replace(/\,/g, '%2C')
    const cleanSearch = mySearch.replace(/[^\w\s]/gi, '')

    // this is pulling data from url and populating cards
    $.ajax(`/api/v1/apple/search/${cleanSearch}`, {
      method: 'GET',
      success: function(rawData) {
        // console.log(`/api/v1/apple/search/${cleanSearch}`)
        if (rawData.artists) {  
          // this stores an array
          artists = rawData.artists;
          emptyArtists = false;              
          populateArtistResults();
        } else {
          emptyArtists = true;
          hideDOMelement("artists_label");
          showDOMelement("warning_label");
          $('#warning_label').append('<p style="margin:0px;">No artists match this search</p>');
        }

        if (rawData.albums) {
          // this stores an array
          albums = rawData.albums;
          emptyAlbums = false;
          populateAlbumResults();
        } else {
          emptyAlbums = true;
          hideDOMelement("albums_label");
          showDOMelement("warning_label");
          $('#warning_label').append('<p style="margin:0px;">No albums match this search</p>');
        }

        hideDOMelement("loader");
        if (emptyAlbums == true && emptyArtists == true) {
          hideDOMelement("results_returned");
        } else {
          showDOMelement("results_returned");
        }
      },
      error: function(err) {
        alert(`ERROR : ${JSON.stringify(err)}, URL : '/api/v1/apple/search/${cleanSearch}'`)
      }
    })
  } else {
    showDOMelement("warning_label");
    $('#warning_label').append('<p>Enter an album or band name to search.</p>');
    hideDOMelement("loader");
    hideDOMelement("results_returned");
  }
};

function populateArtistResults() {
  $('.artist_results').html('');

  try {
    // add the label if there are artists
    $('.artists_label').text("Artists:")
    // iterate over artist results array
    for (let index = 0; index < 5; index++) {
      $('.artist_results').append(`<p class="result">${artists[index].name} : <span class="text-secondary">${artists[index].genres[0]} </span> <a href="" data-name='${artists[index].name}' data-apple-artist-id='${artists[index].appleArtistID}' class="morealbumslink"><img id="albums_arrow" src="/images/down_arrow.png"></a> <span id="i${artists[index].appleArtistID}"></span></p>`);
    }
    $('.artist_results').append(`<button class="btn btn-outline-primary btn-sm btn_xsm" onClick="expandArtistResults(event)">More Artists</button> <br>`); 
  } catch(err) {
    // console.log("There are less than 5 albums for one of these artists");
  }
  showDOMelement("artists_label");
  showDOMelement("artist_results");
}

function populateAlbumResults() {
  $('.album_results').html('');

  try {
    // add the label if there are albums
    $('.albums_label').text("Albums:")                
    // iterate over album results array
    
    for (let index = 0; index < 5; index++) {
      $('.album_results').append(`<p class="result"><a href="/albumdetails/${albums[index].appleAlbumID}">${albums[index].title}</a> : <span class="text-secondary">${albums[index].artist} (${albums[index].releaseDate.slice(0, 4)})</span></p>`);  
    };
    $('.album_results').append(`<button class="btn btn-outline-primary btn-sm btn_xsm" onClick="expandAlbumResults(event)">More Albums</button> <br>`);    
  } catch(err) {
    // console.log("There are less than 5 albums");
  }
  showDOMelement("albums_label");
  showDOMelement("album_results");
}

function expandArtistResults(event) {

  event.preventDefault();
  $('.artist_results').html('');

  // iterate over artist results array
  artists.forEach(element => {
    $('.artist_results').append(`<p class="result">${element.name} : <span class="text-secondary">${element.genres[0]} </span> <a href="" data-name='${element.name}' data-apple-artist-id='${element.appleArtistID}' class="morealbumslink"><img id="albums_arrow" src="/images/down_arrow.png"></a> <span id="i${element.appleArtistID}"></span></p>`);
  });
  $('.artist_results').append(`<button class="btn btn-outline-primary btn-sm btn_xsm" onClick="populateArtistResults()">Less Artists</button> <br>`);   
};


function expandAlbumResults(event) {

  event.preventDefault();
  $('.album_results').html('');
           
  // iterate over album results array
  albums.forEach(element => {
    $('.album_results').append(`<p class="result"><a href="/albumdetails/${element.appleAlbumID}">${element.title}</a> : <span class="text-secondary">${element.artist} (${element.releaseDate.slice(0, 4)})</span></p>`);
  });   
  $('.album_results').append(`<button class="btn btn-outline-primary btn-sm btn_xsm" onClick="populateAlbumResults()">Less Albums</button> <br>`);         
};



function showArtistAlbums(event) {

  event.preventDefault();
  showDOMelement("loader");

  var thisArtistName = $(this).attr('data-name'); 
  var thisArtistId = $(this).attr('data-apple-artist-id');

  $.getJSON ( '/api/v1/apple/search/' + thisArtistName, function(rawData) {

    if (rawData.albums) {
      try {
        // this stores an array
        var thisArtistAlbums = rawData.albums;
        $(`#i${thisArtistId}`).html('');
            
        // iterate over album results array
        for (let index = 0; index < 5; index++) {                  
          $(`#i${thisArtistId}`).append(`<li><a href="/albumdetails/${thisArtistAlbums[index].appleAlbumID}">${thisArtistAlbums[index].title}</a> <span class="text-secondary">(${thisArtistAlbums[index].releaseDate.slice(0, 4)})</span></li>`);  
        }
        hideDOMelement("loader");
      } catch(err) {
        // less than 5 albums for this artist
        hideDOMelement("loader");
      }
    }
  })
};


$('.artist_results').on('click', 'a.morealbumslink', showArtistAlbums);


// this happy little function reloads the search when someone gets to the page
// by using the back button from a different page
$( document ).ready(function() {
  if ($('#search_box').val() !== '') {
    pageReloaded = true;
    populateSearchResults(pageReloaded);

    // if we don't reset pageReloaded to false here, user can't search a new string
    pageReloaded = false;
  }
  else {
    var moreByThisArtist = sessionStorage.getItem('artist');

    if (moreByThisArtist != undefined) {
      populateSearchResults(pageReloaded, moreByThisArtist);
      sessionStorage.removeItem('artist');
    } else {
      // no artist searched or loaded in sessionStorage
    }
  }
})

// trigger search click on enter in input field
let searchInput = document.getElementById("search_box")
searchInput.addEventListener("keyup", function(event) {
  event.preventDefault()
  if (event.keyCode === 13) {
    document.getElementById("search_button").click()
  }
})
