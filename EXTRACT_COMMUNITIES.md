# Community Data Extraction

This script extracts all community data from the MongoDB database and exports it to JSON and CSV formats.

## Prerequisites

1. Ensure MongoDB is running and accessible
2. Set `MONGODB_URI` environment variable in `config.env` or `.env` file
3. Install dependencies: `npm install`

## Usage

### Basic extraction
```bash
npm run extract:communities
```

Or directly:
```bash
node extract_communities.js
```

### Custom output file
```bash
node extract_communities.js my_communities.json
```

## Output

The script generates two files:

1. **JSON file** (`communities_export_[timestamp].json`):
   - Complete community data with all populated fields
   - Includes statistics and metadata
   - Format: Pretty-printed JSON with indentation

2. **CSV summary** (`communities_export_[timestamp]_summary.csv`):
   - Simplified tabular view
   - Columns: Name, Category, Creator, Members, Posts, Likes, Comments, Is Active, Is Public, Created At

## Data Structure

The exported JSON includes:

- **Export Metadata**:
  - Export date
  - Total communities count
  - Statistics summary

- **Community Data** (for each community):
  - Basic info: name, description, image, category
  - Creator information (fullName, email, phoneNumber)
  - Members list with roles and join dates
  - Posts with:
    - Author information
    - Content and images
    - Likes (count and users)
    - Comments (count and details)
  - Settings: isPublic, isActive
  - Timestamps: createdAt, updatedAt

- **Statistics**:
  - Total communities by category
  - Active/Public counts
  - Total members, posts, likes, comments

## Example Output

```
🔌 Connecting to MongoDB...
✅ Connected to MongoDB successfully

📊 Extracting community data...
✅ Found 15 communities

📈 Community Statistics:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Communities: 15
Active: 15 | Public: 14
Total Members: 142
Total Posts: 87
Total Likes: 234
Total Comments: 56

By Category:
  academic: 5
  social: 6
  professional: 2
  cultural: 2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💾 Saving to: /path/to/communities_export_1234567890.json
✅ Data exported successfully

📊 CSV summary saved to: /path/to/communities_export_1234567890_summary.csv

👋 Database connection closed

✨ Extraction completed successfully!
```

## Environment Variables

Make sure your `config.env` or `.env` file contains:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/campus_teranga
```

Or for local development:

```env
MONGODB_URI=mongodb://localhost:27017/campus_teranga
```

## Notes

- The script safely handles missing or null data
- All user information (creators, members, authors) is populated with full details
- The export includes all posts, comments, and likes
- CSV file provides a quick overview, JSON has full details
- Script closes database connection automatically

## Troubleshooting

**Connection Error**: 
- Verify `MONGODB_URI` is set correctly
- Check MongoDB is running and accessible
- For MongoDB Atlas, ensure IP whitelist includes your IP

**Model Not Found**:
- Ensure you're in the backend directory
- Check that `src/models/Community.js` exists

**No Data Extracted**:
- Verify communities exist in the database
- Check MongoDB connection and database name

