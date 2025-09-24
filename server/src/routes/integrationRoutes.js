const express = require('express');
const { verifyToken } = require('../middleware/auth');
const controller = require('../controllers/integrationController');

const router = express.Router();

// Get YouTube Clone connection status
router.get('/youtube-clone/status', verifyToken, controller.getYTCloneStatus);

// Connect current user to their YouTube Clone channel
router.post('/youtube-clone/connect', verifyToken, controller.connectYTClone);

// Publish a video to YouTube Clone
router.post('/youtube-clone/publish/:videoId', verifyToken, controller.publishToYTClone);

module.exports = router;