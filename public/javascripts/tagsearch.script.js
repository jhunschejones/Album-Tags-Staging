// ---------- BEGIN UTILITIES ------------
// console.log("The custom script for the tag search page is running");

function safeParse(content) {
    // console.log("safeParse called")
    // replace characters with html equivalents
    //prevents some basic cross site scripting attacks
    content = content.replace(/\</g, "&lt;").replace(/\>/g, "&gt;").replace(/\//g, "&#47;").replace(/\\/g, "&#92;").replace(/\(/g, "&#40;").replace(/\)/, "&#41;").replace(/\./g, "&#46;").replace(/\[/g, "&#91;").replace(/\]/g, "&#93;").replace(/\{/g, "&#123;").replace(/\}/g, "&#125;").replace(/\=/g, "&#61;")
    return content
}

// ---------------- END UTILITIES ---------------

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
        $('.tags_searched').append(`<span class="badge badge-primary">${safeParse(tagElement)}</span>  `);
    }); 
}

function getTagedAlbums() {
    
    // this is pulling data from url and checking the database
    $.getJSON ( '/api/v1/tags/selection/' + cleanSelectedTags).then(function(rawData) {
        
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
        $.getJSON ( '/api/v1/apple/albumdetails/' + element, function(rawData) {
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

function populateSearchedTags() {
    populateTags();
}
        
// commented this call out because it is already being called by the userauth script
// and running it here was causing tags_searched to be populated twice 
// populateTags();
getTagedAlbums()
