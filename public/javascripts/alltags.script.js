// ---------- BEGIN UTILITIES ------------
// ======
// To compile with google closure compiler
// instructions: https://developers.google.com/closure/compiler/docs/gettingstarted_app
// terminal command: `java -jar compiler.jar --js alltags.script.js --js_output_file alltags.script.min.js`
// ======
function safeParse(content) {
  // replace characters with html equivalents
  // prevents some basic cross site scripting attacks
  content = content.replace(/\</g, "&lt;").replace(/\>/g, "&gt;").replace(/\//g, "&#47;").replace(/\\/g, "&#92;").replace(/\(/g, "&#40;").replace(/\)/, "&#41;").replace(/\./g, "&#46;").replace(/\[/g, "&#91;").replace(/\]/g, "&#93;").replace(/\{/g, "&#123;").replace(/\}/g, "&#125;").replace(/\=/g, "&#61;")
  return content
}

// replaces back slash with html character
function replaceBackSlashWithHtml(str) {
  return str.replace(/\//g, '&sol;')
}
// ---------------- END UTILITIES ---------------

var allTags = [];

function populateTags() {
  // $.getJSON ( '/api/v1/album', function(albums) {
  //   if (albums) {
  //     $(".all_tags").text('');

  //     // removing duplicates before populating
  //     albums.forEach(albumObject => {
  //       let tags = albumObject.tags;

  //       tags.forEach(tag => {
  //         if (allTags.indexOf(tag) == -1) {
  //           allTags.push(tag);
  //         } 
  //         else {
  //           // duplicate tag
  //         }; 
  //       });            
  //     });
  //     allTags.sort();
    $.getJSON ( '/api/v1/album/tags/all', function(allTags) {      
      $(".all_tags").text('');
      allTags.forEach(tag => {
        // tag = tag.replace(/_/g, "/");
        // creating a unique tag for each element, solving the problem of number tags not allowed
        // by adding some letters to the start of any tag that can be converted to a number
        // then using a regular expression to remove all spaces in each tag
        if (parseInt(tag)) {
          var addLetters = "tag_";
          var tagName = addLetters.concat(tag).replace(/[^A-Z0-9]+/ig,'');
        } else {                  
          var tagName = tag.replace(/[^A-Z0-9]+/ig,'');
        }

        // Here we add the tags as elements on the DOM, with an onclick function that uses a unique
        // tag to toggle a badge-success class name and change the color
        $('.all_tags').append(`<a href="" onclick="changeClass(${tagName}, event)" id="${tagName}" class="badge badge-light tag">${safeParse(tag)}</a>`);    
      });
    // };
  });
};

// this function is avaiable onclick for all the tags it will toggle
// between two boostrap classes to change the color of selected tags
// it takes in the unique tag ID assigned to eatch badge durring
// creation so that only the desired badge toggles colors
function changeClass(tagName, event) {
  if (event) { event.preventDefault(); }
  // clear warning label
  $('.warning_label').text('');
  var thisTag = document.getElementById(tagName.id);
  thisTag.classList.toggle("badge-primary");
  thisTag.classList.toggle("selected_tag");
  thisTag.classList.toggle("badge-light");
  // addToTagArray(replaceBackSlashWithHtml(thisTag.innerHTML));
  addToTagArray(thisTag.innerHTML);
};

// this function creates an array and adds or removes tags as the
// applicable tag badges are clicked
var selectedTags = [];
function addToTagArray(tag) {
  // tag = tag.replace(/\//g, '_');
  // this conditional returns -1 value if tag is not in array
  if ($.inArray(tag, selectedTags) === -1) {
    selectedTags.push(tag);
  } else {
    // cant use pop because it removes last item only
    // this finds the item being clicked and uses that
    // index with splice() to remove 1 item only
    let index = selectedTags.indexOf(tag)
    selectedTags.splice(index, 1);
  };
};

function clearTagArray(event) {
  if (event) { event.preventDefault(); }
  if ($( ".selected_tag" ).length > 0) {
    $( ".selected_tag" ).toggleClass( "badge-primary" );
    $( ".selected_tag" ).toggleClass( "badge-light" );
    $( ".selected_tag" ).toggleClass( "selected_tag" );
    selectedTags = [];
  }
  else {
    $('.warning_label').text('');
    // $('.warning_label').text('No tags have been selected.');
  }
};

// called by the search by selected tags button
function tagSearch(event) {
  if (event) { event.preventDefault(); }

  if (selectedTags.length > 0) {
    // var win = window.location = (`/search/tags/${selectedTags}`);
    let listURL = new URL(document.location);
    listURL.pathname = "/list";
    listURL.searchParams.set("type", "tagsearch");
    listURL.searchParams.set("search", selectedTags);
    window.location = (listURL.href);
  }  else {
    $('.warning_label').text('');
    $('.warning_label').text('Select one or more tags to preform a tag-search.');
  }
};

populateTags();
