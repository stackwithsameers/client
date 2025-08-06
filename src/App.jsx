import React, { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, Link, Navigate, useParams } from 'react-router-dom';

// Tailwind CSS script for styling
const tailwindScript = document.createElement('script');
tailwindScript.src = 'https://cdn.tailwindcss.com';
document.head.appendChild(tailwindScript);

// Add Inter font
const interFont = document.createElement('link');
interFont.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap';
interFont.rel = 'stylesheet';
document.head.appendChild(interFont);

// --- API endpoint URL ---
const API_URL = 'http://localhost:5000/api/issues';
const AUTH_URL = 'http://localhost:5000/api/auth';

// --- Contexts for State Management ---
const AuthContext = createContext();
const IssueContext = createContext();

// --- Custom Hooks ---
const useAuth = () => useContext(AuthContext);
const useIssues = () => useContext(IssueContext);

// --- Component: Spinner for loading state ---
const Spinner = () => (
  <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
    <div
      className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  </div>
);

// --- Component: Custom Modal (replaces window.confirm) ---
const Modal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex justify-end space-x-4">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm}>Confirm</Button>
        </div>
      </div>
    </div>
  );
};

// --- Component: Reusable Button ---
const Button = ({ children, onClick, type = 'button', variant = 'primary', className = '', disabled = false }) => {
  const baseStyle = 'px-4 py-2 rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-opacity-75 transition-all duration-200';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-300 text-gray-800 hover:bg-gray-400 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyle} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// --- Component: Navbar ---
