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
