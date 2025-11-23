# Debug Checklist & Issues Fixed

## ✅ Issues Fixed

### 1. **Toaster Component Missing**
- **Issue**: Toast notifications weren't showing because Toaster component wasn't added to the app
- **Fix**: Added `<Toaster />` component to `main.jsx`
- **Status**: ✅ Fixed

### 2. **Login Error Handling**
- **Issue**: Login errors weren't properly caught and displayed
- **Fix**: Enhanced error handling in auth context and login page
- **Status**: ✅ Fixed

### 3. **Token Management**
- **Issue**: Refresh token not being stored
- **Fix**: Added refresh token storage in sessionStorage
- **Status**: ✅ Fixed

### 4. **Navigation After Login**
- **Issue**: No automatic navigation after successful login
- **Fix**: Added role-based navigation (admin/instructor → /instructor, student → /home)
- **Status**: ✅ Fixed

## ⚠️ Potential Issues to Check

### 1. **Environment Variables**
Make sure you have a `.env` file in the `server` directory with:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://localhost:27017/lms-learn
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=your-refresh-secret-key-here
JWT_REFRESH_EXPIRE=7d
```

### 2. **MongoDB Connection**
- Ensure MongoDB is running
- Check MONGO_URI is correct
- Database will auto-connect on server start

### 3. **Port Conflicts**
- Server runs on port 5000 (default)
- Client runs on port 5173 (Vite default)
- Check if ports are available

### 4. **Dependencies**
Run these if you see module errors:
```bash
cd server && npm install
cd client && npm install
```

## 🔍 How to Debug

### Server Issues
1. Check server console for errors
2. Verify MongoDB connection
3. Check environment variables
4. Look for missing dependencies

### Client Issues
1. Check browser console for errors
2. Check Network tab for API errors
3. Verify API base URL in `axiosInstance.js`
4. Check for CORS errors

### Common Errors

#### "Cannot find module"
- Run `npm install` in the affected directory

#### "MongoDB connection failed"
- Check MongoDB is running
- Verify MONGO_URI in .env

#### "JWT_SECRET is not defined"
- Add JWT_SECRET to server/.env

#### "CORS error"
- Check CLIENT_URL in server/.env matches client URL

#### "Port already in use"
- Change PORT in .env or kill the process using the port

## 🚀 Running the Application

### Start Server
```bash
cd server
npm run dev
```

### Start Client
```bash
cd client
npm run dev
```

### Initialize Database (First Time)
```bash
cd server
npm run init-db
```

This creates initial admin, user, and instructor accounts for testing.

## 📝 Testing Login

1. Use the admin account created by `init-db`:
   - Email: Check `server/scripts/init-db.js` for the email
   - Password: Check `server/scripts/init-db.js` for the password

2. Or create a new user via admin panel (if logged in as admin)

3. Check browser console and network tab for any errors

## 🐛 If Issues Persist

1. **Clear caches:**
   ```bash
   # Client
   cd client
   rm -rf node_modules/.vite
   
   # Server
   cd server
   rm -rf node_modules
   npm install
   ```

2. **Check logs:**
   - Server: Check terminal output
   - Client: Check browser console

3. **Verify all files are saved:**
   - Make sure all changes are saved
   - Restart both servers

4. **Database reset:**
   - If needed, drop and recreate database
   - Run `npm run init-db` again

