// scripts.js

// Select the button and add a click event listener
document.getElementById('changeTextButton').addEventListener('click', function() {
    document.querySelector('p').textContent = 'You clicked the button! The text has changed.';
});
