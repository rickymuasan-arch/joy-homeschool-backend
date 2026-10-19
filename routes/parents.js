const express = require('express');
const router = express.Router();
const { authenticate, isParent } = require('../middleware/auth');
const Student = require('../models/Student');
const ReportCard = require('../models/ReportCard');
const Payment = require('../models/Payment');
const Event = require('../models/Event');
const User = require('../models/User');
const Diary = require('../models/Diary');
const Timetable = require('../models/Timetable');
const Assignment = require('../models/Assignment');

// ============================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ============================================
router.use(authenticate);
router.use(isParent);

// ============================================
// GET PARENT PROFILE
// ============================================
router.get('/profile', async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error('Get profile error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// GET PARENT'S CHILDREN
// ============================================
router.get('/children', async (req, res) => {
    try {
        const children = await Student.find({ parentId: req.user._id });
        res.json(children);
    } catch (err) {
        console.error('Get children error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// ADD CHILD (PARENT)
// ============================================
router.post('/add-child', async (req, res) => {
    try {
        const { name, dob, curriculum, grade } = req.body;

        if (!name || !dob || !curriculum || !grade) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const student = new Student({
            fullName: name,
            dateOfBirth: dob,
            parentId: req.user._id,
            parentName: req.user.fullName,
            parentEmail: req.user.email,
            parentPhone: req.user.phone || '',
            curriculum: curriculum,
            grade: grade,
            isActive: true
        });

        await student.save();

        res.status(201).json({
            message: 'Child added successfully',
            child: student
        });
    } catch (err) {
        console.error('Add child error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// GET CHILD'S REPORT CARDS
// ============================================
router.get('/child-reports/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;

        const student = await Student.findOne({ _id: studentId, parentId: req.user._id });
        if (!student) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const reportCards = await ReportCard.find({ 
            studentId: studentId,
            isActive: true 
        }).sort({ year: -1, term: -1 });

        res.json(reportCards);
    } catch (err) {
        console.error('Get child reports error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// GET ALL REPORT CARDS FOR PARENT
// ============================================
router.get('/report-cards', async (req, res) => {
    try {
        const reportCards = await ReportCard.find({ 
            parentId: req.user._id 
        }).sort({ createdAt: -1 });

        res.json(reportCards);
    } catch (err) {
        console.error('Get report cards error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// DOWNLOAD REPORT CARD (Branded PDF)
// ============================================
router.get('/report-cards/:reportId/download', async (req, res) => {
    try {
        const PDFDocument = require('pdfkit');
        const path = require('path');
        const fs = require('fs');

        const report = await ReportCard.findById(req.params.reportId);

        if (!report) {
            return res.status(404).json({ message: 'Report card not found' });
        }

        if (report.parentId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (!report.fileData) {
            return res.status(404).json({ message: 'No file available' });
        }

        const doc = new PDFDocument({ size: 'A4', margin: 40 });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(chunks);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="Report-Card-${report.studentName}-${report.term}.pdf"`);
            res.send(pdfBuffer);
        });

        // === HEADER ===
        const logoPath = path.join(__dirname, '..', 'public', 'logo.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 40, 30, { width: 70 });
        }

        doc.fillColor('#0B1A4A').fontSize(24).font('Helvetica-Bold').text('Joy Homeschool', 130, 40);
        doc.fillColor('#E31B23').fontSize(11).font('Helvetica').text('& Tuition Centre', 130, 68);
        doc.fillColor('#4A5568').fontSize(9).text('+254 710 692 228  |  info@joyhomeschool.co.ke  |  www.joyhomeschool.co.ke', 130, 85);
        doc.moveTo(40, 105).lineTo(555, 105).strokeColor('#E31B23').lineWidth(2).stroke();

        // === TITLE ===
        doc.fillColor('#0B1A4A').fontSize(16).font('Helvetica-Bold').text('STUDENT REPORT CARD', 40, 125, { align: 'center' });

        // === STUDENT INFO ===
        let y = 165;
        const leftCol = 50;
        const rightCol = 300;

        doc.fillColor('#2D3748').fontSize(11).font('Helvetica-Bold').text('Student Name:', leftCol, y);
        doc.fillColor('#4A5568').font('Helvetica').text(report.studentName || 'N/A', leftCol + 100, y);

        doc.fillColor('#2D3748').font('Helvetica-Bold').text('Term:', rightCol, y);
        doc.fillColor('#4A5568').font('Helvetica').text(report.term || 'N/A', rightCol + 60, y);

        y += 22;
        doc.fillColor('#2D3748').font('Helvetica-Bold').text('Academic Year:', leftCol, y);
        doc.fillColor('#4A5568').font('Helvetica').text(report.year?.toString() || 'N/A', leftCol + 100, y);

        doc.fillColor('#2D3748').font('Helvetica-Bold').text('Class Teacher:', rightCol, y);
        doc.fillColor('#4A5568').font('Helvetica').text(report.classTeacher || 'N/A', rightCol + 85, y);

        y += 22;
        doc.fillColor('#2D3748').font('Helvetica-Bold').text('Overall Grade:', leftCol, y);
        doc.fillColor('#E31B23').font('Helvetica-Bold').text(report.overallGrade || 'N/A', leftCol + 100, y);

        y += 30;

        doc.moveTo(40, y).lineTo(555, y).strokeColor('#E5E7EB').lineWidth(1).stroke();
        y += 15;

        // === TEACHER REMARKS ===
        doc.fillColor('#2D3748').fontSize(12).font('Helvetica-Bold').text('Teacher Remarks:', 40, y);
        y += 20;
        doc.fillColor('#4A5568').fontSize(10).font('Helvetica')
           .text(report.teacherRemarks || 'No remarks provided.', 50, y, { width: 500, align: 'left' });

        y += 60;

        // === REPORT IMAGE ===
        if (report.fileType && report.fileType.startsWith('image/')) {
            try {
                const imageBuffer = Buffer.from(report.fileData, 'base64');
                doc.image(imageBuffer, 40, y, { fit: [515, 400], align: 'center' });
            } catch (imgErr) {
                console.error('Image render error:', imgErr);
                doc.fillColor('#E31B23').fontSize(10).text('[Unable to embed report image]', 40, y);
            }
        }

        // === FOOTER ===
        const footerY = 780;
        doc.moveTo(40, footerY).lineTo(555, footerY).strokeColor('#E5E7EB').lineWidth(1).stroke();

        doc.fillColor('#4A5568').fontSize(9).font('Helvetica')
           .text('This is a computer-generated report card.', 40, footerY + 8, { align: 'left' });

        doc.fillColor('#4A5568').fontSize(9)
           .text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 40, footerY + 8, { align: 'right', width: 515 });

        doc.fillColor('#E31B23').fontSize(9).font('Helvetica-Bold')
           .text('Joy Homeschool & Tuition Centre', 40, footerY + 25, { align: 'center', width: 515 });

        doc.end();

    } catch (err) {
        console.error('Download error:', err);
        res.status(500).json({ message: 'Error downloading report card' });
    }
});

// ============================================
// GET PAYMENTS FOR CHILD
// ============================================
router.get('/child-payments/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;

        const student = await Student.findOne({ _id: studentId, parentId: req.user._id });
        if (!student) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const payments = await Payment.find({ 
            studentId: studentId, 
            parentId: req.user._id 
        }).sort({ paymentDate: -1 });

        res.json(payments);
    } catch (err) {
        console.error('Get child payments error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// SUBMIT PAYMENT (PARENT)
// ============================================
router.post('/submit-payment', async (req, res) => {
    try {
        const { childId, amount, term, method, reference } = req.body;

        if (!childId) {
            return res.status(400).json({ message: 'Child ID is required' });
        }
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Please enter a valid amount' });
        }
        if (!term) {
            return res.status(400).json({ message: 'Term is required' });
        }
        if (!method) {
            return res.status(400).json({ message: 'Payment method is required' });
        }
        if (!reference || reference.trim().length < 3) {
            return res.status(400).json({ message: 'Please enter a valid payment reference (min 3 characters)' });
        }

        const student = await Student.findOne({ _id: childId, parentId: req.user._id });
        if (!student) {
            return res.status(403).json({ message: 'This child does not belong to you' });
        }

        const payment = new Payment({
            studentId: childId,
            parentId: req.user._id,
            parentName: req.user.fullName,
            studentName: student.fullName,
            amount: parseInt(amount),
            term: term,
            method: method,
            reference: reference.trim(),
            status: 'Pending',
            paymentDate: new Date()
        });

        await payment.save();

        console.log(` Payment submitted: ${student.fullName} - Ksh ${amount} - ${term}`);

        res.status(201).json({
            message: 'Payment submitted successfully! Awaiting admin approval.',
            payment: {
                id: payment._id,
                amount: payment.amount,
                term: payment.term,
                method: payment.method,
                reference: payment.reference,
                status: payment.status,
                date: payment.paymentDate
            }
        });
    } catch (err) {
        console.error('❌ Error submitting payment:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// ============================================
// GET PAYMENT HISTORY (PARENT)
// ============================================
router.get('/payment-history', async (req, res) => {
    try {
        const payments = await Payment.find({ parentId: req.user._id })
            .populate('studentId', 'fullName')
            .sort({ paymentDate: -1 });

        res.json(payments);
    } catch (err) {
        console.error('Get payment history error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// GET EVENTS
// ============================================
router.get('/events', async (req, res) => {
    try {
        console.log("🚀 Fetching events for parent:", req.user.email);
        const events = await Event.find({ isActive: true }).sort({ startDate: 1 });
        console.log(`✅ Found ${events.length} events to return.`);
        res.json(events);
    } catch (err) {
        console.error('❌ Get events error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// GET DIARY
// ============================================
router.get('/diary', async (req, res) => {
    try {
        const diary = await Diary.find({ parentId: req.user._id }).sort({ date: -1 });
        res.json(diary);
    } catch (err) { 
        res.status(500).json({ message: 'Server error' }); 
    }
});

// ============================================
// GET TIMETABLE (Individual)
// ============================================
router.get('/timetable', async (req, res) => {
    try {
        const timetables = await Timetable.find({ parentId: req.user._id, isActive: true }).sort({ createdAt: -1 });
        res.json(timetables);
    } catch (err) { 
        res.status(500).json({ message: 'Server error' }); 
    }
});

// ============================================
// GET ASSIGNMENTS (Individual)
// ============================================
router.get('/assignments', async (req, res) => {
    try {
        const assignments = await Assignment.find({ parentId: req.user._id }).sort({ createdAt: -1 });
        res.json(assignments);
    } catch (err) { 
        res.status(500).json({ message: 'Server error' }); 
    }
});

// ============================================
// SUBMIT ASSIGNMENT (PARENT)
// ============================================
router.put('/assignment/:id/submit', async (req, res) => {
    try {
        const { submissionData, submissionType, submissionName } = req.body;
        
        const assignment = await Assignment.findOne({ _id: req.params.id, parentId: req.user._id });
        if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

        assignment.submissionData = submissionData;
        assignment.submissionType = submissionType;
        assignment.submissionName = submissionName;
        assignment.submittedAt = new Date();
        assignment.status = 'Submitted';

        await assignment.save();
        res.json({ message: 'Assignment submitted successfully', assignment });
    } catch (err) { 
        res.status(500).json({ message: 'Server error' }); 
    }
});

// ============================================
// VERIFY PAYSTACK SUBSCRIPTION
// ============================================
router.post('/verify-subscription', async (req, res) => {
    try {
        const { reference, studentId } = req.body;
        const student = await Student.findById(studentId);
        
        if (!student) return res.status(404).json({ message: 'Student not found' });
        if (student.parentId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Verify with Paystack
        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
            }
        });
        
        const data = await response.json();

        // If payment is successful and amount is 600 (Ksh 600 = 60000 kobo in Paystack)
        if (data.status && data.data.status === 'success' && data.data.amount >= 60000) {
            // Calculate expiry (e.g., 120 days for a term)
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 120); // Roughly 1 term

            student.subscriptionStatus = 'Active';
            student.subscriptionExpiry = expiryDate;
            student.subscriptionTerm = 'Current Term';
            await student.save();

            res.json({ message: 'Subscription activated!', student });
        } else {
            res.status(400).json({ message: 'Payment verification failed or incorrect amount' });
        }
    } catch (err) {
        console.error('❌ Paystack verify error:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;