
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        maxlength: [60, 'Name cannot be more than 60 characters'],
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email',
        ],
    },
    password: {
        type: String,
        // Password is required for email signup (validated by Zod), but not for Google Auth
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true,
    },
    githubId: {
        type: String,
        unique: true,
        sparse: true,
    },
    image: {
        type: String,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    verifyToken: String,
    verifyTokenExpiry: Date,
    forgotPasswordToken: String,
    forgotPasswordTokenExpiry: Date,
    resetTokenHash: String,
    resetTokenExpiry: Date,
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
