console.log("The custom script for the alltags page is running")
var allTags = [];

function populateTags() {
    $.getJSON ( '/alltags/newtags/database/', function(rawData) {
        if (typeof(rawData[0]) != "undefined") {
            // clear default no-tags notice if tags exist
            $(".all_tags").text('');
            // $(".tag_search_button").html('<a href="" onclick="tagSearch()" class="btn btn-sm btn-outline-primary tag_search_button">Search by Selected Tags</a>');

            // removing duplicates before populating
            rawData.forEach(element => {
                let tags = element.tags;

                tags.forEach(element => {
                    if (allTags.indexOf(element) == -1) {
                        allTags.push(element);
                    } 
                    else {
                        // duplicate
                    }; 
                });            
            });

            
            allTags.sort();
            // populating page from array without duplicates
            
            allTags.forEach(element => {

                element = element.replace(/_/g, "/");
                // creating a unique tag for each element, solving the problem of number tags not allowed
                // by adding some letters to the start of any tag that can be converted to a number
                // then using a regular expression to remove all spaces in each tag
                if (parseInt(element)) {
                    var addLetters = "tag_";
                    var tagName = addLetters.concat(element).replace(/[^A-Z0-9]+/ig,'');
                } else {                  
                    var tagName = element.replace(/[^A-Z0-9]+/ig,'');
                }

                // Here we add the tags as elements on the DOM, with an onclick function that uses a unique
                // tag to toggle a badge-success class name and change the color
                $('.all_tags').append(`<a href="" onclick="changeClass(${tagName})" id="${tagName}" class="badge badge-light">${element}</a>  `);    
            });
        };
    });
};

// this function is avaiable onclick for all the tags it will toggle
// between two boostrap classes to change the color of selected tags
// it takes in the unique tag ID assigned to eatch badge durring
// creation so that only the desired badge toggles colors
function changeClass(tagName) {
    event.preventDefault();
    // clear warning label
    $('.warning_label').text('');
    var thisTag = document.getElementById(tagName.id);
    thisTag.classList.toggle("badge-primary");
    thisTag.classList.toggle("selected_tag");
    thisTag.classList.toggle("badge-light");
    // see below
    addToTagArray(thisTag.innerHTML);
};

// this function creates an array and adds or removes tags as the
// applicable tag badges are clicked
var selectedTags = [];
function addToTagArray(tag) {
    tag = tag.replace(/\//g, '_');
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

function clearTagArray() {
    
    event.preventDefault();
    if ($( ".selected_tag" ).length > 0) {
        $( ".selected_tag" ).toggleClass( "badge-primary" );
        $( ".selected_tag" ).toggleClass( "badge-light" );
        $( ".selected_tag" ).toggleClass( "selected_tag" );

        selectedTags = [];
    }
    else {
        $('.warning_label').text('');
        $('.warning_label').text('No tags have been selected.');
    }
};

// called by the search by selected tags button
function tagSearch() {
    event.preventDefault();

    if (selectedTags.length > 0) {
        var win = window.location = (`/search/tags/${selectedTags}`);
    }  else {
        $('.warning_label').text('');
        $('.warning_label').text('Select one or more tags to preform a tag-search.');
    }
};

populateTags();
