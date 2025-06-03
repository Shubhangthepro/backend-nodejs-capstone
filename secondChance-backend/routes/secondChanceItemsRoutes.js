const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const connectToDatabase = require('../models/db');
const logger = require('../logger');

// Define the upload directory path
const directoryPath = 'public/images';

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, directoryPath); // Specify the upload directory
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original file name
  },
});

const upload = multer({ storage: storage });

// Get all secondChanceItems
router.get('/', async (req, res, next) => {
  logger.info('/ called');
  try {
    // Step 2: task 1 - Connect to DB
    const db = await connectToDatabase();

    // Step 2: task 2 - Get collection
    const collection = db.collection('secondChanceItems');

    // Step 2: task 3 - Find all documents
    const secondChanceItems = await collection.find({}).toArray();

    // Step 2: task 4 - Send response JSON
    res.json(secondChanceItems);
  } catch (e) {
    logger.error('oops something went wrong', e);
    next(e);
  }
});

// Add a new item
router.post('/', upload.single('image'), async (req, res, next) => {
  try {
    // Step 3: task 1 - Connect to DB
    const db = await connectToDatabase();

    // Step 3: task 2 - Get collection
    const collection = db.collection('secondChanceItems');

    // Step 3: task 3 - Prepare new item from request body
    const newItem = req.body;

    // If file uploaded, save filename or path
    if (req.file) {
      newItem.image = path.join(directoryPath, req.file.originalname);
    }

    // Step 3: task 4 - Insert new document
    const result = await collection.insertOne(newItem);

    // Step 3: task 5 - Send back inserted document
    res.status(201).json(result.ops[0]); // ops is deprecated in new MongoDB drivers, if version >=4 use result.insertedId with findOne
  } catch (e) {
    next(e);
  }
});

// Get a single secondChanceItem by ID
router.get('/:id', async (req, res, next) => {
  try {
    // Step 4: task 1 - Connect to DB
    const db = await connectToDatabase();

    // Step 4: task 2 - Get collection
    const collection = db.collection('secondChanceItems');

    // Step 4: task 3 - Find one document by id (assuming id is a string)
    const item = await collection.findOne({ id: req.params.id });

    // Step 4: task 4 - Send found item or 404
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (e) {
    next(e);
  }
});

// Update an existing item
router.put('/:id', upload.single('image'), async (req, res, next) => {
  try {
    // Step 5: task 1 - Connect to DB
    const db = await connectToDatabase();

    // Step 5: task 2 - Get collection
    const collection = db.collection('secondChanceItems');

    // Step 5: task 3 - Prepare update document
    const updateDoc = { $set: req.body };

    // If a new file uploaded, update the image path
    if (req.file) {
      updateDoc.$set.image = path.join(directoryPath, req.file.originalname);
    }

    // Step 5: task 4 - Update document by id
    const result = await collection.updateOne({ id: req.params.id }, updateDoc);

    // Step 5: task 5 - Check result and send response
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const updatedItem = await collection.findOne({ id: req.params.id });
    res.json(updatedItem);
  } catch (e) {
    next(e);
  }
});

// Delete an existing item
router.delete('/:id', async (req, res, next) => {
  try {
    // Step 6: task 1 - Connect to DB
    const db = await connectToDatabase();

    // Step 6: task 2 - Get collection
    const collection = db.collection('secondChanceItems');

    // Step 6: task 3 - Delete document by id
    const result = await collection.deleteOne({ id: req.params.id });

    // Step 6: task 4 - Check result and send response
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
