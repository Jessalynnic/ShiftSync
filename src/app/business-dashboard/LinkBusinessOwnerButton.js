'use client';

import { useState } from 'react';
import { getBusinessIdForCurrentUser } from './roleUtils';

export default function LinkBusinessOwnerButton({ employeeId, employeeName, roleName }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleLinkBusinessOwner = async () => {
    if (roleName !== 'Business Owner') {
      setError('This employee does not have the Business Owner role');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const businessId = await getBusinessIdForCurrentUser();
      if (!businessId) {
        setError('No business found for current user');
        return;
      }

      const response = await fetch('/api/link-business-owner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId,
          businessId
        })
      });

      const result = await response.json();

      if (result.success) {
        setMessage(result.message);
      } else {
        setError(result.error || 'Failed to link business owner');
      }
    } catch (err) {
      setError('An error occurred while linking business owner');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (roleName !== 'Business Owner') {
    return null; // Don't show the button for non-business owners
  }

  return (
    <div className="mt-2">
      <button
        onClick={handleLinkBusinessOwner}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs px-3 py-1 rounded transition-colors"
      >
        {loading ? 'Linking...' : 'Link as Business Owner'}
      </button>
      
      {message && (
        <div className="mt-2 text-sm text-green-600">
          {message}
        </div>
      )}
      
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
} 