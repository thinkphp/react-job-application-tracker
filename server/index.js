import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Application, { applicationStatuses } from './models/Application.js';

const app = express();
const port = Number(process.env.PORT || 3001);
const cookieName = 'nextstep_session';
const sessionDuration = 7 * 24 * 60 * 60 * 1000;

if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI must be set in the environment.');
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be set to a random value of at least 32 characters.');
}

app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

const asyncHandler = (handler) => (request, response, next) =>
    Promise.resolve(handler(request, response, next)).catch(next);

const sessionCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api',
};

const createSession = (response, userId) => {
    const token = jwt.sign({ sub: userId.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });
    response.cookie(cookieName, token, { ...sessionCookieOptions, maxAge: sessionDuration });
};

const serializeUser = (user) => ({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
});

const serializeApplication = (application) => ({
    id: application._id.toString(),
    company: application.company,
    role: application.role,
    location: application.location || '',
    date: application.date.toISOString().slice(0, 10),
    status: application.status,
    createdAt: application.createdAt.getTime(),
});

const requireSession = (request, response, next) => {
    const token = request.cookies[cookieName];
    if (!token) return response.status(401).json({ message: 'Authentication required.' });

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        request.userId = payload.sub;
        return next();
    } catch {
        return response.status(401).json({ message: 'Authentication required.' });
    }
};

app.post('/api/auth/signup', asyncHandler(async (request, response) => {
    const body = request.body || {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!name || name.length > 80) return response.status(400).json({ message: 'Enter a name of up to 80 characters.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        return response.status(400).json({ message: 'Enter a valid email address.' });
    }
    if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
        return response.status(400).json({ message: 'Password must be at least 8 characters and no more than 72 bytes.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    createSession(response, user._id);
    return response.status(201).json({ user: serializeUser(user) });
}));

app.post('/api/auth/login', asyncHandler(async (request, response) => {
    const body = request.body || {};
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return response.status(401).json({ message: 'Email or password is incorrect.' });
    }

    createSession(response, user._id);
    return response.json({ user: serializeUser(user) });
}));

app.post('/api/auth/logout', (request, response) => {
    response.clearCookie(cookieName, sessionCookieOptions);
    return response.status(204).end();
});

app.get('/api/auth/me', requireSession, asyncHandler(async (request, response) => {
    const user = await User.findById(request.userId);
    if (!user) {
        response.clearCookie(cookieName, sessionCookieOptions);
        return response.status(401).json({ message: 'Authentication required.' });
    }
    return response.json({ user: serializeUser(user) });
}));

app.get('/api/applications', requireSession, asyncHandler(async (request, response) => {
    const applications = await Application.find({ user: request.userId }).sort({ createdAt: -1 });
    return response.json({ applications: applications.map(serializeApplication) });
}));

app.post('/api/applications', requireSession, asyncHandler(async (request, response) => {
    const { company, role, location = '', date, status = 'To apply' } = request.body || {};
    if (typeof company !== 'string' || !company.trim() || company.trim().length > 200) {
        return response.status(400).json({ message: 'Company is required and must be under 200 characters.' });
    }
    if (typeof role !== 'string' || !role.trim() || role.trim().length > 200) {
        return response.status(400).json({ message: 'Job title is required and must be under 200 characters.' });
    }
    if (typeof location !== 'string' || location.length > 200) {
        return response.status(400).json({ message: 'Location must be under 200 characters.' });
    }
    const parsedDate = typeof date === 'string' ? new Date(`${date}T12:00:00Z`) : null;
    if (
        typeof date !== 'string'
        || !/^\d{4}-\d{2}-\d{2}$/.test(date)
        || !parsedDate
        || Number.isNaN(parsedDate.getTime())
        || parsedDate.toISOString().slice(0, 10) !== date
    ) {
        return response.status(400).json({ message: 'Enter a valid application date.' });
    }
    if (!applicationStatuses.includes(status)) {
        return response.status(400).json({ message: 'Choose a valid application status.' });
    }

    const application = await Application.create({
        user: request.userId,
        company: company.trim(),
        role: role.trim(),
        location: location.trim(),
        date: parsedDate,
        status,
    });
    return response.status(201).json({ application: serializeApplication(application) });
}));

app.patch('/api/applications/:id', requireSession, asyncHandler(async (request, response) => {
    const { id } = request.params;
    const { status } = request.body || {};
    if (!mongoose.isValidObjectId(id)) return response.status(404).json({ message: 'Application not found.' });
    if (!applicationStatuses.includes(status)) {
        return response.status(400).json({ message: 'Choose a valid application status.' });
    }

    const application = await Application.findOneAndUpdate(
        { _id: id, user: request.userId },
        { status },
        { new: true, runValidators: true },
    );
    if (!application) return response.status(404).json({ message: 'Application not found.' });
    return response.json({ application: serializeApplication(application) });
}));

app.delete('/api/applications/:id', requireSession, asyncHandler(async (request, response) => {
    const { id } = request.params;
    if (!mongoose.isValidObjectId(id)) return response.status(404).json({ message: 'Application not found.' });

    const application = await Application.findOneAndDelete({ _id: id, user: request.userId });
    if (!application) return response.status(404).json({ message: 'Application not found.' });
    return response.status(204).end();
}));

app.use((error, request, response, next) => {
    if (response.headersSent) return next(error);
    if (error.code === 11000) {
        return response.status(409).json({ message: 'An account with this email already exists.' });
    }
    if (error.name === 'ValidationError' || error.name === 'CastError') {
        return response.status(400).json({ message: 'The submitted data is invalid.' });
    }
    console.error('API request failed:', error);
    return response.status(500).json({ message: 'An unexpected server error occurred.' });
});

await mongoose.connect(process.env.MONGODB_URI);
app.listen(port, () => console.log(`Nextstep API listening on port ${port}`));
