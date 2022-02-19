var idx = null;         // Lunr index
var resultDetails = []; // Will hold the data for the search results (titles and summaries)
var $searchResults;     // The element on the page holding search results
var $searchInput;       // The search box element

window.onload = function () {
// Set up for an Ajax call to request the JSON data file that is created by
// Hugo's build process, with the template we added above
var request = new XMLHttpRequest();
var query = '';

    // Get dom objects for the elements we'll be interacting with
    $searchResults = document.getElementById('search-results');
    $searchInput = document.getElementById('search-input');

    request.overrideMimeType("application/json");
    request.open("GET", "/index.json", true); // Request the JSON file created during build
    request.onload = function () {
        if (request.status >= 200 && request.status < 400) {
            // Success response received in requesting the index.json file
            var documents = JSON.parse(request.responseText);

            // Build the index so Lunr can search it.  The `ref` field will hold the URL
            // to the page/post.  title, excerpt, and body will be fields searched.
            idx = lunr(function () {
                this.ref('title');
                this.field('description');
                this.field('href');

                // Loop through all the items in the JSON file and add them to the index
                // so they can be searched.
                documents.forEach(function (doc) {
                    this.add(doc);
                    resultDetails[doc.title] = {
                        'href': doc.href,
                        'description': doc.description,
                    };
                }, this);
            });
        } else {
            $searchResults.innerHTML = 'Error loading search results';
        }
    };

    request.onerror = function () {
        $searchResults.innerHTML = 'Error loading search results';
    };

    // Send the request to load the JSON
    request.send();

    // Register handler for the search input field
    registerSearchHandler();
};

function registerSearchHandler() {
$searchInput.oninput = function (event) {
var query = event.target.value;
var results = search(query);  // Perform the search

        // Render search results
        renderSearchResults(results);

        // Remove search results if the user empties the search phrase input field
        if ($searchInput.value == '') {
            $searchResults.innerHTML = '';
        }
    }
}

function renderSearchResults(results) {
// Create a list of results
var ul = document.createElement('ul');
if (results.length > 0) {
results.forEach(function (result) {
// Create result item
var p = document.createElement('p');
p.innerHTML = '<a style="color:#486b3d;font-weight: bolder;font-size: larger;" href="' + resultDetails[result.ref].href + '">' + result.ref + '</a><br>' +
'<span style="font-weight: lighter;font-size: large;padding-bottom: 1em;">' + resultDetails[result.ref].description + '</span>';
ul.appendChild(p);
});

        // Remove any existing content so results aren't continually added as the user types
        while ($searchResults.hasChildNodes()) {
            $searchResults.removeChild(
                $searchResults.lastChild
            );
        }
    } else {
        $searchResults.innerHTML = 'No results found';
    }

    // Render the list
    $searchResults.appendChild(ul);
}

function search(query) {
return idx.search(query);
}