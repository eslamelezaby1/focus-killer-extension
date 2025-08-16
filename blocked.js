// Add some interactive elements
document.addEventListener('DOMContentLoaded', function() {
  const container = document.querySelector('.container');
  
  // Add subtle hover effect
  container.addEventListener('mouseenter', function() {
    this.style.transform = 'scale(1.02)';
    this.style.transition = 'transform 0.3s ease';
  });
  
  container.addEventListener('mouseleave', function() {
    this.style.transform = 'scale(1)';
  });

  // Video functionality with autoplay attempt
  const video = document.querySelector('.video-container video');
  const playButton = document.querySelector('.play-button');
  
  if (video && playButton) {
    // List of available videos
    const videoList = [
      'videos/video1.mp4',
      'videos/video2.mp4'
    ];
    
    // Randomly select a video
    const randomVideo = videoList[Math.floor(Math.random() * videoList.length)];
    video.src = randomVideo;
    
    // Try to enable autoplay with sound
    video.muted = false;
    video.volume = 1.0;
    
    // Attempt autoplay with sound
    const playPromise = video.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        // Autoplay succeeded, hide the play button
        playButton.classList.add('hidden');
        console.log('Video autoplay with sound succeeded');
      }).catch((error) => {
        // Autoplay failed, show play button and handle user interaction
        console.log('Autoplay failed, showing play button:', error);
        playButton.classList.remove('hidden');
        
        // Handle play button click
        playButton.addEventListener('click', function() {
          video.play().then(() => {
            playButton.classList.add('hidden');
            console.log('Video started with user interaction');
          }).catch((playError) => {
            console.log('Video play failed:', playError);
          });
        });
      });
    }
  }

  // Update motivational quotes periodically
  const quotes = [
    "The difference between successful people and very successful people is that very successful people say 'no' to almost everything. - Warren Buffett",
    "Focus is not about saying yes to the things you've got to focus on, but about saying no to the hundred other good ideas. - Steve Jobs",
    "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
    "The future depends on what you do today. - Mahatma Gandhi",
    "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
    "The key to success is to focus on goals, not obstacles. - Unknown",
    "Productivity is never an accident. It is always the result of a commitment to excellence, intelligent planning, and focused effort. - Paul J. Meyer",
    "Concentrate all your thoughts upon the work at hand. The sun's rays do not burn until brought to a focus. - Alexander Graham Bell"
  ];

  let quoteIndex = 0;
  setInterval(() => {
    const motivationalText = document.querySelector('.motivational-text');
    quoteIndex = (quoteIndex + 1) % quotes.length;
    motivationalText.style.opacity = '0';
    
    setTimeout(() => {
      motivationalText.textContent = `"${quotes[quoteIndex]}"`;
      motivationalText.style.opacity = '0.8';
    }, 300);
  }, 8000);
});
