// console.log("The custom script for the about page is running");


// ------------- start tooltips section -----------
var isTouchDevice = false

$(function () {
    setTimeout(function(){ 
        if ("ontouchstart" in document.documentElement) {
            isTouchDevice = true
        }
        
        if(isTouchDevice == false) {
            $('[data-toggle="tooltip"]').tooltip()
        }
    }, 1000);
})
// combine with data-trigger="hover" in html element 
// for desired behavior
// -------------- end tooltips section --------------
