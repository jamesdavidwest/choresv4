import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import database from '../../data/database.json';

// Use actual data from database
const LOCATIONS = database.locations.map(location => location.name);
const FREQUENCIES = database.frequency_types.map(freq => freq.name.charAt(0).toUpperCase() + freq.name.slice(1));
const USERS = database.users.filter(user => user.role !== 'SYSTEM').map(user => user.name);

const ChoreForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = !!id;

  // Role-based access check
  useEffect(() => {
    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    frequency: '',
    assignedUser: '',
    description: '',
    specificYearlyDate: null
  });

  // Validation state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate month options
  const monthOptions = Array.from({length: 12}, (_, i) => ({
    value: i,
    label: new Date(0, i).toLocaleString('default', { month: 'long' })
  }));

  // Generate day options (1-31)
  const dayOptions = Array.from({length: 31}, (_, i) => i + 1);

  // Load existing chore data in edit mode
  useEffect(() => {
    const fetchChoreData = async () => {
      if (isEdit) {
        try {
          // TODO: Implement actual data fetching
          // const chore = await fetchChoreById(id);
          // setFormData(chore);
        } catch (error) {
          console.error('Error fetching chore:', error);
        }
      }
    };

    fetchChoreData();
  }, [id, isEdit]);

  // Validation logic
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name) newErrors.name = 'Chore name is required';
    if (formData.name.length > 100) newErrors.name = 'Chore name must be 100 characters or less';

    if (!formData.location) newErrors.location = 'Location is required';
    if (!formData.frequency) newErrors.frequency = 'Frequency is required';
    if (!formData.assignedUser) newErrors.assignedUser = 'Assigned user is required';

    // Additional validation for yearly specific date
    if (formData.frequency === 'Yearly' && formData.specificYearlyDate) {
      if (formData.specificYearlyDate.month === undefined) {
        newErrors.specificYearlyDate = 'Month is required for yearly chores';
      }
      if (formData.specificYearlyDate.day === undefined) {
        newErrors.specificYearlyDate = 'Day is required for yearly chores';
      }
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // Handle yearly date specific changes
  const handleYearlyDateChange = (type, value) => {
    setFormData(prevData => ({
      ...prevData,
      specificYearlyDate: {
        ...prevData.specificYearlyDate,
        [type]: parseInt(value, 10)
      }
    }));
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // TODO: Implement actual submission logic
      // if (isEdit) {
      //   await updateChore(id, formData);
      // } else {
      //   await createChore(formData);
      // }
      
      navigate('/chores');
    } catch (error) {
      console.error('Submission error:', error);
      // TODO: Add error handling UI
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel handler
  const handleCancel = () => {
    navigate('/chores');
  };

  // If user doesn't have proper role, don't render the form
  if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl bg-white dark:bg-dark-900 shadow-sm dark:shadow-dark-md transition-colors duration-300">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-dark-50">
          {isEdit ? 'Edit Chore' : 'Create New Chore'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Chore Name */}
        <div className="space-y-2">
          <label 
            htmlFor="name" 
            className="block mb-2 text-gray-700 dark:text-dark-200 font-medium"
          >
            Chore Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-dark-100 transition-colors duration-200"
            maxLength={100}
            required
          />
          {errors.name && <p className="text-red-500 dark:text-red-400 mt-1 text-sm">{errors.name}</p>}
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label 
            htmlFor="location" 
            className="block mb-2 text-gray-700 dark:text-dark-200 font-medium"
          >
            Location
          </label>
          <select
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-dark-100 transition-colors duration-200"
            required
          >
            <option value="">Select Location</option>
            {LOCATIONS.map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
          {errors.location && <p className="text-red-500 dark:text-red-400 mt-1 text-sm">{errors.location}</p>}
        </div>

        {/* Frequency */}
        <div className="space-y-2">
          <label 
            htmlFor="frequency" 
            className="block mb-2 text-gray-700 dark:text-dark-200 font-medium"
          >
            Frequency
          </label>
          <select
            id="frequency"
            name="frequency"
            value={formData.frequency}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-dark-100 transition-colors duration-200"
            required
          >
            <option value="">Select Frequency</option>
            {FREQUENCIES.map(frequency => (
              <option key={frequency} value={frequency}>{frequency}</option>
            ))}
          </select>
          {errors.frequency && <p className="text-red-500 dark:text-red-400 mt-1 text-sm">{errors.frequency}</p>}
        </div>

        {/* Assigned User */}
        <div className="space-y-2">
          <label 
            htmlFor="assignedUser" 
            className="block mb-2 text-gray-700 dark:text-dark-200 font-medium"
          >
            Assigned User
          </label>
          <select
            id="assignedUser"
            name="assignedUser"
            value={formData.assignedUser}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-dark-100 transition-colors duration-200"
            required
          >
            <option value="">Select User</option>
            {USERS.map(userName => (
              <option key={userName} value={userName}>{userName}</option>
            ))}
          </select>
          {errors.assignedUser && <p className="text-red-500 dark:text-red-400 mt-1 text-sm">{errors.assignedUser}</p>}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label 
            htmlFor="description" 
            className="block mb-2 text-gray-700 dark:text-dark-200 font-medium"
          >
            Description (Optional)
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-dark-100 transition-colors duration-200 resize-none min-h-[100px]"
            maxLength={500}
          />
          {errors.description && <p className="text-red-500 dark:text-red-400 mt-1 text-sm">{errors.description}</p>}
        </div>

        {/* Yearly Specific Date (if Yearly frequency is selected) */}
        {formData.frequency === 'Yearly' && (
          <div className="space-y-2">
            <label className="block mb-2 text-gray-700 dark:text-dark-200 font-medium">
              Specific Yearly Date (Optional)
            </label>
            <div className="flex space-x-4">
              <select
                value={formData.specificYearlyDate?.month ?? ''}
                onChange={(e) => handleYearlyDateChange('month', e.target.value)}
                className="w-1/2 px-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-dark-100 transition-colors duration-200"
              >
                <option value="">Select Month</option>
                {monthOptions.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              <select
                value={formData.specificYearlyDate?.day ?? ''}
                onChange={(e) => handleYearlyDateChange('day', e.target.value)}
                className="w-1/2 px-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-dark-100 transition-colors duration-200"
              >
                <option value="">Select Day</option>
                {dayOptions.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            {errors.specificYearlyDate && (
              <p className="text-red-500 dark:text-red-400 mt-1 text-sm">
                {errors.specificYearlyDate}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button 
            type="submit" 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-grow"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : (isEdit ? 'Update Chore' : 'Create Chore')}
          </button>
          <button 
            type="button" 
            className="px-4 py-2 bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-dark-200 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-md transition-colors duration-200 flex-grow"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChoreForm;
