// This is a test script to verify script loading
console.log('Test script loaded successfully!');

// Call the callback to notify the page
if (typeof window.testScriptLoaded === 'function') {
  window.testScriptLoaded();
}