// Function to fetch and display all movies
async function fetchAllMovies() {
    try {
        const response = await fetch('/all_movies');
        const movies = await response.json();
        displayMovies(movies);
    } catch (error) {
        console.error('Error fetching movies:', error);
    }
}

// Function to fetch and display movies by type
async function fetchMoviesByType(type) {
    try {
        const response = await fetch(`/${type}`);
        const movies = await response.json();
        displayMovies(movies);
       
    } catch (error) {
       
    }
}

// Function to dynamically display the movies on the page
function displayMovies(movies) {
    const movieContainer = document.querySelector('main');
    movieContainer.innerHTML = ''; // Clear previous movies

    movies.forEach(movie => {
        // Create a div to hold the movie block
        const movieBlock = document.createElement('div');
        movieBlock.classList.add('container-movies');

        // Movie banner
        const movieBanner = document.createElement('div');
        movieBanner.classList.add('movie-banner');
        movieBanner.style.backgroundImage = `url(${movie.cover})`;

        // Movie attributes
        const movieAttributes = document.createElement('div');
        movieAttributes.classList.add('movie-atributes');

        // Title
        const title = document.createElement('p');
        title.classList.add('movie-title', 'atributes');
        title.style.fontSize = '20px';
        title.innerText = movie.name;

        // Uploaded by
        const uploadedBy = document.createElement('p');
        uploadedBy.classList.add('movie-title', 'atributes');
        uploadedBy.style.color = '#15aa4e';
        uploadedBy.innerText = `Uploaded by ${movie.publisher}`;

        // Time left (remaining time until movie is deleted)
        const timeLeft = document.createElement('p');
        timeLeft.classList.add('remainingdays');
        timeLeft.innerText = `${movie.hoursLeft} hours left`;

        // Download button
        const downloadBtn = document.createElement('div');
        downloadBtn.classList.add('downloadbtn');
        downloadBtn.innerText = 'Download';
        downloadBtn.addEventListener('click', () => downloadMovie(movie.file, movie.name));

        // About movie
        const aboutMovie = document.createElement('p');
        aboutMovie.classList.add('aboutmovie');
        aboutMovie.addEventListener('click', () => {
            alert(movie.about);
        });
        aboutMovie.innerText = 'about';

        // Append all elements to the movie attributes div
        movieAttributes.appendChild(title);
        movieAttributes.appendChild(uploadedBy);
        movieAttributes.appendChild(timeLeft);
        movieAttributes.appendChild(downloadBtn);
        movieAttributes.appendChild(aboutMovie);

        // Append banner and attributes to the movie block
        movieBlock.appendChild(movieBanner);
        movieBlock.appendChild(movieAttributes);

        // Append the movie block to the main container
        movieContainer.appendChild(movieBlock);
    });
}

// Function to download the movie when the download button is clicked
function downloadMovie(fileUrl, filename) {
    console.log(fileUrl);
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = filename; 
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a); // Clean up the DOM after download
}

// Call the correct function based on the page type
document.addEventListener('DOMContentLoaded', function () {
    const pageType = document.body.getAttribute('data-page-type'); 

    if (pageType === 'home') {
        fetchAllMovies();
    } else if (pageType === 'foreign') {
        fetchMoviesByType('typeforeign');
    } else if (pageType === 'naija') {
        fetchMoviesByType('typenaija');
    }
});
