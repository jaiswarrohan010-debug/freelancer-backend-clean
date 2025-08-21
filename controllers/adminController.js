const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Verification = require('../models/Verification');
const Admin = require('../models/Admin');
const User = require('../models/User');

class AdminController {
    // Authentication
    async login(req, res) {
        try {
            const { username, password } = req.body;
            
            // Find admin user
            const admin = await Admin.findOne({ username });
            if (!admin) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Invalid credentials' 
                });
            }
            
            // Verify password
            const isValidPassword = await bcrypt.compare(password, admin.password);
            if (!isValidPassword) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Invalid credentials' 
                });
            }
            
            // Generate JWT token
            const token = jwt.sign(
                { id: admin._id, username: admin.username, role: 'admin' },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            res.json({
                success: true,
                token,
                user: {
                    id: admin._id,
                    username: admin.username,
                    role: 'admin'
                }
            });
        } catch (error) {
            console.error('Admin login error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Login failed' 
            });
        }
    }
    
    async logout(req, res) {
        // In a real app, you might want to blacklist the token
        res.json({ success: true, message: 'Logged out successfully' });
    }
    
    async verifyToken(req, res) {
        res.json({ success: true, user: req.user });
    }
    
    // Verification management
    async getAllVerifications(req, res) {
        try {
            const verifications = await Verification.find()
                .populate('userId', 'name email phone role')
                .sort({ createdAt: -1 });
            
            res.json({ success: true, verifications });
        } catch (error) {
            console.error('Get all verifications error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch verifications' 
            });
        }
    }
    
    async getPendingVerifications(req, res) {
        try {
            const verifications = await Verification.find({ status: 'pending' })
                .populate('userId', 'name email phone role')
                .sort({ createdAt: -1 });
            
            res.json({ success: true, verifications });
        } catch (error) {
            console.error('Get pending verifications error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch pending verifications' 
            });
        }
    }
    
    async getApprovedVerifications(req, res) {
        try {
            const verifications = await Verification.find({ status: 'approved' })
                .populate('userId', 'name email phone role')
                .populate('reviewedBy', 'username')
                .sort({ reviewedAt: -1 });
            
            res.json({ success: true, verifications });
        } catch (error) {
            console.error('Get approved verifications error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch approved verifications' 
            });
        }
    }
    
    async getRejectedVerifications(req, res) {
        try {
            const verifications = await Verification.find({ status: 'rejected' })
                .populate('userId', 'name email phone role')
                .populate('reviewedBy', 'username')
                .sort({ reviewedAt: -1 });
            
            res.json({ success: true, verifications });
        } catch (error) {
            console.error('Get rejected verifications error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch rejected verifications' 
            });
        }
    }
    
    async getVerificationById(req, res) {
        try {
            const verification = await Verification.findById(req.params.id)
                .populate('userId', 'name email phone role')
                .populate('reviewedBy', 'username');
                
            if (!verification) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Verification not found' 
                });
            }
            
            res.json({ success: true, verification });
        } catch (error) {
            console.error('Get verification by ID error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch verification' 
            });
        }
    }
    
    async approveVerification(req, res) {
        try {
            const { comments } = req.body;
            const verification = await Verification.findById(req.params.id);
            
            if (!verification) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Verification not found' 
                });
            }
            
            verification.status = 'approved';
            verification.reviewedAt = new Date();
            verification.reviewedBy = req.user.id;
            verification.comments = comments || 'Approved by admin';
            
            await verification.save();
            
            // Update user verification status
            await User.findByIdAndUpdate(verification.userId, {
                isVerified: true,
                verificationMethod: 'manual',
                verificationStatus: 'verified',
                verifiedAt: new Date()
            });
            
            res.json({ success: true, verification });
        } catch (error) {
            console.error('Approve verification error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to approve verification' 
            });
        }
    }
    
    async rejectVerification(req, res) {
        try {
            const { comments } = req.body;
            const verification = await Verification.findById(req.params.id);
            
            if (!verification) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Verification not found' 
                });
            }
            
            if (!comments) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Comments are required for rejection' 
                });
            }
            
            verification.status = 'rejected';
            verification.reviewedAt = new Date();
            verification.reviewedBy = req.user.id;
            verification.comments = comments;
            
            await verification.save();
            
            // Update user verification status
            await User.findByIdAndUpdate(verification.userId, {
                isVerified: false,
                verificationMethod: 'manual',
                verificationStatus: 'rejected',
                verifiedAt: new Date()
            });
            
            res.json({ success: true, verification });
        } catch (error) {
            console.error('Reject verification error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to reject verification' 
            });
        }
    }
    
    // Dashboard stats
    async getDashboardStats(req, res) {
        try {
            const totalVerifications = await Verification.countDocuments();
            const pendingVerifications = await Verification.countDocuments({ status: 'pending' });
            const approvedVerifications = await Verification.countDocuments({ status: 'approved' });
            const rejectedVerifications = await Verification.countDocuments({ status: 'rejected' });
            
            const totalUsers = await User.countDocuments({ role: 'freelancer' });
            const verifiedUsers = await User.countDocuments({ 
                role: 'freelancer', 
                isVerified: true 
            });
            
            res.json({
                success: true,
                stats: {
                    totalVerifications,
                    pendingVerifications,
                    approvedVerifications,
                    rejectedVerifications,
                    totalUsers,
                    verifiedUsers
                }
            });
        } catch (error) {
            console.error('Get dashboard stats error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch dashboard stats' 
            });
        }
    }
    
    // File upload
    async uploadDocument(req, res) {
        try {
            // Handle file upload logic here
            // You might want to use multer for file handling
            res.json({ success: true, documentId: 'uploaded-document-id' });
        } catch (error) {
            console.error('Upload document error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to upload document' 
            });
        }
    }
    
    async getDocument(req, res) {
        try {
            // Serve document file
            res.sendFile(`path/to/document/${req.params.id}`);
        } catch (error) {
            res.status(404).json({ 
                success: false, 
                message: 'Document not found' 
            });
        }
    }
}

module.exports = new AdminController();
