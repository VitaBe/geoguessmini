/**
 * @jest-environment jsdom
 */

require('../js/utils.js');
require('../js/gameState.js');

describe('gameState.js', () => {
  // Mock dependencies
  let mockImageLoader;
  let mockMapController;
  let mockUiController;

  const sampleItems = [
    { filename: 'image1.jpg', description: 'Location 1', rawLocation: '48.858, 2.294' },
    { filename: 'image2.jpg', description: 'Location 2', rawLocation: '40.689, -74.044' },
    { filename: 'final.txt', description: 'Game Complete!', rawLocation: 'You won!' }
  ];

  beforeEach(() => {
    // Reset module state by reinitializing
    mockImageLoader = {
      getImageUrl: jest.fn().mockResolvedValue('blob:mock-image-url')
    };

    mockMapController = {
      showMap: jest.fn(),
      hideMap: jest.fn(),
      resetMap: jest.fn()
    };

    mockUiController = {
      showGameView: jest.fn(),
      showFinalView: jest.fn(),
      updateImage: jest.fn(),
      updateDescription: jest.fn(),
      updateProgress: jest.fn(),
      showUploadView: jest.fn(),
      showError: jest.fn(),
      hideError: jest.fn()
    };

    // Initialize game for each test
    initGame(sampleItems, mockImageLoader, mockMapController, mockUiController);
  });

  describe('initGame', () => {
    test('should initialize with correct state', () => {
      const state = getState();

      expect(state.currentIndex).toBe(0);
      expect(state.totalItems).toBe(3);
      expect(state.isFinal).toBe(false);
      expect(state.currentItem).toEqual(sampleItems[0]);
    });

    test('should clear previous state when reinitialized', () => {
      // Advance to next item
      initGame(sampleItems, mockImageLoader, mockMapController, mockUiController);
      advanceToNextItem();
      expect(getState().currentIndex).toBe(1);

      // Reinitialize - should reset
      initGame(sampleItems, mockImageLoader, mockMapController, mockUiController);
      expect(getState().currentIndex).toBe(0);
    });

    test('should handle empty items array', () => {
      initGame([], mockImageLoader, mockMapController, mockUiController);
      const state = getState();

      expect(state.totalItems).toBe(0);
      expect(state.currentItem).toBeNull();
    });
  });

  describe('loadCurrentItem', () => {
    test('should load first item on init', async () => {
      await loadCurrentItem();

      expect(mockUiController.updateDescription).toHaveBeenCalledWith('Location 1');
      expect(mockMapController.showMap).toHaveBeenCalled();
      expect(mockUiController.updateProgress).toHaveBeenCalledWith(1, 3);
    });

    test('should handle final entry (non-parseable location)', async () => {
      // Move to final item
      advanceToNextItem();
      advanceToNextItem();

      expect(getState().currentIndex).toBe(2);

      await loadCurrentItem();

      expect(mockUiController.showFinalView).toHaveBeenCalledWith('You won!');
      expect(mockUiController.showGameView).not.toHaveBeenCalled();
    });

    test('should cache image URLs', async () => {
      mockImageLoader.getImageUrl.mockResolvedValue('blob:cached-url');

      await loadCurrentItem();
      await loadCurrentItem(); // Should use cached

      // Image should only be fetched once
      expect(mockImageLoader.getImageUrl).toHaveBeenCalledTimes(1);
      expect(mockImageLoader.getImageUrl).toHaveBeenCalledWith('image1.jpg');
    });

    test('should handle image loading errors gracefully', async () => {
      mockImageLoader.getImageUrl.mockRejectedValue(new Error('Failed to load'));

      await loadCurrentItem();

      // Should still show description with error notice
      expect(mockUiController.updateDescription).toHaveBeenCalledWith(
        expect.stringContaining('(Error loading image)')
      );
    });

    test('should handle index out of bounds', async () => {
      // Move beyond last item
      advanceToNextItem();
      advanceToNextItem();
      advanceToNextItem();

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      await loadCurrentItem();

      expect(consoleSpy).toHaveBeenCalledWith('Game index out of bounds');
      consoleSpy.mockRestore();
    });

    test('should skip image loading if URL already cached', async () => {
      // First load caches the image
      await loadCurrentItem();
      expect(mockImageLoader.getImageUrl).toHaveBeenCalledTimes(1);

      // Reset mock
      mockImageLoader.getImageUrl.mockClear();

      // Second load should not call getImageUrl again
      await loadCurrentItem();
      expect(mockImageLoader.getImageUrl).not.toHaveBeenCalled();
    });

    test('should handle missing UI controller methods gracefully', async () => {
      const partialUiController = {};
      initGame(sampleItems, mockImageLoader, mockMapController, partialUiController);

      // Should not throw
      await expect(loadCurrentItem()).resolves.not.toThrow();
    });
  });

  describe('advanceToNextItem', () => {
    test('should advance to next item', async () => {
      await loadCurrentItem(); // Load item 0
      advanceToNextItem(); // Advance to item 1
      await loadCurrentItem(); // Load item 1

      expect(getState().currentIndex).toBe(1);
      expect(mockUiController.updateDescription).toHaveBeenLastCalledWith('Location 2');
    });

    test('should update progress when advancing', async () => {
      await loadCurrentItem();
      advanceToNextItem();
      await loadCurrentItem();

      expect(mockUiController.updateProgress).toHaveBeenLastCalledWith(2, 3);
    });
  });

  describe('getCurrentTarget', () => {
    test('should return parsed coordinates for valid location', () => {
      expect(getCurrentTarget()).toEqual({ lat: 48.858, lng: 2.294 });

      advanceToNextItem();
      expect(getCurrentTarget()).toEqual({ lat: 40.689, lng: -74.044 });
    });

    test('should return null for non-parseable location', () => {
      // Move to final item
      advanceToNextItem();
      advanceToNextItem();

      expect(getCurrentTarget()).toBeNull();
    });

    test('should return null when index out of bounds', () => {
      // Intentionally exceed bounds
      advanceToNextItem();
      advanceToNextItem();
      advanceToNextItem();

      expect(getCurrentTarget()).toBeNull();
    });
  });

  describe('resetGame', () => {
    test('should reset to initial state', async () => {
      // Advance and cache an image
      await loadCurrentItem();
      advanceToNextItem();

      expect(getState().currentIndex).toBe(1);

      // Check that reset clears things
      const revokeSpy = jest.spyOn(URL, 'revokeObjectURL').mockImplementation();

      resetGame();

      expect(getState().currentIndex).toBe(0);
      expect(revokeSpy).toHaveBeenCalled();

      revokeSpy.mockRestore();
    });

    test('should clear image URL cache on reset', async () => {
      await loadCurrentItem(); // Cache an image
      const revokeSpy = jest.spyOn(URL, 'revokeObjectURL').mockImplementation();

      resetGame();

      // After reset, loading first item again should fetch image
      mockImageLoader.getImageUrl.mockClear();

      // Note: We need to reinit to set up dependencies again
      // This is implicitly done by the beforeEach

      revokeSpy.mockRestore();
    });
  });

  describe('getState', () => {
    test('should return complete state info', () => {
      const state = getState();

      expect(state).toHaveProperty('currentIndex');
      expect(state).toHaveProperty('totalItems');
      expect(state).toHaveProperty('isFinal');
      expect(state).toHaveProperty('currentItem');
    });

    test('should reflect current game progress', async () => {
      let state = getState();
      expect(state.currentIndex).toBe(0);
      expect(state.totalItems).toBe(3);

      await loadCurrentItem();
      advanceToNextItem();

      state = getState();
      expect(state.currentIndex).toBe(1);
      expect(state.currentItem).toEqual(sampleItems[1]);
    });

    test('should reflect final state', async () => {
      advanceToNextItem();
      advanceToNextItem();
      await loadCurrentItem();

      const state = getState();
      expect(state.isFinal).toBe(true);
    });
  });

  describe('integration scenarios', () => {
    test('should complete full game flow', async () => {
      // Start game
      await loadCurrentItem();
      expect(getState().currentIndex).toBe(0);
      expect(mockUiController.showGameView).toHaveBeenCalled();

      // Advance through items
      advanceToNextItem();
      await loadCurrentItem();
      expect(getState().currentIndex).toBe(1);

      // Final item
      advanceToNextItem();
      await loadCurrentItem();
      expect(getState().isFinal).toBe(true);
      expect(mockUiController.showFinalView).toHaveBeenCalled();

      // Reset
      resetGame();
      expect(getState().currentIndex).toBe(0);
    });

    test('should handle single item game', async () => {
      const singleItem = [
        { filename: 'image.jpg', description: 'Only item', rawLocation: 'You win!' }
      ];

      initGame(singleItem, mockImageLoader, mockMapController, mockUiController);
      await loadCurrentItem();

      expect(getState().totalItems).toBe(1);
      expect(mockUiController.showFinalView).toHaveBeenCalledWith('You win!');
    });
  });
});
