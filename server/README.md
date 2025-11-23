# Professional LMS Backend API

## Overview
A comprehensive Learning Management System backend built with Node.js, Express, and MongoDB.

## Features

### Authentication & Authorization
- JWT-based authentication with access and refresh tokens
- Role-based access control (Admin, Instructor, Student)
- Password reset functionality
- Profile management
- Secure password hashing with bcrypt

### Database
- Professional MongoDB connection with:
  - Connection pooling
  - Automatic reconnection
  - Health checks
  - Error handling
  - Graceful shutdown

### Middleware
- Request logging
- Input validation
- Error handling
- Authentication middleware
- Admin authorization middleware

### APIs

#### Authentication (`/auth`)
- `POST /auth/register` - Register new user (Admin only)
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user
- `GET /auth/me` - Get current user
- `PUT /auth/profile` - Update profile
- `PUT /auth/change-password` - Change password
- `POST /auth/forgot-password` - Request password reset
- `PUT /auth/reset-password` - Reset password
- `GET /auth/check-auth` - Check authentication status

#### Admin (`/admin`)
- `GET /admin/dashboard/stats` - Get dashboard statistics
- `GET /admin/users` - Get all users (with pagination, filters)
- `GET /admin/users/:id` - Get user by ID
- `PUT /admin/users/:id` - Update user
- `DELETE /admin/users/:id` - Delete/deactivate user
- `GET /admin/courses` - Get all courses (with filters)

#### Instructor (`/instructor/course`)
- `GET /instructor/course/stats` - Get instructor statistics
- `POST /instructor/course/add` - Create new course
- `GET /instructor/course/get` - Get all instructor courses
- `GET /instructor/course/get/details/:id` - Get course details
- `PUT /instructor/course/update/:id` - Update course
- `DELETE /instructor/course/delete/:id` - Delete course
- `PATCH /instructor/course/publish/:id` - Publish/unpublish course

#### Student (`/student/course`)
- `GET /student/course/get` - Get all published courses (with filters, search, pagination)
- `GET /student/course/get/details/:id` - Get course details
- `GET /student/course/featured` - Get featured courses
- `GET /student/course/category/:category` - Get courses by category
- `GET /student/course/purchase-info/:courseId/:studentId` - Check purchase info

## Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database
MONGO_URI=mongodb://localhost:27017/lms-learn

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=your-refresh-secret-key-here
JWT_REFRESH_EXPIRE=7d

# Payment (if using)
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_PUBLIC_KEY=your-stripe-public-key
```

## Models

### User
- Authentication fields
- Profile information
- Role management
- Account status

### Course
- Course information
- Curriculum (lectures)
- Student enrollment
- Ratings and reviews
- Publishing status

### Order
- Payment information
- Order status
- Course purchase details

### CourseProgress
- Student progress tracking
- Lecture completion
- Course completion status

### StudentCourses
- Student's enrolled courses
- Purchase history

## Error Handling

All errors are handled consistently:
```json
{
  "success": false,
  "message": "Error message",
  "errors": ["Detailed error messages"] // Optional
}
```

## Success Response

All successful responses follow this format:
```json
{
  "success": true,
  "message": "Success message",
  "data": {
    // Response data
  }
}
```

## Pagination

Pagination is supported on list endpoints:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

Response includes pagination metadata:
```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

## Health Check

`GET /health` - Check database and server health

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (create `.env` file)

3. Initialize database:
```bash
npm run init-db
```

4. Start server:
```bash
npm start
# or for development
npm run dev
```

## Security Features

- Password hashing with bcrypt (12 rounds)
- JWT token authentication
- Role-based access control
- Input validation
- SQL injection prevention (MongoDB)
- XSS protection
- CORS configuration

## Best Practices

- All async operations use asyncHandler
- Consistent error handling
- Request logging
- Input validation
- Proper HTTP status codes
- RESTful API design

