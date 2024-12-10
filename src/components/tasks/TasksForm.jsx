import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import database from '../../data/database.json';

// Previous code remains the same up until the return statement...
// Fast-forward to the Yearly Specific Date section in the return statement:

                <select
                  value={formData.specificYearlyDate?.month ?? ''}
                  onChange={(e) => handleYearlyDateChange('month', e.target.value)}
                  className="w-1/2 px-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-dark-100 transition-colors duration-200"
                >
                  <option value="">Select Month</option>
                  {monthOptions.map((month) => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
                <select
                  value={formData.specificYearlyDate?.day ?? ''}
                  onChange={(e) => handleYearlyDateChange('day', e.target.value)}
                  className="w-1/2 px-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-dark-100 transition-colors duration-200"
                >
                  <option value="">Select Day</option>
                  {dayOptions.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              {errors.specificYearlyDate && (
                <p className="text-red-500 dark:text-red-400 mt-1 text-sm">{errors.specificYearlyDate}</p>
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