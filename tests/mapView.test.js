/**
 * @jest-environment jsdom
 */

require('../js/mapView.js');

describe('mapView.js', () => {
  const mockElement = {
    classList: { add: jest.fn(), remove: jest.fn() },
    style: {},
    textContent: '',
    innerHTML: ''
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock getElementById
    document.getElementById = jest.fn((id) => {
      if (id === 'map') {
        return mockElement;
      }
      return null;
    });
  });

  describe('initMap', () => {
    test('should create map with correct options', () => {
      const mockCallback = jest.fn();
      const map = initMap(mockCallback);

      expect(L.map).toHaveBeenCalledWith('map', {
        center: [20, 0],
        zoom: 2,
        minZoom: 2,
        worldCopyJump: true
      });
    });

    test('should add tile layer', () => {
      const mockCallback = jest.fn();
      initMap(mockCallback);

      expect(L.tileLayer).toHaveBeenCalledWith(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        expect.objectContaining({
          attribution: expect.stringContaining('OpenStreetMap'),
          maxZoom: 19
        })
      );
    });

    test('should bind click event', () => {
      const mockCallback = jest.fn();
      const mockOn = jest.fn();

      L.map = jest.fn(() => ({
        setView: jest.fn(),
        on: mockOn,
        addControl: jest.fn()
      }));

      initMap(mockCallback);

      expect(mockOn).toHaveBeenCalledWith('click', expect.any(Function));
    });

    test('should create marker layer group', () => {
      const mockCallback = jest.fn();
      initMap(mockCallback);

      expect(L.layerGroup).toHaveBeenCalled();
    });
  });

  describe('handleMapClick', () => {
    test('should handle click event and call callback', () => {
      const mockCallback = jest.fn();
      const mockMarker = { addTo: jest.fn() };

      // Setup L.marker mock
      L.marker = jest.fn(() => mockMarker);

      // Initialize map
      initMap(mockCallback);

      // Call handleMapClick
      const mockEvent = {
        latlng: { lat: 48.858, lng: 2.294 }
      };
      handleMapClick(mockEvent);

      // Should clear existing markers first
      expect(mockMarker.addTo).toHaveBeenCalled();
      // Callback should be called with coordinates
      expect(mockCallback).toHaveBeenCalledWith({
        lat: 48.858,
        lng: 2.294
      });
    });

    test('should not fail if no callback set', () => {
      // Initialize map without callback
      initMap(null);

      const mockEvent = {
        latlng: { lat: 48.858, lng: 2.294 }
      };

      // Should not throw
      expect(() => handleMapClick(mockEvent)).not.toThrow();
    });

    test('should add marker at click location', () => {
      const mockCallback = jest.fn();
      const mockMarker = { addTo: jest.fn() };
      L.marker = jest.fn(() => mockMarker);

      initMap(mockCallback);

      const mockEvent = {
        latlng: { lat: 48.858, lng: 2.294 }
      };
      handleMapClick(mockEvent);

      expect(L.marker).toHaveBeenCalledWith([48.858, 2.294]);
    });
  });

  describe('clearMarkers', () => {
    test('should clear all markers from layer', () => {
      const mockClearLayers = jest.fn();
      const mockLayer = {
        addTo: jest.fn(),
        clearLayers: mockClearLayers
      };

      L.layerGroup = jest.fn(() => mockLayer);

      // Initialize map
      initMap(jest.fn());

      // Clear markers
      clearMarkers();

      expect(mockClearLayers).toHaveBeenCalled();
    });

    test('should not fail if markerLayer is null', () => {
      // Initialize with a fresh state where markerLayer hasn't been set
      expect(() => clearMarkers()).not.toThrow();
    });
  });

  describe('showMap', () => {
    test('should set display to block', () => {
      const mockContainer = {
        style: { display: '' }
      };
      document.getElementById = jest.fn(() => mockContainer);

      initMap(jest.fn());
      showMap();

      expect(mockContainer.style.display).toBe('block');
    });

    test('should invalidate map size', () => {
      const mockInvalidateSize = jest.fn();
      L.map = jest.fn(() => ({
        setView: jest.fn(),
        on: jest.fn(),
        invalidateSize: mockInvalidateSize,
        addControl: jest.fn()
      }));

      document.getElementById = jest.fn(() => ({
        style: {}
      }));

      // Initialize and show
      initMap(jest.fn());

      // Fast-forward timers
      jest.useFakeTimers();
      showMap();
      jest.advanceTimersByTime(100);

      expect(mockInvalidateSize).toHaveBeenCalled();
      jest.useRealTimers();
    });

    test('should not fail if map element not found', () => {
      document.getElementById = jest.fn(() => null);

      initMap(jest.fn());

      expect(() => showMap()).not.toThrow();
    });
  });

  describe('hideMap', () => {
    test('should set display to none', () => {
      const mockContainer = {
        style: { display: '' }
      };
      document.getElementById = jest.fn(() => mockContainer);

      initMap(jest.fn());
      hideMap();

      expect(mockContainer.style.display).toBe('none');
    });

    test('should not fail if map element not found', () => {
      document.getElementById = jest.fn(() => null);

      initMap(jest.fn());

      expect(() => hideMap()).not.toThrow();
    });
  });

  describe('resetMap', () => {
    test('should reset to global view', () => {
      const mockSetView = jest.fn();
      const mockClearLayers = jest.fn();

      L.map = jest.fn(() => ({
        setView: mockSetView,
        on: jest.fn(),
        invalidateSize: jest.fn(),
        addControl: jest.fn()
      }));

      L.layerGroup = jest.fn(() => ({
        addTo: jest.fn(),
        clearLayers: mockClearLayers
      }));

      initMap(jest.fn());
      resetMap();

      expect(mockSetView).toHaveBeenCalledWith([20, 0], 2);
      expect(mockClearLayers).toHaveBeenCalled();
    });

    test('should not fail if map is null', () => {
      // Without setting up map properly
      expect(() => resetMap()).not.toThrow();
    });
  });

  describe('integration', () => {
    test('should support full map lifecycle', () => {
      const mockCallback = jest.fn();

      // Create map
      initMap(mockCallback);

      // Show
      showMap();

      // Click
      handleMapClick({ latlng: { lat: 48.858, lng: 2.294 } });
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Clear markers
      clearMarkers();

      // Hide
      hideMap();

      // Reset
      resetMap();

      expect(mockCallback).toHaveBeenCalledTimes(1); // Callback still only called once
    });
  });
});
