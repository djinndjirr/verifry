import React, { useState, useEffect, createContext, useContext } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for session on page load
    checkAuth();
    
    // Check for auth redirect with session_id in URL fragment
    const hash = window.location.hash;
    if (hash.includes('session_id=')) {
      const sessionId = hash.split('session_id=')[1];
      handleAuthCallback(sessionId);
    }
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API}/users/me`, {
        withCredentials: true
      });
      setUser(response.data);
    } catch (error) {
      console.log('Not authenticated');
    }
    setLoading(false);
  };

  const handleAuthCallback = async (sessionId) => {
    try {
      const response = await axios.post(`${API}/auth/profile`, {}, {
        headers: { 'X-Session-ID': sessionId },
        withCredentials: true
      });
      
      setUser(response.data.user);
      
      // Clear the hash from URL
      window.location.hash = '';
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Auth callback failed:', error);
    }
  };

  const login = async () => {
    try {
      const response = await axios.get(`${API}/auth/login`);
      window.location.href = response.data.auth_url;
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Components
const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-red-600 text-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold flex items-center">
          🥩 MeatSafe Check
        </Link>
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <span className="text-sm">Welcome, {user.name}</span>
              {user.status === 'pending' && (
                <span className="bg-yellow-500 px-2 py-1 rounded text-xs">Pending Approval</span>
              )}
              {user.status === 'approved' && (
                <span className="bg-green-500 px-2 py-1 rounded text-xs">Approved</span>
              )}
              {user.email === 'admin@meatsafe.com' && (
                <Link to="/admin" className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700">
                  Admin
                </Link>
              )}
              <button onClick={logout} className="bg-red-700 px-3 py-1 rounded hover:bg-red-800">
                Logout
              </button>
            </>
          ) : (
            <div>Not logged in</div>
          )}
        </div>
      </div>
    </nav>
  );
};

const Home = () => {
  const { user, login } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            🥩 MeatSafe Check
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Comprehensive restaurant compliance platform for preventing meat cross-contamination. 
            Upload compliance photos and videos, complete training quizzes, and maintain food safety standards.
          </p>
          
          {!user && (
            <button
              onClick={login}
              className="bg-red-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Get Started - Restaurant Login
            </button>
          )}
          
          {user && user.status === 'approved' && (
            <Link
              to="/dashboard"
              className="bg-red-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-red-700 transition-colors inline-block"
            >
              Go to Dashboard
            </Link>
          )}
          
          {user && user.status === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Account Pending Approval</h3>
              <p className="text-yellow-700">
                Your account is waiting for admin approval. You'll receive access once approved.
              </p>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">📸</div>
            <h3 className="text-xl font-semibold mb-3">Compliance Documentation</h3>
            <p className="text-gray-600">
              Upload photos and videos showing proper meat handling, storage, and preparation procedures to maintain compliance records.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-3">Training Quizzes</h3>
            <p className="text-gray-600">
              Complete comprehensive quizzes covering meat cross-contamination prevention, food safety protocols, and best practices.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">✅</div>
            <h3 className="text-xl font-semibold mb-3">Admin Approval</h3>
            <p className="text-gray-600">
              Secure approval process ensures only verified restaurants access the platform and maintain compliance standards.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Choose MeatSafe Check?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">🛡️ Comprehensive Safety</h3>
              <p className="text-gray-600">Complete platform covering all aspects of meat cross-contamination prevention.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">📱 Easy Documentation</h3>
              <p className="text-gray-600">Simple photo and video upload system for compliance record keeping.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">🎓 Staff Training</h3>
              <p className="text-gray-600">Built-in quiz system ensures staff understand proper procedures.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">👨‍💼 Admin Oversight</h3>
              <p className="text-gray-600">Controlled access with admin approval for verified restaurants only.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Profile = () => {
  const { user, setUser } = useAuth();
  const [restaurantName, setRestaurantName] = useState(user?.restaurant_name || '');
  const [updating, setUpdating] = useState(false);

  const updateProfile = async () => {
    if (!restaurantName.trim()) return;
    
    setUpdating(true);
    try {
      const response = await axios.put(`${API}/users/me`, {
        restaurant_name: restaurantName
      }, { withCredentials: true });
      
      setUser(response.data);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
    }
    setUpdating(false);
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={user.name}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Restaurant Name
            </label>
            <input
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="Enter your restaurant name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Status
            </label>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              user.status === 'approved' ? 'bg-green-100 text-green-800' :
              user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
            </span>
          </div>
          
          <button
            onClick={updateProfile}
            disabled={updating || !restaurantName.trim()}
            className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {updating ? 'Updating...' : 'Update Profile'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" />;
  if (user.status !== 'approved') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Account Pending Approval</h1>
          <p className="text-gray-600 mb-8">
            Your account is waiting for admin approval. You'll receive access to all features once approved.
          </p>
          <Link to="/profile" className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700">
            Update Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/compliance" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <div className="text-3xl mb-4">📸</div>
          <h3 className="text-xl font-semibold mb-2">Compliance Uploads</h3>
          <p className="text-gray-600">Upload and manage compliance photos and videos</p>
        </Link>
        
        <Link to="/quiz" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <div className="text-3xl mb-4">📋</div>
          <h3 className="text-xl font-semibold mb-2">Training Quiz</h3>
          <p className="text-gray-600">Complete meat safety training quizzes</p>
        </Link>
        
        <Link to="/profile" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <div className="text-3xl mb-4">👤</div>
          <h3 className="text-xl font-semibold mb-2">Profile Settings</h3>
          <p className="text-gray-600">Manage your account and restaurant information</p>
        </Link>
      </div>
    </div>
  );
};

const ComplianceUploads = () => {
  const { user } = useAuth();
  const [uploads, setUploads] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (user && user.status === 'approved') {
      fetchUploads();
    }
  }, [user]);

  const fetchUploads = async () => {
    try {
      const response = await axios.get(`${API}/compliance/uploads`, {
        withCredentials: true
      });
      setUploads(response.data);
    } catch (error) {
      console.error('Failed to fetch uploads:', error);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('description', description);

    try {
      await axios.post(`${API}/compliance/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      
      setSelectedFile(null);
      setDescription('');
      fetchUploads();
      alert('File uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    }
    setUploading(false);
  };

  if (!user || user.status !== 'approved') {
    return <Navigate to="/" />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Compliance Uploads</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload New File</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select File (Images: JPG, PNG, GIF | Videos: MP4, MOV, AVI, WMV)
          </label>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.gif,.mp4,.mov,.avi,.wmv"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the compliance procedure shown..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md h-24 resize-none"
          />
        </div>
        
        <button
          onClick={handleFileUpload}
          disabled={!selectedFile || uploading}
          className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Your Uploads</h2>
        
        {uploads.length === 0 ? (
          <p className="text-gray-600">No uploads yet. Upload your first compliance file above.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploads.map((upload) => (
              <div key={upload.id} className="border rounded-lg p-4">
                <div className="text-2xl mb-2">
                  {upload.file_type === 'image' ? '🖼️' : '🎥'}
                </div>
                <h3 className="font-semibold text-sm mb-1">{upload.filename}</h3>
                <p className="text-xs text-gray-600 mb-2">
                  {new Date(upload.uploaded_at).toLocaleDateString()}
                </p>
                {upload.description && (
                  <p className="text-sm text-gray-700 mb-2">{upload.description}</p>
                )}
                <a
                  href={`${API}/compliance/file/${upload.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  View File →
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Quiz = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [showAttempts, setShowAttempts] = useState(false);

  useEffect(() => {
    if (user && user.status === 'approved') {
      fetchQuestions();
      fetchAttempts();
    }
  }, [user]);

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(`${API}/quiz/questions`, {
        withCredentials: true
      });
      setQuestions(response.data);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    }
  };

  const fetchAttempts = async () => {
    try {
      const response = await axios.get(`${API}/quiz/attempts`, {
        withCredentials: true
      });
      setAttempts(response.data);
    } catch (error) {
      console.error('Failed to fetch attempts:', error);
    }
  };

  const handleAnswerSelect = (questionId, selectedAnswer) => {
    setAnswers({
      ...answers,
      [questionId]: selectedAnswer
    });
  };

  const submitQuiz = async () => {
    const formattedAnswers = Object.entries(answers).map(([questionId, selectedAnswer]) => ({
      question_id: parseInt(questionId),
      selected_answer: selectedAnswer
    }));

    try {
      const response = await axios.post(`${API}/quiz/submit`, {
        answers: formattedAnswers
      }, { withCredentials: true });
      
      setQuizResult(response.data);
      setQuizCompleted(true);
      fetchAttempts();
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      alert('Failed to submit quiz. Please try again.');
    }
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setQuizCompleted(false);
    setQuizResult(null);
  };

  if (!user || user.status !== 'approved') {
    return <Navigate to="/" />;
  }

  if (quizCompleted && quizResult) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-6xl mb-4">
              {quizResult.passed ? '🎉' : '😔'}
            </div>
            <h1 className="text-3xl font-bold mb-4">
              {quizResult.passed ? 'Congratulations!' : 'Keep Learning!'}
            </h1>
            <p className="text-xl mb-6">
              You scored {quizResult.score} out of {quizResult.total_questions} 
              ({Math.round((quizResult.score / quizResult.total_questions) * 100)}%)
            </p>
            <p className="text-gray-600 mb-8">
              {quizResult.passed 
                ? 'You passed the meat safety training quiz!' 
                : 'You need 70% or higher to pass. Review the materials and try again.'}
            </p>
            <div className="space-x-4">
              <button
                onClick={restartQuiz}
                className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700"
              >
                Take Quiz Again
              </button>
              <button
                onClick={() => setShowAttempts(!showAttempts)}
                className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
              >
                View All Attempts
              </button>
            </div>
            
            {showAttempts && (
              <div className="mt-8 text-left">
                <h3 className="text-lg font-semibold mb-4">Previous Attempts</h3>
                <div className="space-y-2">
                  {attempts.map((attempt, index) => (
                    <div key={attempt.id} className="border rounded p-3">
                      <div className="flex justify-between items-center">
                        <span>Attempt #{attempts.length - index}</span>
                        <span className={`px-2 py-1 rounded text-sm ${
                          attempt.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {attempt.score}/{attempt.total_questions} ({Math.round((attempt.score / attempt.total_questions) * 100)}%)
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(attempt.completed_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Meat Safety Training Quiz</h1>
        <p className="text-gray-600 mb-8">Complete this quiz to demonstrate your understanding of meat cross-contamination prevention.</p>
        
        {questions.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-600">
                  Question {currentQuestion + 1} of {questions.length}
                </span>
                <div className="w-48 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <h2 className="text-xl font-semibold mb-4">
                {questions[currentQuestion]?.question}
              </h2>
              
              <div className="space-y-3">
                {questions[currentQuestion]?.options.map((option, index) => (
                  <label key={index} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name={`question-${questions[currentQuestion].id}`}
                      value={index}
                      checked={answers[questions[currentQuestion].id] === index}
                      onChange={() => handleAnswerSelect(questions[currentQuestion].id, index)}
                      className="mr-3"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {currentQuestion === questions.length - 1 ? (
                <button
                  onClick={submitQuiz}
                  disabled={Object.keys(answers).length !== questions.length}
                  className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Submit Quiz
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
                  disabled={answers[questions[currentQuestion].id] === undefined}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminPanel = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.email === 'admin@meatsafe.com') {
      fetchUsers();
      fetchAnalytics();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/admin/users`, {
        withCredentials: true
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/admin/analytics`, {
        withCredentials: true
      });
      setAnalytics(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId, status) => {
    try {
      await axios.put(`${API}/admin/users/${userId}`, {
        status: status,
        approved_by: user.id
      }, { withCredentials: true });
      
      fetchUsers();
      alert(`User ${status} successfully!`);
    } catch (error) {
      console.error('Failed to update user status:', error);
      alert('Failed to update user status');
    }
  };

  if (!user || user.email !== 'admin@meatsafe.com') {
    return <Navigate to="/" />;
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>
      
      {analytics && (
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Users</h3>
            <div className="space-y-1">
              <p>Total: {analytics.users.total}</p>
              <p>Pending: {analytics.users.pending}</p>
              <p>Approved: {analytics.users.approved}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Uploads</h3>
            <div className="space-y-1">
              <p>Total: {analytics.uploads.total}</p>
              <p>Images: {analytics.uploads.images}</p>
              <p>Videos: {analytics.uploads.videos}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Quiz Performance</h3>
            <div className="space-y-1">
              <p>Total Attempts: {analytics.quiz.total_attempts}</p>
              <p>Passed: {analytics.quiz.passed_attempts}</p>
              <p>Pass Rate: {analytics.quiz.pass_rate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">User Management</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Email</th>
                <th className="text-left py-2">Restaurant</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Created</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b">
                  <td className="py-2">{user.name}</td>
                  <td className="py-2">{user.email}</td>
                  <td className="py-2">{user.restaurant_name}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === 'approved' ? 'bg-green-100 text-green-800' :
                      user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-2">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="py-2">
                    <div className="space-x-2">
                      {user.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateUserStatus(user.id, 'approved')}
                            className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateUserStatus(user.id, 'rejected')}
                            className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {user.status === 'approved' && (
                        <button
                          onClick={() => updateUserStatus(user.id, 'rejected')}
                          className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                        >
                          Suspend
                        </button>
                      )}
                      {user.status === 'rejected' && (
                        <button
                          onClick={() => updateUserStatus(user.id, 'approved')}
                          className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children, requireApproval = true }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  if (requireApproval && user.status !== 'approved') {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <div className="App min-h-screen bg-gray-50">
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/compliance" element={
              <ProtectedRoute>
                <ComplianceUploads />
              </ProtectedRoute>
            } />
            <Route path="/quiz" element={
              <ProtectedRoute>
                <Quiz />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}

export default App;