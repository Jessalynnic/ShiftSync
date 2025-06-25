// Test the complete employee onboarding flow
const testData = {
  firstName: "Jane",
  lastName: "Doe",
  dob: "05/15/1990",
  email: "jane.doe@example.com",
  ssn: "1234",
  role: "1", // Assuming role_id 1 exists
  employmentType: "Full-Time",
  businessId: "1" // Assuming business_id 1 exists
};

async function testEmployeeOnboarding() {
  try {
    console.log('🧪 Testing complete employee onboarding flow...');
    
    // Test the API route directly
    const response = await fetch('/api/send-onboarding-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: testData.firstName,
        email_address: testData.email,
        emp_id: "TEST001",
        temp_password: "test123",
        business_name: "Test Business"
      })
    });

    const result = await response.json();
    console.log('📧 Email API Response:', result);

    if (response.ok) {
      console.log('✅ Email integration is working!');
    } else {
      console.log('❌ Email integration failed:', result);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Note: This test should be run in the browser environment
// where the Next.js app is running
console.log('To test the integration:');
console.log('1. Start your Next.js app: npm run dev');
console.log('2. Open the browser console');
console.log('3. Run: testEmployeeOnboarding()'); 