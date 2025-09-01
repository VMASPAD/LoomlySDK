# Loomly SDK - Save System Documentation

## Overview

The Loomly SDK now includes a comprehensive localStorage-based save system that allows users to persist their projects locally in the browser. This system includes automatic saving, manual saving, project restoration, image upload support, and data management features.

## Features

### 1. Comprehensive Project Persistence
- **Complete Canvas State**: Saves all elements, their positions, styles, and properties
- **Canvas Settings**: Preserves canvas dimensions, zoom level, and background settings
- **Uploaded Images**: Stores base64-encoded image data along with metadata
- **HTML Preservation**: Maintains complete canvas HTML structure for accurate restoration

### 2. Image Upload System
- **Drag & Drop Interface**: Easy-to-use image uploader in the Elements panel
- **Format Support**: Accepts all standard image formats (PNG, JPG, GIF, etc.)
- **Automatic Integration**: Uploaded images become moveable elements on the canvas
- **Base64 Storage**: Images are stored as data URLs for offline availability

### 3. Auto-Save Functionality
- **5-Minute Intervals**: Automatic saves every 5 minutes when changes are detected
- **Change Detection**: Smart detection of unsaved changes
- **Background Operation**: Non-intrusive auto-saving with console logging
- **Conditional Saving**: Only saves when there are actual changes to preserve

### 4. Manual Save Controls
- **Save Button**: Manual save trigger with visual change indicators
- **Status Indicators**: Shows unsaved changes with asterisk (*) notation
- **Last Save Time**: Tooltip displays when project was last saved
- **Visual Feedback**: Color-coded save button (green when changes exist)

### 5. Project Restoration
- **Startup Loading**: Automatically restores saved projects on application launch
- **Complete State Recovery**: Restores all elements, settings, and uploaded images
- **Error Handling**: Graceful handling of corrupted or invalid save data
- **Console Feedback**: Clear logging of restoration process

### 6. Data Management
- **Clear Data Button**: One-click removal of all saved project data
- **Confirmation Dialog**: Prevents accidental data loss with confirmation prompt
- **Complete Reset**: Clears both project data and canvas state
- **Storage Keys**: Uses `loomlyStudioProject` and `studioCanvasData` localStorage keys

## Technical Implementation

### localStorage Structure

#### Project Data (`loomlyStudioProject`)
```json
{
  "version": "1.0",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "canvasSettings": {
    "width": 800,
    "height": 600,
    "zoom": 1,
    "backgroundColor": "transparent"
  },
  "elements": [
    {
      "id": "element_123456789",
      "type": "div",
      "name": "Element Name",
      "x": 100,
      "y": 100,
      "width": 200,
      "height": 150,
      "transform": "translate3d(100px, 100px, 0px)",
      "zIndex": 1,
      "isVisible": true,
      "isLocked": false,
      "styles": { /* computed styles */ },
      "content": "Element content",
      "innerHTML": "<div>...</div>"
    }
  ],
  "uploadedImages": [
    {
      "id": "img_123456789",
      "name": "image.png",
      "data": "data:image/png;base64,..."
    }
  ],
  "canvasHTML": "<div class='moveable-element'>...</div>"
}
```

#### Render Data (`studioCanvasData`)
```json
{
  "elements": [/* simplified element data for rendering */],
  "canvasSize": {
    "width": 800,
    "height": 600
  },
  "zoom": 1,
  "backgroundColor": "transparent"
}
```

### Key Functions

#### `saveProject()`
- Captures complete canvas state including HTML structure
- Stores element positions, styles, and metadata
- Saves uploaded images as base64 data
- Updates localStorage with both project and render data
- Sets save timestamp and clears unsaved changes flag

#### `restoreProject()`
- Loads project data from localStorage
- Restores canvas settings (dimensions, zoom)
- Recreates canvas HTML structure
- Re-binds elements with their original properties
- Handles uploaded images restoration

#### `addImageElement(imageData, fileName)`
- Creates moveable image elements from uploaded files
- Stores image data in uploadedImages array
- Positions new images randomly on canvas
- Integrates with existing element management system

#### `clearSavedData()`
- Shows confirmation dialog for data protection
- Removes all localStorage entries
- Resets application state completely
- Clears canvas and element arrays

## Usage Instructions

### For Users

1. **Creating Projects**: 
   - Add elements using the Elements panel
   - Upload images via the Image Upload button
   - Customize elements using Canvas and Properties panels

2. **Saving Work**:
   - Manual save: Click the "Save" button in the toolbar
   - Auto-save: Happens automatically every 5 minutes
   - Status: Watch for the asterisk (*) indicating unsaved changes

3. **Loading Projects**:
   - Projects automatically restore when reopening the application
   - All elements, images, and settings are preserved
   - Check browser console for restoration confirmation

4. **Managing Data**:
   - Clear all data using "Clear Data" button (requires confirmation)
   - Check last save time via the Save button tooltip

### For Developers

#### Integration Points

1. **Elements Panel** (`Elements.tsx`):
   - Added `ImageUploader` component
   - `onImageAdd` prop connects to Studio's image handling
   - Automatic integration with existing element system

2. **Toolbar** (`Toolbar.tsx`):
   - Added Save and Clear Data buttons
   - Visual indicators for unsaved changes
   - Save timestamp tooltips

3. **Studio Component** (`Studio.tsx`):
   - Core save system implementation
   - Auto-save useEffect hooks
   - State management for save-related data

#### Extension Points

- **Custom Storage**: Replace localStorage with cloud storage APIs
- **Export Formats**: Extend save format for additional data types  
- **Backup Systems**: Add automatic cloud backups
- **Version Control**: Implement save history and rollback features

## Browser Compatibility

- **localStorage Support**: All modern browsers (IE8+)
- **Base64 Images**: Full support for image data storage
- **File API**: Modern browsers for file upload functionality
- **Storage Limits**: Typically 5-10MB per origin (varies by browser)

## Performance Considerations

- **Auto-save Frequency**: 5-minute intervals balance data safety with performance
- **Image Storage**: Base64 encoding increases file size by ~33%
- **Change Detection**: Efficient state comparison minimizes unnecessary saves
- **Error Handling**: Graceful degradation when localStorage is full or unavailable

## Troubleshooting

### Common Issues

1. **Save Not Working**:
   - Check browser console for localStorage errors
   - Verify localStorage quota isn't exceeded
   - Ensure no browser privacy modes blocking storage

2. **Images Not Restoring**:
   - Check if images are properly stored as base64
   - Verify image data isn't corrupted in localStorage
   - Clear data and re-upload if issues persist

3. **Auto-save Not Triggering**:
   - Ensure elements are being modified to trigger change detection
   - Check browser console for auto-save logs
   - Verify 5-minute timer isn't being cleared by navigation

4. **Restoration Failures**:
   - Check localStorage for corrupted JSON data
   - Clear saved data and start fresh if necessary
   - Monitor browser console for specific error messages

### Development Tips

- **Console Logging**: Save system provides detailed console output
- **Data Inspection**: Use browser DevTools to examine localStorage
- **Testing**: Clear localStorage between tests for clean state
- **Debugging**: Check network tab for any conflicting storage operations

## Future Enhancements

- **Cloud Sync**: Integration with cloud storage providers
- **Export/Import**: JSON file-based project sharing
- **Version History**: Multiple save slots with timestamps  
- **Collaboration**: Real-time collaborative editing features
- **Compression**: Efficient storage for large projects