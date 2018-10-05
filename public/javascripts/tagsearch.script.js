console.log("The custom script for the tag search page is running");


var selectedTags = $(".heres_the_selected_tags").text().split(",");
var cleanSelectedTags = [];
var matchingAlbums = [];

selectedTags.forEach(element => {
    element = element.trim().replace(/\//g, '_');
    cleanSelectedTags.push(element);
});

function populateTags() {
   
    cleanSelectedTags.forEach(tagElement => {
        // go through my tags and put back in the "/"'s
        tagElement = tagElement.replace(/_/g, "/")
        $('.tags_searched').append(`<span class="badge badge-primary">${tagElement}</span>  `);
    }); 
}

function getTagedAlbums() {
    
    // this is pulling data from url and checking the database
    $.getJSON ( '/search/tags/newtags/database/' + cleanSelectedTags).then(function(rawData) {
        
        if (typeof(rawData[0]) != "undefined") {

            rawData.forEach(element => {
                matchingAlbums.push(element.albumId);    
            })
        }
        else {
            $('.album_results').html("<p class='text-danger'>There are no albums that match this combination of tags.</p>");
        }
        getAlbumsInfo()
    });
}

function getAlbumsInfo() {

    matchingAlbums.forEach(element => {
        $.getJSON ( '/albumdetails/json/' + element, function(rawData) {
            displayAlbum(rawData.data[0].attributes, element);
        });
    });
}

function displayAlbum(thisAlbum, albumId) {

    let artist = thisAlbum.artistName;
    let album = thisAlbum.name;
    let release = thisAlbum.copyright.slice(2, 6);
    
    $('.album_results').append(`${album} <span class="text-secondary font-italic">${artist}, ${release}</span> : <a href="/albumdetails/${albumId}">Album Details</a> <br>`);
}
        
// commented this call out because it is already being called by the userauth script
// and running it here was causing tags_searched to be populated twice 
// populateTags();
getTagedAlbums()
