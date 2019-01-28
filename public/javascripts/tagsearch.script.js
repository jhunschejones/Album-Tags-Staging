// ---------- BEGIN UTILITIES ------------
function safeParse(content) {
  // replace characters with html equivalents
  //prevents some basic cross site scripting attacks
  content = content.replace(/\</g, "&lt;").replace(/\>/g, "&gt;").replace(/\//g, "&#47;").replace(/\\/g, "&#92;").replace(/\(/g, "&#40;").replace(/\)/, "&#41;").replace(/\./g, "&#46;").replace(/\[/g, "&#91;").replace(/\]/g, "&#93;").replace(/\{/g, "&#123;").replace(/\}/g, "&#125;").replace(/\=/g, "&#61;")
  return content
}
// ---------------- END UTILITIES ---------------

var selectedTags = $(".heres_the_selected_tags").text().split(",")
var cleanSelectedTags = []

selectedTags.forEach(element => {
  // element = element.trim().replace(/\//g, '_')
  element = element.trim()
  cleanSelectedTags.push(element)
})

function populateTags() {   
  cleanSelectedTags.forEach(tagElement => {
    // go through my tags and put back in the "/"'s
    // tagElement = tagElement.replace(/_/g, "/")
    $('.tags_searched').append(`<span class="badge badge-primary tag">${safeParse(tagElement)}</span>  `)
  }) 
}

function getTagedAlbums() {  
  // this is pulling data from url and checking the database
  $.getJSON ( '/api/v1/album/matchingtags/' + cleanSelectedTags).then(function(allMatchingAlbums) {
    if (!allMatchingAlbums.message) {
      allMatchingAlbums.forEach(matchingAlbum => {
        $.getJSON ( '/api/v1/album/albumid/' + matchingAlbum.appleAlbumID, function(album) {
          $('.album_results').append(`${album.title} <span class="text-secondary font-italic">${album.artist}, ${album.releaseDate.slice(0, 4)}</span> : <a href="/album/${album.appleAlbumID}">Album Details</a> <br>`)
        })
      })
    }
    else {
      $('.album_results').html("<p class='text-danger'>There are no albums that match this combination of tags.</p>")
    }
  })
}

populateTags()
getTagedAlbums()