const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const {
    submitContact,
    getContacts,
    updateContactStatus,
    deleteContact
} = require('../controllers/contactController');

router.post('/', submitContact);
router.get('/', authenticate, isAdmin, getContacts);
router.put('/:id', authenticate, isAdmin, updateContactStatus);
router.delete('/:id', authenticate, isAdmin, deleteContact);

module.exports = router;