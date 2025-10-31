Generate test data for inbox (bandeja)

This script inserts fake documents into the database using the project's Sequelize models.

Location:
  scripts/generate-inbox-data.js

Usage (from project root):

  # generate 100 documents (default)
  node scripts/generate-inbox-data.js

  # generate 50 documents
  node scripts/generate-inbox-data.js --count=50

  # generate 20 documents but only in a specific area
  node scripts/generate-inbox-data.js --count=20 --area=6

Notes:
- The script uses the database settings from `config/sequelize.js` (default: local MySQL `sgd_db` with root and no password).
- The script will check for required lookup data: areas, document statuses, document types. If they are missing, it will abort.
- The script is defensive: it detects actual columns present in the `documents` table (for example if `categoria_id` is not present) and will avoid inserting missing columns.
- No external dependencies required.

After running, open the application and go to the Bandeja (area dashboard) for the target area to test filters (status, type, category, search, date range).