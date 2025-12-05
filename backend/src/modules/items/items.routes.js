const express = require('express');
const { getItems } = require('./items.controller');
const { requireAuth } = require('../auth/auth.middleware');

const router = express.Router();

router.get('/', requireAuth, getItems);

module.exports = router;
