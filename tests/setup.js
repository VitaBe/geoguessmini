// Test setup file

// Load and expose the module functions globally for our tests
const csvParser = require('../js/csvParser.js');
if (csvParser && csvParser.parseGameItems) {
  global.parseGameItems = csvParser.parseGameItems;
}

const zipLoader = require('../js/zipLoader.js');
if (zipLoader) {
  if (zipLoader.loadZipFile) global.loadZipFile = zipLoader.loadZipFile;
  if (zipLoader.isImageFile) global.isImageFile = zipLoader.isImageFile;
}

const utils = require('../js/utils.js');
if (utils) {
  if (utils.parseLocation) global.parseLocation = utils.parseLocation;
  if (utils.haversineDistance) global.haversineDistance = utils.haversineDistance;
  if (utils.isWithinTolerance) global.isWithinTolerance = utils.isWithinTolerance;
  if (utils.TOLERANCE_KM) global.TOLERANCE_KM = utils.TOLERANCE_KM;
}

const mapView = require('../js/mapView.js');
if (mapView) {
  if (mapView.initMap) global.initMap = mapView.initMap;
  if (mapView.showMap) global.showMap = mapView.showMap;
  if (mapView.hideMap) global.hideMap = mapView.hideMap;
  if (mapView.resetMap) global.resetMap = mapView.resetMap;
  if (mapView.clearMarkers) global.clearMarkers = mapView.clearMarkers;
}

const gameState = require('../js/gameState.js');
if (gameState) {
  if (gameState.initGame) global.initGame = gameState.initGame;
  if (gameState.loadCurrentItem) global.loadCurrentItem = gameState.loadCurrentItem;
  if (gameState.advanceToNextItem) global.advanceToNextItem = gameState.advanceToNextItem;
  if (gameState.getCurrentTarget) global.getCurrentTarget = gameState.getCurrentTarget;
  if (gameState.resetGame) global.resetGame = gameState.resetGame;
  if (gameState.getState) global.getState = gameState.getState;
}

global.L = {
  map: jest.fn(() => ({
    setView: jest.fn(),
    on: jest.fn(),
    remove: jest.fn(),
    invalidateSize: jest.fn(),
  })),
  tileLayer: jest.fn(() => ({
    addTo: jest.fn()
  })),
  marker: jest.fn(() => ({
    addTo: jest.fn(() => ({
      remove: jest.fn()
    }))
  })),
  layerGroup: jest.fn(() => ({
    addTo: jest.fn(),
    clearLayers: jest.fn(),
    removeLayer: jest.fn()
  })),
  latLng: jest.fn((lat, lng) => ({ lat, lng }))
};

global.JSZip = require('jszip');
global.Papa = require('papaparse');

// Mock document methods
document.createElement = jest.fn((tag) => ({
  tagName: tag.toUpperCase(),
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn()
  },
  style: {},
  textContent: ''
}));

document.querySelectorAll = jest.fn(() => []);
document.getElementById = jest.fn(() => ({
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn()
  },
  style: {},
  textContent: '',
  innerHTML: '',
  value: '',
  src: '',
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn()
}));

// Mock URL methods
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock console.time and console.timeEnd
const timers = {};
console.time = jest.fn((label) => {
  timers[label] = Date.now();
});
console.timeEnd = jest.fn((label) => {
  delete timers[label];
});
