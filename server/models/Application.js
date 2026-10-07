import mongoose from 'mongoose';

export const applicationStatuses = ['To apply', 'Applied', 'Interview', 'Offer', 'Rejected'];

const applicationSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        company: { type: String, required: true, trim: true, maxlength: 200 },
        role: { type: String, required: true, trim: true, maxlength: 200 },
        location: { type: String, trim: true, maxlength: 200, default: '' },
        date: { type: Date, required: true },
        status: { type: String, enum: applicationStatuses, required: true, default: 'To apply' },
    },
    { timestamps: true },
);

export default mongoose.model('Application', applicationSchema);
