// Modern blocked page interactions
document.addEventListener('DOMContentLoaded', function() {
  const container = document.querySelector('.container');
  
  // Add subtle hover effect
  container.addEventListener('mouseenter', function() {
    this.style.transform = 'translateY(-2px)';
    this.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
  });
  
  container.addEventListener('mouseleave', function() {
    this.style.transform = 'translateY(0)';
    this.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
  });

  // Update motivational quotes periodically
  const quotes = [
    "The difference between successful people and very successful people is that very successful people say 'no' to almost everything.",
    "Focus is not about saying yes to the things you've got to focus on, but about saying no to the hundred other good ideas.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "The future depends on what you do today.",
    "Don't watch the clock; do what it does. Keep going.",
    "The key to success is to focus on goals, not obstacles.",
    "Productivity is never an accident. It is always the result of a commitment to excellence, intelligent planning, and focused effort.",
    "Concentrate all your thoughts upon the work at hand. The sun's rays do not burn until brought to a focus."
  ];

  let quoteIndex = 0;
  setInterval(() => {
    const motivationalText = document.querySelector('.motivational-text');
    quoteIndex = (quoteIndex + 1) % quotes.length;
    motivationalText.style.opacity = '0';
    
    setTimeout(() => {
      motivationalText.textContent = quotes[quoteIndex];
      motivationalText.style.opacity = '1';
    }, 300);
  }, 8000);
});
