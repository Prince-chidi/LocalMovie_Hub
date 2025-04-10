const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
//const ffmpeg = require('fluent-ffmpeg');
//const ffmpegStatic = require('ffmpeg-static');
const app = express();
const PORT = 1000;
var  extension = '';
var fileName;
var movieextension;
var coverextension;
// Set ffmpeg path
//ffmpeg.setFfmpegPath(ffmpegStatic);

// Middleware to parse JSON
app.use(express.json());
app.use(express.static('public'));

// Storage for Multer - Saving files to video_files/ folder
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const movieId = req.movieId;
    const dir = `./public/video_files/${movieId}`;
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
     extension = path.extname(file.originalname);
     if (file.fieldname === 'video') {
      movieextension = path.extname(file.originalname);
     
      
     } 

     if (file.fieldname !== 'video') {
      coverextension = path.extname(file.originalname);
      
     }

     fileName = file.fieldname === 'video' ? `movie${extension}` : `cover${extension}`;
    cb(null, fileName); // movie.mp4 or cover.png
    
  }
});

const upload = multer({ storage });

// Helper function to generate unique ID
const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

// Upload route
app.post('/upload', (req, res, next) => {
  const movieId = generateId();
  req.movieId = movieId; // Attach movieId to request
  next();
}, upload.fields([{ name: 'video', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), (req, res) => {
  const { title, publisher, about, type } = req.body;
  const movieId = req.movieId;

  // Path to the video file
  const videoPath = `./public/video_files/${movieId}/movie.mp4`;

  // Metadata for movie JSON
  const movieMetadata = {
    id: movieId,
    name: title,
    publisher: publisher,
    about: about || 'No description provided',
    type: type, // either "foreign" or "naija"
    cover: `./video_files/${movieId}/cover${coverextension}`, // Cover will be generated
    file: `./video_files/${movieId}/movie${movieextension}`,
    createdAt: Date.now() // timestamp to track movie age
  };

  // Check if the cover image was provided, if not, extract it from the video
  if (!req.files.cover) {
    extractMovieCover(videoPath, movieId, () => {
      movieMetadata.cover = `/public/video_files/${movieId}/cover.png`;
      saveMovieMetadata(movieMetadata, res);
    });
  } else {
    saveMovieMetadata(movieMetadata, res);
  }
});

// Function to extract movie cover using ffmpeg
const extractMovieCover = (videoPath, movieId, callback) => {
  const coverPath = `./public/video_files/${movieId}/cover.png`;
  ffmpeg(videoPath)
    .screenshots({
      timestamps: ['50%'], // Extract at the middle of the movie
      filename: 'cover.png',
      folder: `./db/video_files/${movieId}/`,
      size: '320x240'
    })
    .on('end', () => {
      console.log(`Cover image extracted to ${coverPath}`);
      callback();
    })
    .on('error', (err) => {
      console.error('Error extracting cover image:', err);
      callback();
    });
};

// Save movie metadata as JSON
const saveMovieMetadata = (metadata, res) => {
    const jsonPath = `./db/movie_data/${metadata.id}.json`;
    const movieDataDir = path.dirname(jsonPath); // Get the directory part of the path
  
    // Create the directory if it doesn't exist
    if (!fs.existsSync(movieDataDir)) {
      fs.mkdirSync(movieDataDir, { recursive: true });
    }
  
    // Write the JSON file
    fs.writeFileSync(jsonPath, JSON.stringify(metadata, null, 2));
  
    // Send success response
    res.status(200).json({ message: 'Movie uploaded successfully', movieId: metadata.id });
  };
  

// Fetch all movies
app.get('/all_movies', (req, res) => {
  const movieDataDir = './db/movie_data/';
  const allMovies = [];

  // Read all JSON files in movie_data directory
  fs.readdir(movieDataDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Could not read movie data' });
    }

    files.forEach(file => {
      const filePath = path.join(movieDataDir, file);
      const movieData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Calculate remaining time (2 days = 172800000 ms)
      const timeDiff = Date.now() - movieData.createdAt;
      const hoursLeft = Math.floor((172800000 - timeDiff) / 3600000);

      if (hoursLeft > 0) {
        movieData.hoursLeft = hoursLeft; // Add hours left to the data
        allMovies.push(movieData);
      } else {
        // If time expired, delete the movie (we'll handle this later)
        deleteMovie(movieData.id);
      }
    });

    res.status(200).json(allMovies);
  });
});

// Helper function to delete movie
const deleteMovie = (movieId) => {
  const videoDir = `./public/video_files/${movieId}`;
  const movieJson = `./db/movie_data/${movieId}.json`;

  // Delete the video and cover files
  fs.rmdirSync(videoDir, { recursive: true });

  // Delete the JSON file
  fs.unlinkSync(movieJson);
};

// Fetch foreign movies
app.get('/typeforeign', (req, res) => {
  filterMoviesByType('foreign', res);
});

// Fetch Naija movies
app.get('/typenaija', (req, res) => {
  filterMoviesByType('naija', res);
});

// Helper function to filter movies by type (foreign/naija)
const filterMoviesByType = (type, res) => {
  const movieDataDir = './db/movie_data/';
  const filteredMovies = [];

  fs.readdir(movieDataDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Could not read movie data' });
    }

    files.forEach(file => {
      const movieData = JSON.parse(fs.readFileSync(path.join(movieDataDir, file), 'utf8'));
      if (movieData.type === type) {
        const timeDiff = Date.now() - movieData.createdAt;
        const hoursLeft = Math.floor((172800000 - timeDiff) / 3600000);

      if (hoursLeft > 0) {
        movieData.hoursLeft = hoursLeft; // Add hours left to the data
        filteredMovies.push(movieData);
      } else {
        // If time expired, delete the movie (we'll handle this later)
        deleteMovie(movieData.id);
      }
       
      }
    });

    res.status(200).json(filteredMovies);
  });
};

// Static routes for HTML files
app.get('/naija', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'naijamovies.html'));
});

app.get('/foreign', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'foriegnmovies.html'));
});

app.get('/upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'upload.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
