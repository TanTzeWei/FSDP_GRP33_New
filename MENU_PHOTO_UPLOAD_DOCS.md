# Menu Photo Upload Feature - Implementation Summary

## Overview
A dedicated photo upload form for menu items (dishes) that allows stall owners to upload photos along with dish details (price, category, spice level, dietary info, etc.).

## Frontend Components Created

### 1. **MenuPhotoUpload.jsx** (`frontend/src/components/MenuPhotoUpload.jsx`)
A comprehensive React component for uploading menu item photos with features:

**Key Features:**
- Drag-and-drop photo upload
- File validation (JPEG, PNG, WebP, max 5MB)
- Form fields for:
  - Dish name (required)
  - Price in SGD (required)
  - Category selection (required)
  - Spice level (mild, medium, hot, very hot)
  - Description (optional)
  - Dietary information checkboxes (Vegetarian, Vegan, Gluten-Free, Halal, No Pork)
  - Hawker centre selection (required)
  - Stall selection (required)

**Dynamic Features:**
- Fetches hawker centres from API on component mount
- Dynamically loads stalls when hawker centre is selected
- Image preview with remove option
- Real-time validation and error messages
- Loading state during upload

### 2. **MenuPhotoUpload.css** (`frontend/src/components/MenuPhotoUpload.css`)
Complete styling with:
- Modal and embedded layout support
- Responsive design (mobile-friendly)
- Drag-and-drop visual feedback
- Form styling with focus states
- Loading animations
- Error message styling

## Backend Controllers & Models

### 1. **MenuPhotoController.js** (`controllers/menuPhotoController.js`)
Handles menu photo uploads and CRUD operations:

**Methods:**
- `uploadMenuPhoto()` - Upload photo and create/update dish
- `getMenuPhotosByStall()` - Get photos for a specific stall
- `getMenuPhotosByHawkerCentre()` - Get photos for a hawker centre
- `getMenuPhoto()` - Get single photo details
- `deleteMenuPhoto()` - Delete menu photo

**Storage:**
- Files saved to `/uploads/menu/` directory
- Filenames: `{UUID}-{timestamp}.{ext}`
- Metadata stored in `food_items` table

### 2. **MenuPhotoModel.js** (`models/menuPhotoModel.js`)
Database operations:

**Methods:**
- `saveDishWithPhoto()` - Create new or update existing dish with photo
- `getPhotosByStall()` - Query dishes by stall ID
- `getPhotosByHawkerCentre()` - Query dishes by hawker centre
- `getPhotoById()` - Get dish with all details
- `deletePhoto()` - Soft delete (marks as unavailable)
- `getPhotoByPath()` - Fetch by file path

## API Routes Added to app.js

```javascript
POST   /api/menu-photos/upload              - Upload menu photo
GET    /api/menu-photos/stall/:stallId      - Get photos by stall
GET    /api/menu-photos/hawker/:hawkerCentreId - Get photos by hawker centre
GET    /api/menu-photos/:photoId            - Get single photo
DELETE /api/menu-photos/:photoId            - Delete menu photo
```

## Database Integration

**Table Used:** `food_items`

**Fields Updated/Used:**
- `image_url` - Stores file path to photo
- `name` - Dish name
- `description` - Dish description
- `price` - Dish price
- `category` - Category (Rice, Noodles, Soup, etc.)
- `spice_level` - Spice level
- `dietary_info` - JSON array of dietary tags
- `stall_id` - Link to stall
- `is_available` - Availability status

## Usage Example

### Frontend Usage
```jsx
import MenuPhotoUpload from './components/MenuPhotoUpload';

function MyComponent() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowModal(true)}>Add Menu Item</button>
      {showModal && (
        <MenuPhotoUpload
          onClose={() => setShowModal(false)}
          onUploadSuccess={(data) => {
            console.log('Menu item added:', data);
            // Refresh menu, etc.
          }}
        />
      )}
    </>
  );
}
```

### API Request Example
```javascript
const formData = new FormData();
formData.append('photo', fileObject);
formData.append('dishName', 'Chicken Rice');
formData.append('price', '5.50');
formData.append('category', 'Rice');
formData.append('hawkerCentreId', '1');
formData.append('stallId', '5');
formData.append('dietaryInfo', JSON.stringify(['Halal']));

const response = await fetch('http://localhost:3000/api/menu-photos/upload', {
  method: 'POST',
  body: formData
});
```

## Key Differences: Menu vs Public Photo Upload

| Feature | Public Photos | Menu Photos |
|---------|---------------|------------|
| **Form** | PhotoUpload.jsx | MenuPhotoUpload.jsx |
| **Controller** | uploadController.js | menuPhotoController.js |
| **Storage** | `/uploads/` | `/uploads/menu/` |
| **Purpose** | User-uploaded food pics | Stall menu items |
| **Fields** | Dish name, description | Dish name, price, category, spice, dietary |
| **Database** | `photos` table | `food_items` table |
| **Linked To** | Hawker centre + optional stall | Stall (required) |

## File Locations

```
Frontend:
- frontend/src/components/MenuPhotoUpload.jsx
- frontend/src/components/MenuPhotoUpload.css

Backend:
- controllers/menuPhotoController.js
- models/menuPhotoModel.js
- app.js (updated with new routes)

Storage:
- /uploads/menu/ (for menu photos)
```

## Next Steps (Optional Enhancements)

1. Add authentication middleware to protect upload endpoints
2. Add image compression before storage
3. Add pagination for menu photos endpoints
4. Add sorting/filtering options
5. Add bulk upload feature
6. Add image crop/edit functionality
7. Add approval workflow for menu items