const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <nav className="bg-gray-800 text-white p-4 shadow-md fixed w-full z-10 top-0">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">
          <span className="text-blue-400">🔥</span> Issue Tracker
        </Link>
        <div className="space-x-4 flex items-center">
          {user ? (
            <>
              <Link to="/" className="hover:text-blue-300">Dashboard</Link>
              {user.role === 'customer' && (
                <Link to="/issues/new" className="hover:text-blue-300">Report Issue</Link>
              )}
              <span className="text-sm px-2 py-1 rounded-md bg-gray-700">
                👤 {user.username} ({user.role})
              </span>
              <Button onClick={handleLogout} variant="danger" className="text-sm">
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-blue-300">Login</Link>
              <Link to="/register" className="hover:text-blue-300">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

// --- Component: Private Route Wrapper ---
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? children : <Navigate to="/login" replace />;
};

// --- Component: Issue Card ---
const IssueCard = ({ issue }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'CLOSED': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200">
      <Link to={`/issues/${issue.id}`} className="block">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">{issue.title}</h3>
      </Link>
      <div className="flex justify-between items-center mb-2">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(issue.status)}`}>
          {issue.status.replace('_', ' ')}
        </span>
        <span className="text-sm text-gray-500">
          Created: {new Date(issue.createdAt).toLocaleDateString()}
        </span>
      </div>
      <p className="text-sm text-gray-600 line-clamp-2">{issue.description || 'No description provided.'}</p>
      <div className="mt-3 text-sm text-gray-500">
        Reported by: {issue.username || 'N/A'} at {issue.location || 'N/A'}
      </div>
    </div>
  );
};

// --- Component: Issue List ---
const IssueList = ({ issues, title, emptyMessage }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold mb-4 border-b pb-2 text-gray-800">{title}</h2>
      {issues.length === 0 ? (
        <p className="text-gray-600 italic">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      )}
    </div>
  );
};

// --- Component: Issue Form ---
const IssueForm = ({ onSubmit, initialData = {}, isEditMode = false, loading = false, error = null }) => {
  const { user } = useAuth();
  const isTechnician = user?.role === 'technician';
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    department: '',
    status: 'OPEN',
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        location: initialData.location || '',
        department: initialData.department || '',
        status: initialData.status || 'OPEN',
      });
    }
  }, [initialData, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
    setFormErrors((prevErrors) => ({ ...prevErrors, [name]: undefined }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Title is required.';
    if (!formData.location.trim()) errors.location = 'Location is required.';
    if (!formData.department.trim()) errors.department = 'Department is required.';
    if (!formData.status) errors.status = 'Status is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">{isEditMode ? 'Edit Issue' : 'Report New Issue'}</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">Title:</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${formErrors.title ? 'border-red-500' : ''}`}
          placeholder="e.g., Forklift not starting"
          maxLength="100"
        />
        {formErrors.title && <p className="text-red-500 text-xs italic mt-1">{formErrors.title}</p>}
      </div>

      <div className="mb-4">
        <label htmlFor="location" className="block text-gray-700 text-sm font-bold mb-2">Location:</label>
        <input
          type="text"
          id="location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${formErrors.location ? 'border-red-500' : ''}`}
          placeholder="e.g., Aisle 7, Shelf B3"
          maxLength="100"
        />
        {formErrors.location && <p className="text-red-500 text-xs italic mt-1">{formErrors.location}</p>}
      </div>

      <div className="mb-4">
        <label htmlFor="department" className="block text-gray-700 text-sm font-bold mb-2">Department:</label>
        <input
          type="text"
          id="department"
          name="department"
          value={formData.department}
          onChange={handleChange}
          className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${formErrors.department ? 'border-red-500' : ''}`}
          placeholder="e.g., IT, Maintenance"
          maxLength="100"
        />
        {formErrors.department && <p className="text-red-500 text-xs italic mt-1">{formErrors.department}</p>}
      </div>

      <div className="mb-4">
        <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Description:</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="5"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="Provide detailed steps to reproduce, expected behavior, etc."
        ></textarea>
      </div>

      {isTechnician && (
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">Status:</label>
          <div className="flex flex-wrap gap-4">
            {['OPEN', 'IN_PROGRESS', 'CLOSED'].map((statusOption) => (
              <label key={statusOption} className="inline-flex items-center">
                <input
                  type="radio"
                  name="status"
                  value={statusOption}
                  checked={formData.status === statusOption}
                  onChange={handleChange}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-gray-700">{statusOption.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
          {formErrors.status && <p className="text-red-500 text-xs italic mt-1">{formErrors.status}</p>}
        </div>
      )}
      

      <div className="flex items-center justify-between mt-6">
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? <Spinner /> : (isEditMode ? 'Update Issue' : 'Submit Issue')}
        </Button>
        <Button type="button" variant="secondary" onClick={() => window.history.back()} disabled={loading}>
          Cancel
        </Button>
        
      </div>
    </form>
  );
};

// --- Page: Dashboard ---
const DashboardPage = () => {
  const { user } = useAuth();
  const { issues, loading, error } = useIssues();

  const openIssues = useMemo(() => issues.filter(issue => issue.status === 'OPEN'), [issues]);
  const inProgressIssues = useMemo(() => issues.filter(issue => issue.status === 'IN_PROGRESS'), [issues]);
  const closedIssues = useMemo(() => issues.filter(issue => issue.status === 'CLOSED'), [issues]);

  const recentIssues = useMemo(() => [...issues].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5), [issues]);

  if (loading) return <Spinner />;
  if (error) return <div className="text-red-500 text-center mt-8">Error: {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Issue Tracker Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-500 text-white p-6 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-semibold mb-2">🟢 Open Issues</h2>
          <p className="text-4xl font-bold">{openIssues.length}</p>
        </div>
        <div className="bg-yellow-500 text-white p-6 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-semibold mb-2">🟡 In Progress</h2>
          <p className="text-4xl font-bold">{inProgressIssues.length}</p>
        </div>
        <div className="bg-green-500 text-white p-6 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-semibold mb-2">🔴 Closed Issues</h2>
          <p className="text-4xl font-bold">{closedIssues.length}</p>
        </div>
      </div>

      {user?.role === 'customer' && (
        <div className="text-center mb-8">
          <Link to="/issues/new">
            <Button variant="primary" className="text-lg px-6 py-3">➕ Report New Issue</Button>
          </Link>
        </div>
      )}

      <IssueList
        issues={recentIssues}
        title="Recent Issues"
        emptyMessage="No recent issues to display."
      />
    </div>
  );
};


// --- Page: Issue Details ---
const IssueDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { issues, loading, error, updateIssue, deleteIssue } = useIssues();

  const [isEditing, setIsEditing] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const issue = useMemo(() => issues.find(i => String(i.id) === id), [issues, id]);

  const handleUpdateIssue = async (updatedData) => {
    setSubmissionError(null);
    const result = await updateIssue(id, updatedData);
    if (result.success) {
      setIsEditing(false);
    } else {
      setSubmissionError(result.error);
    }
  };

  const handleConfirmDelete = async () => {
    setIsModalOpen(false);
    const result = await deleteIssue(id);
    if (result.success) {
      navigate('/');
    } else {
      setSubmissionError(result.error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-200 text-blue-800';
      case 'IN_PROGRESS': return 'bg-yellow-200 text-yellow-800';
      case 'CLOSED': return 'bg-green-200 text-green-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  if (loading) return <Spinner />;
  if (error) return <div className="text-red-500 text-center mt-8">Error: {error}</div>;
  if (!issue) return <div className="text-center mt-8">Issue not found.</div>;

  const isReporter = user && String(user.id) === String(issue.userId);
  const isTechnician = user?.role === 'technician';

  return (
    <div className="p-4">
      <Button variant="secondary" onClick={() => navigate('/')} className="mb-4">
        &larr; Back to Dashboard
      </Button>
      {isEditing && (isReporter || isTechnician) ? (
        <IssueForm initialData={issue} isEditMode={true} onSubmit={handleUpdateIssue} loading={loading} error={submissionError} />
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{issue.title}</h1>
          <div className="flex flex-wrap gap-4 mb-4 text-sm">
            <span className={`px-3 py-1 rounded-full ${getStatusColor(issue.status)} font-semibold`}>
              {issue.status.replace('_', ' ')}
            </span>
            <span className="text-gray-600">Department: <span className="font-medium">{issue.department || 'N/A'}</span></span>
            <span className="text-gray-600">Created At: {new Date(issue.createdAt).toLocaleString()}</span>
          </div>
          <div className="mb-4 text-gray-600">
            <p>Reported By: <span className="font-medium">{issue.username || 'N/A'}</span></p>
            <p>Email: <span className="font-medium">{issue.user_email || 'N/A'}</span></p>
            <p>Phone Number: <span className="font-medium">{issue.user_phone_number || 'N/A'}</span></p>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">Description:</h2>
          <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-md border border-gray-200">
            {issue.description || 'No description provided for this issue.'}
          </p>
          {(isReporter || isTechnician) && (
            <div className="mt-8 flex space-x-4">
              <Button variant="primary" onClick={() => setIsEditing(true)}>Edit</Button>
              {isReporter && (
                <Button variant="danger" onClick={() => setIsModalOpen(true)}>Delete</Button>
              )}
            </div>
          )}
          {submissionError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">
              <strong className="font-bold">Error:</strong>
              <span className="block sm:inline"> {submissionError}</span>
            </div>
          )}
        </div>
      )}
      <Modal 
        isOpen={isModalOpen}
        title="Confirm Deletion"
        message="Are you sure you want to delete this issue? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsModalOpen(false)}
      />
    </div>
  );
};


// --- Page: New Issue ---
const NewIssuePage = () => {
  const navigate = useNavigate();
  const { addIssue, loading } = useIssues();
  const [submissionError, setSubmissionError] = useState(null);

  const handleSubmit = async (issueData) => {
    setSubmissionError(null);
    const result = await addIssue(issueData);
    if (result.success) {
      navigate('/');
    } else {
      setSubmissionError(result.error);
    }
  };

  return (
    <div className="p-4">
      <Button variant="secondary" onClick={() => navigate('/')} className="mb-4">
        &larr; Back to Dashboard
      </Button>
      <IssueForm
        onSubmit={handleSubmit}
        loading={loading}
        error={submissionError}
      />
    </div>
  );
};

// --- Page: Login ---
const LoginPage = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!credentials.email || !credentials.password) {
      setError('Please fill in both email and password.');
      setLoading(false);
      return;
    }

    const result = await login(credentials.email, credentials.password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Login failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] py-12">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-200">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Login to Issue Tracker</h2>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">Oops!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={credentials.email}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="your.email@example.com"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="********"
            />
          </div>
          <div className="flex items-center justify-between">
            <Button type="submit" variant="primary" disabled={loading} className="w-full">
              {loading ? <Spinner /> : 'Login'}
            </Button>
          </div>
        </form>
        <p className="text-center text-gray-600 text-sm mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline font-semibold">Register here</Link>
        </p>
      </div>
    </div>
  );
};

// --- Page: Register ---
const RegisterPage = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '', phone_number: '', role: 'customer' });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword || !formData.phone_number || !formData.role) {
        setError('All fields are required.');
        setLoading(false);
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long.');
        setLoading(false);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match.');
        setLoading(false);
        return;
      }

      const result = await register(formData.username, formData.email, formData.password, formData.phone_number, formData.role);
      if (result.success) {
        setSuccess('Registration successful! You can now log in.');
        setFormData({ username: '', email: '', password: '', confirmPassword: '', phone_number: '', role: 'customer' });
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
      setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] py-12">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-200">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Register for Issue Tracker</h2>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">Success!</strong>
              <span className="block sm:inline"> {success}</span>
            </div>
          )}
          <div className="mb-4">
            <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">Username:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="johndoe"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="john@example.com"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="phone_number" className="block text-gray-700 text-sm font-bold mb-2">Phone Number:</label>
            <input
              type="text"
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="e.g., +15551234567"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="********"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-bold mb-2">Confirm Password:</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="********"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Role:</label>
            <div className="flex flex-wrap gap-4">
              {['customer', 'technician'].map((roleOption) => (
                <label key={roleOption} className="inline-flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value={roleOption}
                    checked={formData.role === roleOption}
                    onChange={handleChange}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-gray-700">{roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Button type="submit" variant="primary" disabled={loading} className="w-full">
              {loading ? <Spinner /> : 'Register'}
            </Button>
          </div>
        </form>
        <p className="text-center text-gray-600 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-semibold">Login here</Link>
        </p>
      </div>
    </div>
  );
};

// --- AuthProvider Component ---
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const now = Date.now() / 1000;
        if (decoded.exp > now) {
          setUser({ id: decoded.id, username: decoded.username, email: decoded.email, phone_number: decoded.phone_number, role: decoded.role });
        } else {
          localStorage.removeItem('token');
        }
      } catch (err) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await fetch(`${AUTH_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const register = useCallback(async (username, email, password, phone_number, role) => {
    try {
      const response = await fetch(`${AUTH_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, phone_number, role }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// --- IssueProvider Component ---
const IssueProvider = ({ children }) => {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchIssues = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIssues([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(API_URL, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch issues');

        let issuesList = await response.json();
        
        setIssues(issuesList);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch issues:", err);
        setError('Failed to load issues.');
        setLoading(false);
      }
    };
    fetchIssues();
  }, [user]);


  const addIssue = useCallback(async (issueData) => {
    const token = localStorage.getItem('token');
    try {
      if (!user) throw new Error('User not authenticated.');
      const newIssueData = { ...issueData };
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newIssueData),
      });

      if (!response.ok) throw new Error('Failed to add issue.');
      return { success: true };
    } catch (err) {
      console.error('Error adding issue:', err);
      return { success: false, error: err.message };
    }
  }, [user]);

  const updateIssue = useCallback(async (id, updatedData) => {
    const token = localStorage.getItem('token');
    try {
      if (!user) throw new Error('User not authenticated.');
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) throw new Error('Failed to update issue.');
      return { success: true };
    } catch (err) {
      console.error('Error updating issue:', err);
      return { success: false, error: err.message };
    }
  }, [user]);

  const deleteIssue = useCallback(async (id) => {
    const token = localStorage.getItem('token');
    try {
      if (!user) throw new Error('User not authenticated.');
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete issue.');
      return { success: true };
    } catch (err) {
      console.error('Error deleting issue:', err);
      return { success: false, error: err.message };
    }
  }, [user]);
  
  const value = useMemo(() => ({ issues, loading, error, addIssue, updateIssue, deleteIssue }), [issues, loading, error, addIssue, updateIssue, deleteIssue]);

  return (
    <IssueContext.Provider value={value}>
      {children}
    </IssueContext.Provider>
  );
};


// --- App: Main Application Wrapper ---
export default function App() {
  return (
    <Router>
      <AuthProvider>
        <IssueProvider>
          <Navbar />
          <div className="container mx-auto p-4 mt-16 font-[Inter]">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
              <Route path="/issues/new" element={<PrivateRoute><NewIssuePage /></PrivateRoute>} />
              <Route path="/issues/:id" element={<PrivateRoute><IssueDetailsPage /></PrivateRoute>} />
            </Routes>
          </div>
        </IssueProvider>
      </AuthProvider>
    </Router>
  );
}
