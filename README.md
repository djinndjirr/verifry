# 🥩 MeatSafe Check - Restaurant Compliance Platform

A comprehensive web application for preventing meat cross-contamination in restaurants with photo/video uploads, training quizzes, and admin approval workflow.

![MeatSafe Check](https://img.shields.io/badge/Status-Production%20Ready-green) ![React](https://img.shields.io/badge/React-19.0.0-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.110.1-green) ![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green)

## ✨ Features

### 🔐 Authentication & Security
- **Emergent Managed Authentication** - Hassle-free Google OAuth login
- **Admin Approval Workflow** - New users require admin approval
- **Session Management** - 7-day session expiry with secure cookies
- **Role-based Access Control** - Admin and user permissions

### 📸 Compliance Documentation
- **Photo & Video Uploads** - Support for JPG, PNG, GIF, MP4, MOV, AVI, WMV
- **File Validation** - Automatic file type detection and validation
- **Metadata Tracking** - Upload timestamps, descriptions, and user tracking
- **Secure File Storage** - Local storage with unique filenames

### 📋 Training System
- **Interactive Quizzes** - 8 comprehensive meat safety questions
- **Progress Tracking** - Question navigation with progress bar
- **Scoring System** - 70% pass threshold (6/8 questions correct)
- **Attempt History** - Track all quiz attempts with results

### 👨‍💼 Admin Panel
- **User Management** - Approve, reject, or suspend user accounts
- **Analytics Dashboard** - User statistics, upload metrics, quiz performance
- **Content Oversight** - View all uploaded compliance files
- **System Monitoring** - Track platform usage and performance

## 🏗️ Architecture

```
meatsafe-check/
├── backend/                 # FastAPI Python backend
│   ├── server.py           # Main application file
│   ├── requirements.txt    # Python dependencies
│   ├── .env               # Environment variables
│   └── uploads/           # File storage directory
├── frontend/               # React frontend
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   ├── App.css        # Tailwind styles
│   │   └── index.js       # Entry point
│   ├── package.json       # Node.js dependencies
│   ├── tailwind.config.js # Tailwind configuration
│   └── .env              # Frontend environment variables
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB 5.0+
- Yarn package manager

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd meatsafe-check/backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB connection details
   ```

5. **Start the backend server**
   ```bash
   uvicorn server:app --host 0.0.0.0 --port 8001 --reload
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your backend URL
   ```

4. **Start the development server**
   ```bash
   yarn start
   ```

The application will be available at `http://localhost:3000`

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="meatsafe_check"
CORS_ORIGINS="http://localhost:3000,https://yourdomain.com"
```

**Frontend (.env)**
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

### Database Setup

The application will automatically create the required MongoDB collections:
- `users` - User accounts and profiles
- `sessions` - Authentication sessions
- `compliance_uploads` - File upload metadata
- `quiz_attempts` - Quiz results and history

### Admin Account

To create an admin account, register with the email `admin@meatsafe.com` and you'll have admin privileges.

## 📚 API Documentation

### Authentication Endpoints
- `GET /api/auth/login` - Get login redirect URL
- `POST /api/auth/profile` - Create user profile from session

### User Management
- `GET /api/users/me` - Get current user info
- `PUT /api/users/me` - Update user profile
- `GET /api/admin/users` - List all users (admin only)
- `PUT /api/admin/users/{user_id}` - Update user status (admin only)

### File Upload
- `POST /api/compliance/upload` - Upload compliance file
- `GET /api/compliance/uploads` - List user's uploads
- `GET /api/compliance/file/{file_id}` - Download file

### Quiz System
- `GET /api/quiz/questions` - Get quiz questions
- `POST /api/quiz/submit` - Submit quiz answers
- `GET /api/quiz/attempts` - Get user's quiz history

### Admin Analytics
- `GET /api/admin/analytics` - Get platform statistics

## 🎨 Design System

### Color Scheme
- **Primary Green**: `#059669` (green-600)
- **Secondary Grey**: `#6B7280` (gray-500)
- **Background**: `#F9FAFB` (gray-50)
- **Success**: `#10B981` (emerald-500)
- **Warning**: `#F59E0B` (amber-500)
- **Error**: `#EF4444` (red-500)

### Typography
- **Headings**: Inter font family, bold weights
- **Body**: Inter font family, regular weight
- **Code**: Menlo, Monaco, monospace

## 🧪 Testing

### Backend Testing
```bash
cd backend
python -c "import requests; print(requests.get('http://localhost:8001/api/').json())"
```

### Frontend Testing
```bash
cd frontend
yarn test
```

## 🚀 Deployment

### Production Environment Variables

**Backend**
```env
MONGO_URL="mongodb://your-mongo-host:27017/meatsafe_production"
DB_NAME="meatsafe_production"
CORS_ORIGINS="https://yourdomain.com"
```

**Frontend**
```env
REACT_APP_BACKEND_URL=https://api.yourdomain.com
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Quiz Questions

The system includes 8 comprehensive meat safety questions covering:
- Cross-contamination prevention
- Proper food storage temperatures
- Hand washing procedures
- Equipment sanitization
- Safe food handling practices

## 🔒 Security Features

- **Input Validation** - All user inputs are validated and sanitized
- **File Upload Security** - File type validation and secure storage
- **Authentication Protection** - All endpoints require proper authentication
- **Admin Authorization** - Administrative functions require admin role
- **Session Management** - Secure session handling with expiration

## 📊 Analytics & Monitoring

The admin panel provides insights into:
- User registration and approval rates
- File upload statistics (images vs videos)
- Quiz performance and pass rates
- Platform usage metrics

## 🐛 Troubleshooting

### Common Issues

**Backend won't start**
- Check MongoDB connection
- Verify Python dependencies are installed
- Check port 8001 is not in use

**Frontend won't load**
- Verify backend is running
- Check REACT_APP_BACKEND_URL in .env
- Clear browser cache

**File uploads failing**
- Check uploads directory exists and is writable
- Verify file size limits
- Check file type restrictions

## 📞 Support

For support and questions:
- Create an issue in this repository
- Check the documentation above
- Review the code comments for implementation details

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎯 Roadmap

- [ ] Email notifications for admin approvals
- [ ] Advanced file organization and tagging
- [ ] Mobile app companion
- [ ] Integration with restaurant POS systems
- [ ] Advanced analytics and reporting
- [ ] Multi-language support

---

**Built with ❤️ for restaurant food safety compliance**

🥩 **MeatSafe Check** - Ensuring safer kitchens, one restaurant at a time.
