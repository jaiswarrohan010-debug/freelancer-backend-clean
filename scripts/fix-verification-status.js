const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function fixVerificationStatus() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://rohan2467:jA8Yh7oJClHQmhED@cluster0.flvncgp.mongodb.net/people?retryWrites=true&w=majority&appName=Cluster0');
    console.log('Connected to MongoDB');

    // Find all users with 'approved' verification status
    const usersWithApprovedStatus = await User.find({ verificationStatus: 'approved' });
    console.log(`Found ${usersWithApprovedStatus.length} users with 'approved' status`);

    if (usersWithApprovedStatus.length === 0) {
      console.log('No users with invalid status found. Exiting...');
      return;
    }

    // Update all users with 'approved' status to 'verified'
    const updateResult = await User.updateMany(
      { verificationStatus: 'approved' },
      { 
        verificationStatus: 'verified',
        isVerified: true
      }
    );

    console.log(`Successfully updated ${updateResult.modifiedCount} users from 'approved' to 'verified'`);

    // Verify the changes
    const remainingApprovedUsers = await User.find({ verificationStatus: 'approved' });
    console.log(`Remaining users with 'approved' status: ${remainingApprovedUsers.length}`);

    const verifiedUsers = await User.find({ verificationStatus: 'verified' });
    console.log(`Total users with 'verified' status: ${verifiedUsers.length}`);

    console.log('Verification status fix completed successfully!');
  } catch (error) {
    console.error('Error fixing verification status:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
fixVerificationStatus();
