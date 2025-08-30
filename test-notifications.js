// Test script for notification workflow simulation
// Run this in the app console or as a development tool

const testNotificationWorkflow = async () => {
  console.log('🧪 Testing Notification Workflow...');
  
  // Simulate adding a medicine
  const testMedicine = {
    id: 'test-medicine-123',
    name: 'Test Medicine',
    dosage: '1 tablet',
    times: ['09:00', '12:30', '17:00'],
    days_of_week: [1, 2, 3, 4, 5, 6, 0], // All days
    is_active: true,
    start_date: new Date().toISOString().split('T')[0],
    end_date: null,
    frequency: 'daily',
    notes: 'Test medicine for notification testing'
  };

  console.log('📋 Test Medicine:', testMedicine);
  
  // Simulate scheduling notifications
  console.log('⏰ Scheduling notifications...');
  const notificationIds = await notificationService.scheduleMedicineReminder(testMedicine);
  console.log('✅ Scheduled notifications:', notificationIds);
  
  // Simulate primary notification firing
  console.log('🔔 Simulating primary notification...');
  const primaryNotification = {
    request: {
      content: {
        title: 'Medicine Reminder',
        body: 'Time to take Test Medicine - 1 tablet',
        data: {
          medicineId: testMedicine.id,
          medicineName: testMedicine.name,
          dosage: testMedicine.dosage,
          time: '09:00',
          logId: 'test-log-123',
          type: 'reminder'
        }
      }
    }
  };
  
  // Simulate funny reminder
  console.log('😄 Simulating funny reminder...');
  const funnyNotification = {
    request: {
      content: {
        title: 'Medicine Reminder',
        body: 'Oops! You forgot your medicine 🕒',
        data: {
          medicineId: '',
          medicineName: testMedicine.name,
          dosage: testMedicine.dosage,
          time: '09:00',
          logId: 'test-log-123',
          type: 'funny_reminder',
          funnyReminderCount: 1
        }
      }
    }
  };
  
  // Simulate marking as taken
  console.log('✅ Simulating mark as taken...');
  await medicineLogService.markAsTaken('test-log-123');
  
  // Check scheduled notifications
  const scheduledNotifications = await notificationService.getScheduledNotifications();
  console.log('📅 Current scheduled notifications:', scheduledNotifications.length);
  
  console.log('🧪 Test completed!');
};

// Export for use in development
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testNotificationWorkflow };
}

// For browser/React Native console
if (typeof window !== 'undefined') {
  window.testNotificationWorkflow = testNotificationWorkflow;
}
